import { getCurrentUser } from '@/lib/auth';
import { getAppEnv } from '@/lib/app-env';
import { asksForField, fieldSwitch } from './switch';

type SP = Record<string, string | string[] | undefined>;

/**
 * Server pages: is the Direction 03 system on for this request? Pass the
 * already-loaded user when the page has one, to avoid a second lookup.
 */
export async function fieldSystemOn(
  sp: SP = {},
  user?: { role?: string | null } | null
): Promise<boolean> {
  const param = sp.field;
  let isAdmin = false;
  if (asksForField(param) && getAppEnv() === 'production') {
    const u = user !== undefined ? user : await getCurrentUser().catch(() => null);
    isAdmin = u?.role === 'admin';
  }
  return fieldSwitch({
    envFlag: process.env.FIELD_SYSTEM,
    appEnv: getAppEnv(),
    param,
    isAdmin,
  });
}
