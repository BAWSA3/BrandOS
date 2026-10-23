/**
 * Reserved Creator Index numbers (migration 045): pure planning rules, shared
 * by scripts/reserve-index-numbers.ts and the tests. No database access here.
 *
 * Decided Oct 23: @jbawsa is No. 0000 (founder); the 28 station reservations
 * ("EmailSignup"."reservationNumber") keep their exact number; every other
 * email signup with an X handle follows in signup order, then account holders
 * not on the list. Reservations are private until claimed (see creator-index).
 * Re-planning never renumbers an existing reservation.
 */

export const FOUNDER_HANDLE = 'jbawsa';
export const FOUNDER_NUMBER = 0;
/** Copy says unclaimed numbers are released on Dec 3; nothing releases automatically yet. */
export const RESERVATION_RELEASE_AT = new Date('2026-12-03T17:00:00.000Z');
/** Test rows on the list, never reserved. */
export const EXCLUDED_SOURCES = new Set(['test', 'cli-test']);

export type ReservationSource = 'founder' | 'station' | 'email' | 'account';

const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;

/** March signups typed free text: "@foo", "x.com/foo", "https://twitter.com/foo?s=21". Lowercase or null. */
export function cleanSignupHandle(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let h = raw.trim();
  const url = h.match(/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})/i);
  if (url) h = url[1];
  h = h.replace(/^@/, '');
  return HANDLE_RE.test(h) ? h.toLowerCase() : null;
}

export interface SignupRow {
  id: string;
  xUsername: string | null;
  createdAt: Date;
  source: string | null;
  unsubscribed: boolean | null;
  reservationNumber: number | null;
}
export interface AccountRow {
  handle: string | null; // the account's X handle
  createdAt: Date;
}
export interface Held {
  handle: string; // lowercase
  number: number;
}
export interface EntryRow extends Held {
  userId: string;
}

export interface PlannedReservation {
  handle: string;
  number: number;
  source: ReservationSource;
  emailSignupId: string | null;
}

export interface Plan {
  reservations: PlannedReservation[]; // new rows to insert
  /** Index entries that join their reservation's number on import (claimed at once). */
  claimMoves: { handle: string; userId: string; from: number; to: number }[];
  /** Entries holding someone else's reserved number: moved to a fresh number first. */
  bumps: { handle: string; userId: string; from: number; to: number }[];
  /** The sequence for future joins must start above this. */
  maxNumber: number;
  conflicts: string[];
  skipped: { excludedSource: number; unsubscribed: number; noHandle: number; duplicate: number };
}

/**
 * Plan the reservations to add. `existing` are reservations already in the
 * table (kept as they are: re-running never renumbers), `entries` are current
 * Index members (a member whose handle gets a reservation moves to that
 * number; a member sitting on someone else's reserved number is bumped).
 */
