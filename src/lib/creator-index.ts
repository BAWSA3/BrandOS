import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { normalizeArchetypeName } from '@/lib/archetype-names';
import { reservedNumberFor, scannedLabel } from '@/lib/index-reservations';
import {
  FEATURED_MAX,
  FRESH_READ_DAYS,
  PAGE_SIZE,
  standsOut,
  viewDay,
  type IndexFilters,
  type JoinInput,
} from '@/lib/index-rules';

/**
 * The BrandOS Creator Index, server side (migration 044). Rules and
 * validation live in src/lib/index-rules.ts. Every read degrades to "empty /
 * not a member" if the tables aren't there yet, so nothing breaks before 044
 * is applied; writes surface a plain error instead.
 */

const DAY_MS = 86_400_000;

/** Prisma filter: users who stand out (paid card or admin). Mirrors standsOut(). */
const STANDOUT_USER: Prisma.UserWhereInput = {
  OR: [
    { role: 'admin' },
    {
      subscriptionTier: { in: ['PRO', 'AGENCY', 'ENTERPRISE'] },
      subscriptionStatus: { in: ['ACTIVE', 'TRIALING'] },
    },
  ],
};

export async function getEntry(userId: string) {
  return prisma.indexEntry.findUnique({ where: { userId } }).catch(() => null);
}

/** The account's latest saved brand read (what the Index shows), or null. */
export async function latestRead(userId: string) {
  return prisma.brandScan
    .findFirst({
      where: { userId, status: 'active' },
      orderBy: { scannedAt: 'desc' },
      select: { score: true, archetype: true, scannedAt: true },
    })
    .catch(() => null);
}

export const isFresh = (scannedAt: Date, now = Date.now()) =>
  now - scannedAt.getTime() < FRESH_READ_DAYS * DAY_MS;

export type JoinResult =
  | {
      ok: true;
      number: number;
      created: boolean;
      stale: boolean;
      reserved?: boolean;
      joinedAt: Date;
      archetype: string | null;
    }
  | { ok: false; status: number; error: string; needsScan?: boolean };

/**
 * Join (or update) the Index with the account's own X handle and latest brand
 * read. No handle is taken from the request: it's always the signed-in user's
 * own active X connection. With no read at all the client scans first
 * (`needsScan`). A read older than 7 days still joins right away and comes
 * back `stale: true`, so the caller can refresh it after responding.
 */
export async function joinIndex(
  user: {
    id: string;
    platformConnections: { platform: string; platformUsername: string; platformUserId: string }[];
  },
  input: JoinInput
): Promise<JoinResult> {
  const x = user.platformConnections.find((pc) => pc.platform === 'x');
  if (!x) return { ok: false, status: 400, error: 'Connect your X account to join the Index.' };
  const display = x.platformUsername.replace(/^@/, '').slice(0, 15);
  const handle = display.toLowerCase();
  if (!/^[a-z0-9_]{1,15}$/.test(handle))
    return {
      ok: false,
      status: 400,
      error: 'Your X handle looks unusual. Reconnect X and try again.',
    };

  const read = await latestRead(user.id);
  if (!read)
    return { ok: false, status: 409, error: 'Get your brand read first.', needsScan: true };

  const data = {
    handle,
    displayHandle: display,
    xUserId: /^[0-9]{1,25}$/.test(x.platformUserId) ? x.platformUserId : null,
    niches: input.niches,
    blurb: input.blurb,
    score: Math.max(0, Math.min(100, Math.round(read.score))),
    archetype:
      (normalizeArchetypeName(read.archetype) || read.archetype || '').slice(0, 40) || null,
    listed: true,
    updatedAt: new Date(),
  };
  try {
    const existing = await prisma.indexEntry.findUnique({ where: { userId: user.id } });
    const stale = !isFresh(read.scannedAt);
    if (existing) {
      const entry = await prisma.indexEntry.update({ where: { userId: user.id }, data });
      return {
        ok: true,
        number: entry.number,
        created: false,
        stale,
        joinedAt: entry.joinedAt,
        archetype: entry.archetype,
      };
    }
    // A reserved number (migration 045) is claimed by joining as that handle:
    // the handle is always the signed-in account's own X connection.
    const reservation = await findReservation(handle);
    const reserved = reservedNumberFor(reservation ?? null, user.id);
    if (reserved != null) {
      const entry = await prisma.$transaction(async (tx) => {
        const created = await tx.indexEntry.create({
          data: { ...data, userId: user.id, number: reserved },
        });
        await tx.indexReservation.update({
          where: { handle },
          data: { claimedAt: new Date(), claimedByUserId: user.id },
        });
        return created;
      });
      return {
        ok: true,
        number: entry.number,
        created: true,
        stale,
        reserved: true,
        joinedAt: entry.joinedAt,
        archetype: entry.archetype,
      };
    }
    const number = reservation === undefined ? undefined : await nextFreeNumber();
    const entry = await prisma.indexEntry.create({
      data: { ...data, userId: user.id, ...(number != null ? { number } : {}) },
    });
    return {
      ok: true,
      number: entry.number,
      created: true,
      stale,
      joinedAt: entry.joinedAt,
      archetype: entry.archetype,
    };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
      return {
        ok: false,
        status: 409,
        error: `@${display} is already in the Index on another account.`,
      };
    console.error('[creator-index] join failed', e);
    return { ok: false, status: 503, error: "The Index isn't open yet. Try again soon." };
  }
}

