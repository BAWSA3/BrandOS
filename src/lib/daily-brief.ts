import Anthropic from '@anthropic-ai/sdk';
import type { DailyBrief } from '@prisma/client';
import { prisma } from './db';

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 400;

type Phase = 'define' | 'check' | 'generate' | 'scale';

const PHASE_DESCRIPTIONS: Record<Phase, string> = {
  define: 'how clearly the creator has positioned who they are, what they do, and who they serve',
  check: 'how well they validate ideas with their audience before going big on them',
  generate: 'how consistently they ship content that lands',
  scale: 'how much their content reaches beyond their existing audience',
};

const PHASE_KEYS: Phase[] = ['define', 'check', 'generate', 'scale'];

export type BriefError =
  | { kind: 'no_scan' }
  | { kind: 'no_workspace' }
  | { kind: 'generation_failed'; reason: string };

export type BriefResult = { brief: DailyBrief } | { error: BriefError };

export function todayUtcDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function pickWeakestPhase(phaseScores: unknown): { phase: Phase; score: number } | null {
  if (!phaseScores || typeof phaseScores !== 'object') return null;
  const ps = phaseScores as Partial<Record<Phase, unknown>>;
  let weakest: { phase: Phase; score: number } | null = null;
  for (const phase of PHASE_KEYS) {
    const v = ps[phase];
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;
    if (!weakest || v < weakest.score) weakest = { phase, score: Math.round(v) };
  }
  return weakest;
}

async function generateBriefBody(args: {
  archetype: string;
  weakestPhase: Phase;
  weakestPhaseScore: number;
  overallScore: number;
}): Promise<{ idea: string; action: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY');
  }

  const anthropic = new Anthropic({ apiKey });

  const userPrompt = `You write daily briefs for creators on X. Given a creator's brand archetype and their weakest brand phase, output ONE concrete content idea they could post today AND ONE micro-action they should take.

Archetype: ${args.archetype}
Overall brand score: ${args.overallScore} / 100
Weakest phase: "${args.weakestPhase}" (${args.weakestPhaseScore} / 100)
What "${args.weakestPhase}" measures: ${PHASE_DESCRIPTIONS[args.weakestPhase]}

Rules:
- Both fields must be specific and concrete. No platitudes ("be authentic"), no vague ideas ("share a story"). Name a hook, a format, or a number.
- "idea" is a post idea they could tweet today. ≤ 220 characters. Reference the archetype's voice when natural.
- "action" is a single concrete micro-step that nudges their weakest phase. ≤ 160 characters. Includes a number when possible ("reply to 3 accounts", "draft 2 hooks").
- Do not write meta-commentary or include the words "brand", "phase", or "archetype" in the output.

Respond with JSON ONLY. No preamble, no markdown fences. Schema:
{"idea": "...", "action": "..."}`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
  if (!text) throw new Error('Empty model response');

  const stripped = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  const parsed = JSON.parse(stripped) as { idea?: unknown; action?: unknown };

  const idea = typeof parsed.idea === 'string' ? parsed.idea.trim() : '';
  const action = typeof parsed.action === 'string' ? parsed.action.trim() : '';
  if (!idea || !action) throw new Error('Missing idea/action in model response');

  return { idea: idea.slice(0, 280), action: action.slice(0, 200) };
}

export async function getOrGenerateTodayBrief(
  userId: string,
  workspaceId: string,
): Promise<BriefResult> {
  const briefDate = todayUtcDate();

  const existing = await prisma.dailyBrief.findUnique({
    where: { userId_briefDate: { userId, briefDate } },
  });
  if (existing) return { brief: existing };

  const lastScan = await prisma.brandScan.findFirst({
    where: { userId, status: 'active' },
    orderBy: { scannedAt: 'desc' },
  });
  if (!lastScan) return { error: { kind: 'no_scan' } };

  const weakest = pickWeakestPhase(lastScan.phaseScores);
  if (!weakest) return { error: { kind: 'no_scan' } };

  let body: { idea: string; action: string };
  try {
    body = await generateBriefBody({
      archetype: lastScan.archetype,
      weakestPhase: weakest.phase,
      weakestPhaseScore: weakest.score,
      overallScore: lastScan.score,
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown';
    return { error: { kind: 'generation_failed', reason } };
  }

  const brief = await prisma.dailyBrief.upsert({
    where: { userId_briefDate: { userId, briefDate } },
    update: {},
    create: {
      userId,
      workspaceId,
      briefDate,
      sourceBrandScanId: lastScan.id,
      archetype: lastScan.archetype,
      scoreAtGeneration: lastScan.score,
      weakestPhase: weakest.phase,
      weakestPhaseScore: weakest.score,
      idea: body.idea,
      action: body.action,
    },
  });

  return { brief };
}

export async function markBriefCompleted(
  briefId: string,
  userId: string,
): Promise<DailyBrief | null> {
  const result = await prisma.dailyBrief.updateMany({
    where: { id: briefId, userId, completedAt: null },
    data: { completedAt: new Date() },
  });
  if (result.count === 0) return null;
  return prisma.dailyBrief.findUnique({ where: { id: briefId } });
}

export async function getCurrentStreak(userId: string): Promise<number> {
  const today = todayUtcDate();
  const cutoff = new Date(today);
  cutoff.setUTCDate(cutoff.getUTCDate() - 60);

  const recent = await prisma.dailyBrief.findMany({
    where: { userId, briefDate: { gte: cutoff }, completedAt: { not: null } },
    select: { briefDate: true },
    orderBy: { briefDate: 'desc' },
  });

  if (recent.length === 0) return 0;

  let streak = 0;
  const cursor = new Date(today);
  for (const row of recent) {
    const rowUtc = new Date(
      Date.UTC(
        row.briefDate.getUTCFullYear(),
        row.briefDate.getUTCMonth(),
        row.briefDate.getUTCDate(),
      ),
    );
    if (rowUtc.getTime() === cursor.getTime()) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else if (rowUtc.getTime() < cursor.getTime()) {
      break;
    }
  }
  return streak;
}
