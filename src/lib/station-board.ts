import prisma from '@/lib/db';
import type { CurrentUser } from '@/lib/auth';
import { isStickerId, type StickerId } from '@/lib/pixel-stickers';

/**
 * The station polaroid board (Phase 1 of docs/specs/STATION-BOARD-AND-BRAND-REVIEWS.md).
 *
 * Friends signed in with X pin one note each on a CLAIMED station (not their
 * own). Notes show instantly; the owner can hide any note; 3 reports auto-hide
 * a note until the owner unhides it. Author handle + avatar are snapshots from
 * the author's verified X connection. Server-only; all reads/writes go through
 * here (the tables are RLS-locked to the API roles).
 */

export const NOTE_MAX = 140;
export const PAGE_SIZE = 12;
export const AUTO_HIDE_REPORTS = 3;

const AVATAR_HOST = 'pbs.twimg.com';

// Severe slurs/abuse only; casual swearing is fine on a friends' wall. Matched
// on word boundaries after normalizing common character swaps.
const BLOCKED = [
  /\bn[i1!]gg(?:a|er|ah|uh)s?\b/i,
  /\bf[a@]gg?(?:ot|it)?s?\b/i,
  /\bk[i1]ke?s?\b/i,
  /\bch[i1]nks?\b/i,
  /\bsp[i1]cs?\b/i,
  /\br[e3]t[a@]rds?\b/i,
  /\btr[a@]nn(?:y|ies)\b/i,
  /\bk[i1]ll\s+(?:your|ur)\s*self\b/i,
  /\bkys\b/i,
];

const URL_RE =
  /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|net|org|io|co|app|xyz|gg|ly|me|link|site|ru|tk)\b\S*/gi;