/**
 * The reservation for a handle (migration 045), null if it has none, or
 * undefined if the reservations table isn't there yet (joins then use the
 * plain sequence). Never throws.
 */
export async function findReservation(
  handle: string
): Promise<{ number: number; claimedByUserId: string | null } | null | undefined> {
  try {
    return await prisma.indexReservation.findUnique({
      where: { handle },
      select: { number: true, claimedByUserId: true },
    });
  } catch {
    return undefined;
  }
}

/**
 * The next Index number for a join without a reservation: the sequence's next
 * value, skipping any number reserved for someone else or already used (the
 * import script moves the sequence above every reservation, so this is a
 * safety net). Undefined lets the column default decide.
 */
async function nextFreeNumber(): Promise<number | undefined> {
  for (let i = 0; i < 20; i++) {
    const rows = await prisma.$queryRaw<
      { n: bigint }[]
    >`select nextval('"IndexEntry_number_seq"') as n`;
    const n = Number(rows[0]?.n);
    if (!Number.isFinite(n)) return undefined;
    const [held, used] = await Promise.all([
      prisma.indexReservation.findUnique({ where: { number: n }, select: { handle: true } }),
      prisma.indexEntry.findUnique({ where: { number: n }, select: { id: true } }),
    ]);
    if (!held && !used) return n;
  }
  return undefined;
}

/**
 * The signed-in account's own reserved number, if it has one and hasn't
 * joined yet. Only ever looked up for the account's own X handle, so nobody
 * can learn whether someone else is on the list.
 */
export async function ownReservation(user: {
  id: string;
  platformConnections: { platform: string; platformUsername: string }[];
}): Promise<number | null> {
  const x = user.platformConnections.find((pc) => pc.platform === 'x');
  const handle = x?.platformUsername.replace(/^@/, '').toLowerCase();
  if (!handle || !/^[a-z0-9_]{1,15}$/.test(handle)) return null;
  return reservedNumberFor((await findReservation(handle)) ?? null, user.id);
}

/** Header numbers: unclaimed reserved numbers and creators ever scanned (aggregates only). */
let scannedCache: { at: number; label: string | null } | null = null;
export async function indexAggregates(): Promise<{ reserved: number; scanned: string | null }> {
  const reserved = await prisma.indexReservation
    .count({ where: { claimedAt: null } })
    .catch(() => 0);
  if (!scannedCache || Date.now() - scannedCache.at > 3_600_000) {
    const rows = await prisma.$queryRaw<{ n: bigint }[]>`
      select count(distinct lower(username)) as n from "BrandScans"`.catch(() => []);
    scannedCache = { at: Date.now(), label: scannedLabel(Number(rows[0]?.n ?? 0)) };
  }
  return { reserved, scanned: scannedCache.label };
}

/** Leave (hide) or come back. Keeps the number. */
export async function setListed(userId: string, listed: boolean): Promise<boolean> {
  const r = await prisma.indexEntry
    .updateMany({ where: { userId }, data: { listed, updatedAt: new Date() } })
    .catch(() => ({ count: 0 }));
  return r.count > 0;
}

/** A new brand read was saved: keep the member's Index card current. Never throws. */
export async function refreshEntryFromRead(userId: string, score: number, archetype: string) {
  await prisma.indexEntry
    .updateMany({
      where: { userId },
      data: {
        score: Math.max(0, Math.min(100, Math.round(score))),
        archetype: (normalizeArchetypeName(archetype) || archetype || '').slice(0, 40) || null,
        updatedAt: new Date(),
      },
    })
    .catch(() => null);
}

