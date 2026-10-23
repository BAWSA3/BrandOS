/**
 * The switch for the Direction 03 system on the launch surfaces (homepage, scan
 * reveal, the Index + claim, pricing). Off = today's pages, unchanged.
 *
 * On when:
 *   - env FIELD_SYSTEM is exactly "true" (everyone; not set anywhere yet), or
 *   - `?field=1` anywhere that isn't production (staging, previews, local), or
 *   - `?field=1` for an admin, on production too (to check prod before turning it on).
 * `?field=0` always forces it off (to compare against today's page).
 *
 * The admin check only runs when `?field=1` is present, so ordinary visitors
 * never pay for it. Pure (tested in test:field).
 */
export type FieldSwitchInput = {
  envFlag?: string;
  /** getAppEnv() (NEXT_PUBLIC_APP_ENV). Not VERCEL_ENV: the staging project deploys as Vercel "production". */
  appEnv?: string;
  param?: string | string[] | null;
  isAdmin?: boolean;
};

export function fieldSwitch({ envFlag, appEnv, param, isAdmin }: FieldSwitchInput): boolean {
  const p = Array.isArray(param) ? param[0] : param;
  if (p === '0') return false;
  if (envFlag === 'true') return true;
  if (p !== '1') return false;
  return appEnv !== 'production' || !!isAdmin;
}

/** Does this request ask for the field (`?field=1`)? Lets callers skip the admin lookup. */
export function asksForField(param?: string | string[] | null): boolean {
  return (Array.isArray(param) ? param[0] : param) === '1';
}
