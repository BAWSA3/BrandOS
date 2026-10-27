/**
 * Dashboard v2 gate, pure (decided 27 Oct 2026): on for testers, off for the
 * public until launch. Both must hold:
 *   1. the env flag DASHBOARD_V2 is on ("1" / "true" / "on");
 *   2. the member redeemed an early-access code (EarlyAccessCode, mig 049),
 *      or is an admin (Bawsa's own account).
 * Data side: src/lib/dashboard-v2.ts. Tests: scripts/test-dashboard-v2.ts.
 */
export function dashboardV2Rule(input: {
  envFlag: string | undefined;
  role: string | null | undefined;
  redeemed: boolean;
}): boolean {
  const flag = (input.envFlag ?? '').trim().toLowerCase();
  if (!['1', 'true', 'on'].includes(flag)) return false;
  return input.role === 'admin' || input.redeemed;
}
