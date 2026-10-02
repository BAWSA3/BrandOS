// Single source of truth for the current TOS/privacy version.
// Bump this date when /terms or /privacy change materially — users who
// accepted an older version can then be re-prompted (future flow).
export const TOS_VERSION = '2026-07-05';

// Query-param value validation for the auth callback (defense-in-depth:
// the param round-trips through OAuth providers / email links).
export function isValidTosVersion(v: string | null): v is string {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
}
