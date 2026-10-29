import { earlyAccessFor } from '@/lib/early-access';
import { dashboardV2Rule } from '@/lib/dashboard-v2-rules';
import { isEarlyAccount } from '@/lib/early-access-rules';

/**
 * Server: is dashboard v2 on for this member? Rule in dashboard-v2-rules.ts.
 * Off on any doubt: before mig 049 earlyAccessFor() returns null, so only
 * admins see v2. Turning DASHBOARD_V2 off sends everyone back to today's
 * dashboard at once (no data moves either way).
 */
export async function dashboardV2For(user: {
  id: string;
  role?: unknown;
  createdAt?: Date | null;
}): Promise<boolean> {
  const envFlag = process.env.DASHBOARD_V2;
  const role = typeof user.role === 'string' ? user.role : String(user.role ?? '');
  // cheap exits first: no flag, no DB read
  if (!dashboardV2Rule({ envFlag, role, redeemed: true })) return false;
  if (role === 'admin') return true;
  if (isEarlyAccount(user.createdAt)) return true;
  const access = await earlyAccessFor(user.id);
  return dashboardV2Rule({ envFlag, role, redeemed: !!access });
}