export interface IndexCard {
  handle: string;
  number: number;
  name: string | null;
  avatar: string | null;
  score: number | null;
  archetype: string | null;
  niches: string[];
  blurb: string;
  featured: boolean;
  joinedAt: string; // ISO, for "Entered 23 Oct 2026"
}

const CARD_SELECT = {
  displayHandle: true,
  number: true,
  joinedAt: true,
  score: true,
  archetype: true,
  niches: true,
  blurb: true,
  user: {
    select: {
      name: true,
      avatar: true,
      role: true,
      subscriptionTier: true,
      subscriptionStatus: true,
    },
  },
} as const;

type CardRow = Prisma.IndexEntryGetPayload<{ select: typeof CARD_SELECT }>;

const toCard = (r: CardRow): IndexCard => ({
  handle: r.displayHandle,
  number: r.number,
  name: r.user.name,
  avatar: r.user.avatar,
  score: r.score,
  archetype: r.archetype,
  niches: r.niches,
  blurb: r.blurb,
  joinedAt: r.joinedAt.toISOString(),
  featured: standsOut({
    role: String(r.user.role),
    subscriptionTier: String(r.user.subscriptionTier),
    subscriptionStatus: String(r.user.subscriptionStatus),
  }),
});

function filterWhere(f: IndexFilters): Prisma.IndexEntryWhereInput {
  return {
    listed: true,
    ...(f.niche ? { niches: { has: f.niche } } : {}),
    ...(f.archetype ? { archetype: { equals: f.archetype, mode: 'insensitive' } } : {}),
    ...(f.min > 0 || f.max < 100 ? { score: { gte: f.min, lte: f.max } } : {}),
  };
}

export interface IndexPage {
  members: number; // everyone listed (the live count)
  matching: number; // members matching the filters (featured included)
  featured: IndexCard[]; // first page only
  cards: IndexCard[];
  page: number;
  pages: number;
  archetypes: string[]; // for the filter
}

const EMPTY: IndexPage = {
  members: 0,
  matching: 0,
  featured: [],
  cards: [],
  page: 1,
  pages: 1,
  archetypes: [],
};

/** One page of the Index: Featured (paid) members first, then everyone else, newest first. */
export async function listIndex(f: IndexFilters): Promise<IndexPage> {
  try {
    const where = filterWhere(f);
    const featuredWhere = { ...where, user: STANDOUT_USER };
    const restWhere = { ...where, NOT: { user: STANDOUT_USER } };
    const [members, featuredCount, restCount, archetypeRows] = await Promise.all([
      prisma.indexEntry.count({ where: { listed: true } }),
      prisma.indexEntry.count({ where: featuredWhere }),
      prisma.indexEntry.count({ where: restWhere }),
      prisma.indexEntry.findMany({
        where: { listed: true, archetype: { not: null } },
        distinct: ['archetype'],
        select: { archetype: true },
        take: 40,
      }),
    ]);
    const pages = Math.max(1, Math.ceil(restCount / PAGE_SIZE));
    const page = Math.min(f.page, pages);
    const [featured, rest] = await Promise.all([
      page === 1
        ? prisma.indexEntry.findMany({
            where: featuredWhere,
            orderBy: { joinedAt: 'desc' },
            take: FEATURED_MAX,
            select: CARD_SELECT,
          })
        : Promise.resolve([]),
      prisma.indexEntry.findMany({
        where: restWhere,
        orderBy: { joinedAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: CARD_SELECT,
      }),
    ]);
    return {
      members,
      matching: featuredCount + restCount,
      featured: featured.map(toCard),
      cards: rest.map(toCard),
      page,
      pages,
      archetypes: archetypeRows
        .map((r) => r.archetype)
        .filter((a): a is string => !!a)
        .sort(),
    };
  } catch (e) {
    // before migration 044 the table is missing (P2021): an empty Index, quietly
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2021'))
      console.error('[creator-index] list unavailable', e);
    return EMPTY;
  }
}

/** One listed member's card (a shared ?m= link), or null. */
export async function cardFor(handle: string): Promise<IndexCard | null> {
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return null;
  const row = await prisma.indexEntry
    .findFirst({ where: { handle: handle.toLowerCase(), listed: true }, select: CARD_SELECT })
    .catch(() => null);
  return row ? toCard(row) : null;
}

export async function memberCount(): Promise<number> {
  return prisma.indexEntry.count({ where: { listed: true } }).catch(() => 0);
}

/**
 * A signed-in visitor opened a member's /@handle page. Skips the member
 * themselves, unlisted members and anonymous visitors; one row per viewer per
 * member per UTC day. The viewer's team workspace (if any) is kept so the
 * member can see which brand/agency teams looked. Never throws.
 */
export async function recordIndexView(
  handle: string,
  viewer: {
    id: string;
    workspaceMemberships?: { workspace: { id: string; type: string } }[];
  } | null,
  now = new Date()
): Promise<boolean> {
  if (!viewer || !/^[A-Za-z0-9_]{1,15}$/.test(handle)) return false;
  try {
    const entry = await prisma.indexEntry.findUnique({
      where: { handle: handle.toLowerCase() },
      select: { id: true, userId: true, listed: true },
    });
    if (!entry || !entry.listed || entry.userId === viewer.id) return false;
    const team =
      viewer.workspaceMemberships?.find((m) => m.workspace.type === 'team')?.workspace.id ?? null;
    const r = await prisma.indexView.createMany({
      data: [
        {
          entryId: entry.id,
          viewerUserId: viewer.id,
          viewerWorkspaceId: team,
          day: new Date(`${viewDay(now)}T00:00:00.000Z`),
          viewedAt: now,
        },
      ],
      skipDuplicates: true,
    });
    return r.count > 0;
  } catch {
    return false;
  }
}

export interface ViewSummary {
  people: number; // distinct signed-in viewers in the window
  teams: { name: string; views: number }[]; // brand/agency teams among them
}

/** Who viewed a member's page in the last `days` days (counts + team names, never people's names). */
export async function viewSummary(
  entryId: string,
  days = 7,
  now = Date.now()
): Promise<ViewSummary> {
  try {
    const rows = await prisma.indexView.findMany({
      where: { entryId, viewedAt: { gte: new Date(now - days * DAY_MS) } },
      select: { viewerUserId: true, viewerWorkspace: { select: { name: true } } },
      take: 5000,
    });
    const people = new Set(rows.map((r) => r.viewerUserId)).size;
    const teams = new Map<string, number>();
    for (const r of rows) {
      const name = r.viewerWorkspace?.name;
      if (name) teams.set(name, (teams.get(name) ?? 0) + 1);
    }
    return {
      people,
      teams: [...teams.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, views]) => ({ name, views })),
    };
  } catch {
    return { people: 0, teams: [] };
  }
}