/** Trim, strip links (no spam on the wall), collapse whitespace, cap length. */
export function cleanNoteBody(raw: string): string {
  return raw
    .replace(URL_RE, '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NOTE_MAX);
}

export function isBlocked(body: string): boolean {
  const norm = body.replace(/[_.*-]/g, '');
  return BLOCKED.some((re) => re.test(body) || re.test(norm));
}

function normalizeHandle(raw: string): string | null {
  const h = raw.replace(/^@/, '').toLowerCase();
  return /^[a-z0-9_]{1,30}$/.test(h) ? h : null;
}

function xConnection(user: CurrentUser | null) {
  return user?.platformConnections.find((c) => c.platform === 'x' && c.status === 'active') ?? null;
}

function avatarFor(user: CurrentUser): string | null {
  const conn = xConnection(user);
  let fromConn: string | undefined;
  try {
    fromConn = conn?.profileData ? JSON.parse(conn.profileData)?.avatar : undefined;
  } catch {
    fromConn = undefined;
  }
  for (const candidate of [fromConn, user.avatar]) {
    if (typeof candidate !== 'string') continue;
    try {
      const u = new URL(candidate);
      if (u.protocol === 'https:' && u.hostname === AVATAR_HOST) return u.toString();
    } catch {
      // not a URL
    }
  }
  return null;
}

export type BoardViewer = {
  signedIn: boolean;
  isOwner: boolean;
  canPost: boolean;
  /** Why canPost is false, for the UI. */
  reason?: 'sign-in' | 'connect-x' | 'own-station' | 'unclaimed';
};

export type PublicNote = {
  id: string;
  handle: string;
  avatar: string | null;
  body: string;
  sticker: StickerId | null;
  createdAt: string;
  hidden?: boolean; // owner view only
  mine?: boolean;
};

export async function getBoard(rawHandle: string, user: CurrentUser | null, all = false) {
  const handle = normalizeHandle(rawHandle);
  if (!handle) return null;
  const station = await prisma.station.findUnique({
    where: { handle },
    select: { id: true, ownerUserId: true },
  });

  const signedIn = !!user;
  if (!station) {
    return {
      claimed: false,
      notes: [] as PublicNote[],
      total: 0,
      myNote: null as PublicNote | null,
      viewer: { signedIn, isOwner: false, canPost: false, reason: 'unclaimed' } as BoardViewer,
    };
  }

  const isOwner = !!user && user.id === station.ownerUserId;
  const visible = isOwner ? {} : { hiddenAt: null };
  const [rows, total, mine] = await Promise.all([
    prisma.stationNote.findMany({
      where: { stationId: station.id, ...visible },
      orderBy: { createdAt: 'desc' },
      take: all ? 200 : PAGE_SIZE,
    }),
    prisma.stationNote.count({ where: { stationId: station.id, ...visible } }),
    user
      ? prisma.stationNote.findUnique({
          where: { stationId_authorUserId: { stationId: station.id, authorUserId: user.id } },
        })
      : null,
  ]);

  const toPublic = (n: (typeof rows)[number]): PublicNote => ({
    id: n.id,
    handle: n.authorXHandle,
    avatar: n.authorAvatarUrl,
    body: n.body,
    sticker: isStickerId(n.sticker) ? n.sticker : null,
    createdAt: n.createdAt.toISOString(),
    ...(isOwner ? { hidden: !!n.hiddenAt } : {}),
    ...(user && n.authorUserId === user.id ? { mine: true } : {}),
  });

  let viewer: BoardViewer;
  if (!user) viewer = { signedIn, isOwner, canPost: false, reason: 'sign-in' };
  else if (isOwner) viewer = { signedIn, isOwner, canPost: false, reason: 'own-station' };
  else if (!xConnection(user)) viewer = { signedIn, isOwner, canPost: false, reason: 'connect-x' };
  else viewer = { signedIn, isOwner, canPost: true };

  return {
    claimed: true,
    notes: rows.map(toPublic),
    total,
    myNote: mine ? toPublic(mine) : null,
    viewer,
  };
}

export type WriteResult =
  | { ok: true }
  | {
      ok: false;
      status: number;
      error: string;
    };

export async function upsertNote(
  rawHandle: string,
  user: CurrentUser,
  input: { body: unknown; sticker: unknown }
): Promise<WriteResult> {
  const handle = normalizeHandle(rawHandle);
  if (!handle) return { ok: false, status: 400, error: 'Invalid station' };
  const conn = xConnection(user);
  if (!conn) return { ok: false, status: 403, error: 'Sign in with X to pin a note.' };

  const body = typeof input.body === 'string' ? cleanNoteBody(input.body) : '';
  if (!body) return { ok: false, status: 400, error: 'Write something first (links are removed).' };
  if (isBlocked(body)) return { ok: false, status: 400, error: "That note can't be posted." };
  const sticker = input.sticker == null || input.sticker === '' ? null : input.sticker;
  if (sticker !== null && !isStickerId(sticker)) {
    return { ok: false, status: 400, error: 'Unknown sticker' };
  }

  const station = await prisma.station.findUnique({ where: { handle } });
  if (!station) return { ok: false, status: 404, error: 'This station has not been claimed yet.' };
  if (station.ownerUserId === user.id) {
    return { ok: false, status: 403, error: "You can't pin a note on your own station." };
  }

  const snapshot = { authorXHandle: conn.platformUsername, authorAvatarUrl: avatarFor(user) };
  await prisma.stationNote.upsert({
    where: { stationId_authorUserId: { stationId: station.id, authorUserId: user.id } },
    create: { stationId: station.id, authorUserId: user.id, body, sticker, ...snapshot },
    // Editing doesn't un-hide a note the owner or reports hid.
    update: { body, sticker, ...snapshot },
  });
  return { ok: true };
}

export async function deleteOwnNote(rawHandle: string, user: CurrentUser): Promise<WriteResult> {
  const handle = normalizeHandle(rawHandle);
  if (!handle) return { ok: false, status: 400, error: 'Invalid station' };
  const station = await prisma.station.findUnique({ where: { handle }, select: { id: true } });
  if (!station) return { ok: false, status: 404, error: 'Not found' };
  await prisma.stationNote.deleteMany({ where: { stationId: station.id, authorUserId: user.id } });
  return { ok: true };
}

export async function noteAction(
  rawHandle: string,
  noteId: string,
  user: CurrentUser,
  action: unknown
): Promise<WriteResult> {
  const handle = normalizeHandle(rawHandle);
  if (!handle || !/^[0-9a-f-]{36}$/i.test(noteId)) {
    return { ok: false, status: 400, error: 'Invalid request' };
  }
  const note = await prisma.stationNote.findUnique({
    where: { id: noteId },
    include: { station: { select: { handle: true, ownerUserId: true } } },
  });
  if (!note || note.station.handle !== handle)
    return { ok: false, status: 404, error: 'Not found' };
  const isOwner = note.station.ownerUserId === user.id;

  if (action === 'hide' || action === 'unhide') {
    if (!isOwner) return { ok: false, status: 403, error: 'Only the station owner can do that.' };
    await prisma.stationNote.update({
      where: { id: noteId },
      data:
        action === 'hide'
          ? { hiddenAt: new Date(), hiddenBy: 'owner' }
          : { hiddenAt: null, hiddenBy: null, reportCount: 0 },
    });
    if (action === 'unhide') await prisma.noteReport.deleteMany({ where: { noteId } });
    return { ok: true };
  }

  if (action === 'report') {
    if (note.authorUserId === user.id) {
      return { ok: false, status: 400, error: "You can't report your own note." };
    }
    try {
      await prisma.noteReport.create({ data: { noteId, reporterUserId: user.id } });
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002') return { ok: true }; // already reported
      throw e;
    }
    const count = await prisma.noteReport.count({ where: { noteId } });
    await prisma.stationNote.update({
      where: { id: noteId },
      data: {
        reportCount: count,
        ...(count >= AUTO_HIDE_REPORTS && !note.hiddenAt
          ? { hiddenAt: new Date(), hiddenBy: 'reports' }
          : {}),
      },
    });
    return { ok: true };
  }

  return { ok: false, status: 400, error: 'Unknown action' };
}