export function planReservations(input: {
  signups: SignupRow[];
  accounts: AccountRow[];
  existing: Held[];
  entries: EntryRow[];
}): Plan {
  const skipped = { excludedSource: 0, unsubscribed: 0, noHandle: 0, duplicate: 0 };
  const conflicts: string[] = [];

  // One candidate per handle: the earliest signup, but a station number on ANY
  // of that handle's rows wins (the smallest, if they somehow have two).
  const byHandle = new Map<string, { first: SignupRow; station: number | null }>();
  const signups = [...input.signups].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id)
  );
  for (const s of signups) {
    if (s.source && EXCLUDED_SOURCES.has(s.source)) {
      skipped.excludedSource++;
      continue;
    }
    if (s.unsubscribed) {
      skipped.unsubscribed++;
      continue;
    }
    const handle = cleanSignupHandle(s.xUsername);
    if (!handle) {
      skipped.noHandle++;
      continue;
    }
    const station =
      typeof s.reservationNumber === 'number' && s.reservationNumber > 0
        ? s.reservationNumber
        : null;
    const cur = byHandle.get(handle);
    if (!cur) {
      byHandle.set(handle, { first: s, station });
      continue;
    }
    skipped.duplicate++;
    if (station != null) {
      if (cur.station != null && cur.station !== station)
        conflicts.push(
          `@${handle} has two station numbers (${cur.station}, ${station}); kept ${Math.min(cur.station, station)}`
        );
      cur.station = cur.station == null ? station : Math.min(cur.station, station);
    }
  }

  const heldHandles = new Set(input.existing.map((r) => r.handle));
  const usedNumbers = new Map(input.existing.map((r) => [r.number, r.handle]));
  const out: PlannedReservation[] = [];
  const take = (r: PlannedReservation) => {
    out.push(r);
    heldHandles.add(r.handle);
    usedNumbers.set(r.number, r.handle);
  };

  // 1. founder
  if (!heldHandles.has(FOUNDER_HANDLE)) {
    const owner = usedNumbers.get(FOUNDER_NUMBER);
    if (owner) conflicts.push(`No. 0000 is already reserved for @${owner}; founder not reserved`);
    else
      take({
        handle: FOUNDER_HANDLE,
        number: FOUNDER_NUMBER,
        source: 'founder',
        emailSignupId: byHandle.get(FOUNDER_HANDLE)?.first.id ?? null,
      });
  }

  // 2. station numbers, exactly as reserved
  for (const [handle, c] of byHandle) {
    if (c.station == null || heldHandles.has(handle)) continue;
    const owner = usedNumbers.get(c.station);
    if (owner) {
      conflicts.push(
        `station No. ${c.station} for @${handle} is already reserved for @${owner}; @${handle} gets a new number`
      );
      c.station = null;
      continue;
    }
    take({ handle, number: c.station, source: 'station', emailSignupId: c.first.id });
  }

  // 3. everyone else in signup order, then accounts not on the list, after the
  //    highest number anyone holds (and never below 29: 1-28 are the stations)
  const entryMax = input.entries.reduce((m, e) => Math.max(m, e.number), 0);
  let next = Math.max(28, entryMax, ...[...usedNumbers.keys()]) + 1;
  const nextFree = () => {
    while (usedNumbers.has(next)) next++;
    return next++;
  };
  for (const [handle, c] of byHandle) {
    if (heldHandles.has(handle)) continue;
    take({ handle, number: nextFree(), source: 'email', emailSignupId: c.first.id });
  }
  const accounts = [...input.accounts].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
  for (const a of accounts) {
    const handle = cleanSignupHandle(a.handle);
    if (!handle || heldHandles.has(handle)) continue;
    take({ handle, number: nextFree(), source: 'account', emailSignupId: null });
  }

  // 4. current Index members: claim their reservation's number, and move any
  //    member sitting on someone else's reserved number out of the way first
  const reservedFor = new Map<number, string>(usedNumbers);
  const numberOf = new Map<string, number>(
    [...input.existing, ...out].map((r) => [r.handle, r.number])
  );
  const claimMoves: Plan['claimMoves'] = [];
  const bumps: Plan['bumps'] = [];
  const entryNumbers = new Set(input.entries.map((e) => e.number));
  for (const e of input.entries) {
    const mine = numberOf.get(e.handle);
    if (mine != null) {
      if (mine !== e.number)
        claimMoves.push({ handle: e.handle, userId: e.userId, from: e.number, to: mine });
      continue;
    }
    const owner = reservedFor.get(e.number);
    if (owner && owner !== e.handle) {
      let to = nextFree();
      while (entryNumbers.has(to)) to = nextFree();
      bumps.push({ handle: e.handle, userId: e.userId, from: e.number, to });
    }
  }

  const maxNumber = Math.max(entryMax, ...[...usedNumbers.keys()], ...bumps.map((b) => b.to), 0);
  return { reservations: out, claimMoves, bumps, maxNumber, conflicts, skipped };
}

/**
 * Which number a joining handle gets: its reservation (if unclaimed, or
 * claimed by this same account), otherwise none (the next free number).
 */
export function reservedNumberFor(
  reservation: { number: number; claimedByUserId: string | null } | null,
  userId: string
): number | null {
  if (!reservation) return null;
  if (reservation.claimedByUserId && reservation.claimedByUserId !== userId) return null;
  return reservation.number;
}

/** "4,732" scanned handles → "4,700+" (rounded down to the hundred). */
export function scannedLabel(n: number): string | null {
  if (!Number.isFinite(n) || n < 100) return null;
  return `${(Math.floor(n / 100) * 100).toLocaleString('en-US')}+`;
}