export interface MemberProfile {
  number: number;
  niches: string[];
  blurb: string;
  featured: boolean;
  /**
   * The Verified badge's slot (campaign Nov 9, docs/TRACK-RECORD.md). Always
   * false until its checks exist; the page already renders the mark when true.
   */
  verified: boolean;
  /** Pro only: the last saved brand reads, oldest first. */
  history: { at: string; score: number }[] | null;
  /** Pro only: their best recent posts by BrandOS fit. */
  best: { tweetId: string; excerpt: string; fit: number; multiple: number | null }[] | null;
}

/** The Index side of a /@handle page: null unless the handle is a listed member. */
export async function memberProfile(handle: string): Promise<MemberProfile | null> {
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return null;
  try {
    const entry = await prisma.indexEntry.findUnique({
      where: { handle: handle.toLowerCase() },
      select: {
        number: true,
        niches: true,
        blurb: true,
        listed: true,
        userId: true,
        user: { select: { role: true, subscriptionTier: true, subscriptionStatus: true } },
      },
    });
    if (!entry || !entry.listed) return null;
    const featured = standsOut({
      role: String(entry.user.role),
      subscriptionTier: String(entry.user.subscriptionTier),
      subscriptionStatus: String(entry.user.subscriptionStatus),
    });
    let history: MemberProfile['history'] = null;
    let best: MemberProfile['best'] = null;
    if (featured) {
      const [scans, posts] = await Promise.all([
        prisma.brandScan.findMany({
          where: { userId: entry.userId, status: 'active' },
          orderBy: { scannedAt: 'desc' },
          take: 12,
          select: { scannedAt: true, score: true },
        }),
        prisma.postScore.findMany({
          where: { userId: entry.userId, postedAt: { gte: new Date(Date.now() - 60 * DAY_MS) } },
          orderBy: [{ fit: 'desc' }, { postedAt: 'desc' }],
          take: 3,
          select: { tweetId: true, excerpt: true, fit: true, multiple: true },
        }),
      ]);
      history = scans.reverse().map((s) => ({ at: s.scannedAt.toISOString(), score: s.score }));
      best = posts;
    }
    return {
      number: entry.number,
      niches: entry.niches,
      blurb: entry.blurb,
      featured,
      verified: false,
      history,
      best,
    };
  } catch {
    return null;
  }
}
