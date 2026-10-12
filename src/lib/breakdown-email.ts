import prisma from '@/lib/db';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import { normalizeArchetypeName } from '@/lib/archetype-names';
import { sendOnce, type SendResult } from '@/lib/launch-emails';
import type { NewsletterContent } from '@/lib/newsletter-template';

/**
 * "Get The Full Breakdown": after a homepage scan the visitor leaves an email
 * and gets the full scan breakdown (phases, strengths, fixes, next moves,
 * pillars), plus an early-access spot for BrandOS Dashboards. Server-only.
 *
 * Content comes from our own record of the handle's latest scan ("BrandScans",
 * written by /api/x-brand-score), never from the client. Sent through
 * sendOnce(), so each address gets each handle's breakdown at most once.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';

const esc = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!
  );

/** Campaign key: one breakdown per address per scanned handle. */
export const breakdownCampaign = (handle: string) => `breakdown:${handle.toLowerCase()}`;

export interface ScanBreakdown {
  handle: string;
  score: number;
  archetype: string | null;
  phases: { key: string; score: number; insight: string | null }[];
  strengths: string[];
  improvements: string[];
  nextMoves: string[];
  pillars: string[];
  summary: string | null;
}

function parse<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const strings = (v: unknown, max: number): string[] =>
  Array.isArray(v)
    ? v
        .map((x) =>
          typeof x === 'string'
            ? x
            : x && typeof x === 'object' && 'name' in x
              ? String((x as { name: unknown }).name)
              : ''
        )
        .map((s) => s.trim().slice(0, 400))
        .filter(Boolean)
        .slice(0, max)
    : [];

/**
 * The handle's latest scan (the one they just saw), or null if never scanned.
 * A quick/fallback scan has no write-up, so only the score and phases are set.
 */
export async function getScanBreakdown(handle: string): Promise<ScanBreakdown | null> {
  const row = await prisma.brandScans.findFirst({
    where: { username: { equals: handle, mode: 'insensitive' } },
    orderBy: { createdAt: 'desc' },
    select: {
      username: true,
      score: true,
      archetype: true,
      phaseScores: true,
      insights: true,
      strengths: true,
      improvements: true,
      nextMoves: true,
      contentPillars: true,
      summary: true,
    },
  });
  if (!row) return null;
  const scores = parse<Record<string, unknown>>(row.phaseScores) ?? {};
  const insights = parse<Record<string, unknown>>(row.insights) ?? {};
  const phases = (['define', 'check', 'generate', 'scale'] as const)
    .map((k) => ({
      key: k[0].toUpperCase() + k.slice(1),
      score: typeof scores[k] === 'number' ? Math.round(scores[k] as number) : NaN,
      insight: strings(insights[k], 1)[0] ?? null,
    }))
    .filter((p) => Number.isFinite(p.score));
  return {
    handle: row.username.toLowerCase(),
    score: row.score,
    archetype: row.archetype ? normalizeArchetypeName(row.archetype) : null,
    phases,
    strengths: strings(parse(row.strengths), 3),
    improvements: strings(parse(row.improvements), 3),
    nextMoves: strings(parse(row.nextMoves), 3),
    pillars: strings(parse(row.contentPillars), 3),
    summary: row.summary ? row.summary.slice(0, 1200) : null,
  };
}

const list = (items: string[]) => items.map((i) => `• ${esc(i)}`).join('<br/>');

export function breakdownContent(b: ScanBreakdown): NewsletterContent {
  const info = b.archetype ? getArchetypeInfo(b.archetype) : null;
  const sections: NewsletterContent['sections'] = [
    {
      type: 'stat',
      label: `${b.score}/100`,
      content: `@${esc(b.handle)}${info ? ` · ${esc(info.name)}` : ''}`,
    },
  ];
  if (b.summary) sections.push({ type: 'text', content: esc(b.summary) });
  else
    sections.push({
      type: 'text',
      content:
        `Your scan ran in quick mode, so this breakdown covers your score${b.phases.length ? ' and four phases' : ''}. ` +
        "Rescan for the full write-up: what's working, what to fix, and your next moves.",
    });
  if (b.phases.length) {
    sections.push({ type: 'heading', content: 'Your four phases' });
    sections.push({
      type: 'text',
      content: b.phases
        .map((p) => `<b>${p.key} · ${p.score}</b>${p.insight ? `<br/>${esc(p.insight)}` : ''}`)
        .join('<br/><br/>'),
    });
  }
  if (b.strengths.length) {
    sections.push({ type: 'heading', content: "What's working" });
    sections.push({ type: 'text', content: list(b.strengths) });
  }
  if (b.improvements.length) {
    sections.push({ type: 'heading', content: 'What to fix' });
    sections.push({ type: 'text', content: list(b.improvements) });
  }
  if (b.nextMoves.length) {
    sections.push({ type: 'heading', content: 'Your next moves' });
    sections.push({ type: 'text', content: list(b.nextMoves) });
  }
  if (b.pillars.length) {
    sections.push({ type: 'heading', content: 'Your content pillars' });
    sections.push({ type: 'text', content: list(b.pillars) });
  }
  sections.push({ type: 'divider', content: '' });
  sections.push({
    type: 'text',
    content:
      "<b>You've secured an early access spot for BrandOS Dashboards.</b> Track your brand score over time, see exactly which phase to work on next, and level up as your brand grows. We'll email you the moment it opens.",
  });
  sections.push({
    type: 'cta',
    content: 'Rescan anytime',
    url: APP_URL,
  });
  return {
    subject: `Your BrandOS breakdown: @${b.handle} scored ${b.score}`,
    preheader: `Your four phases, what's working, what to fix, and your next moves.`,
    sections,
  };
}

/** Send the breakdown for `scan` to a signup, at most once per address per handle. */
export function sendBreakdown(signupId: string, scan: ScanBreakdown): Promise<SendResult> {
  return sendOnce(signupId, breakdownCampaign(scan.handle), () => breakdownContent(scan));
}
