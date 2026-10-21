import prisma from '@/lib/db';
import { hasPro, trialEndsAt } from '@/lib/billing';

/**
 * BrandOS MCP allowance (migration 034, "McpUsage").
 *
 *   Free plan     10 uses per calendar week, resets Monday 00:00 UTC
 *   Pro / trial   unlimited (docs/LAUNCH-PLAN.md, decided 2026-10-18; the old
 *                 "first 30 days unlimited for every signup" rule is gone)
 *
 * A use = one tool call that did fresh work (model / data calls). Cache hits,
 * posts already on the dashboard and failures are free, so callers record a
 * use only after the work succeeds.
 */

export const FREE_PER_WEEK = 10;
const DAY_MS = 86_400_000;

export interface McpAccount {
  id: string;
  createdAt: Date;
  subscriptionTier: string;
  subscriptionStatus: string;
  currentPeriodEnd?: Date | null;
  role?: string | null;
}

export type Allowance =
  | { kind: 'unlimited'; reason: 'trial' | 'paid'; trialEnds?: Date }
  | { kind: 'metered'; used: number; left: number; resetsAt: Date };

/** Monday 00:00 UTC of the current week. */
export function weekStart(now = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const sinceMonday = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - sinceMonday * DAY_MS);
}

export async function allowance(a: McpAccount, now = new Date()): Promise<Allowance> {
  if (hasPro(a)) {
    const ends = trialEndsAt(a);
    return ends
      ? { kind: 'unlimited', reason: 'trial', trialEnds: ends }
      : { kind: 'unlimited', reason: 'paid' };
  }
  const start = weekStart(now);
  const used = await prisma.mcpUsage.count({ where: { userId: a.id, createdAt: { gte: start } } });
  return {
    kind: 'metered',
    used,
    left: Math.max(0, FREE_PER_WEEK - used),
    resetsAt: new Date(start.getTime() + 7 * DAY_MS),
  };
}

export async function recordUse(userId: string, tool: string): Promise<void> {
  await prisma.mcpUsage.create({ data: { userId, tool } }).catch((e) => {
    console.error('[mcp] usage record failed:', e);
  });
}

const day = (d: Date) =>
  d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

/** One line for the end of every reply. `spent` = this call counted. */
export function allowanceLine(a: Allowance, spent: boolean): string {
  if (a.kind === 'unlimited') {
    return a.reason === 'paid'
      ? 'BrandOS: unlimited reads on your plan.'
      : `BrandOS: unlimited reads during your Pro trial (until ${day(a.trialEnds!)}).`;
  }
  const left = Math.max(0, a.left - (spent ? 1 : 0));
  return `BrandOS: ${left} of ${FREE_PER_WEEK} free reads left this week · resets Mon.`;
}

export function limitReached(a: Extract<Allowance, { kind: 'metered' }>, site: string): string {
  return (
    `You've used your ${FREE_PER_WEEK} free BrandOS reads this week. They reset ${day(a.resetsAt)} ` +
    `(Monday 00:00 UTC). Want unlimited reads? Start a 7-day Pro trial: ${site}/pricing?utm_source=mcp`
  );
}
