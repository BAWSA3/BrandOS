import Anthropic from '@anthropic-ai/sdk';
import { buildCheckPrompt } from '@/prompts/brand-guardian';
import type { BrandDNA } from '@/lib/types';
import { GUARD_PREAMBLE, wrapUntrusted } from '@/lib/prompt-safety';
import { clampScore, extractJson } from '@/lib/score-schemas';

// Content Check core: score a draft against a brand. Shared by POST /api/check
// (dashboard) and the BrandOS MCP check_draft tool. Callers own auth, usage
// metering and bot/rate-limit guards.

export const MAX_CONTENT_CHARS = 10_000;
// claude-sonnet-4-20250514 (previous model here) is deprecated, retires
// 2026-06-15; claude-sonnet-5 is its designated replacement tier.
export const CHECK_MODEL = 'claude-sonnet-5';

const MAX_LIST_ITEMS = 10;
const MAX_ITEM_CHARS = 500;

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string')
    .slice(0, MAX_LIST_ITEMS)
    .map((s) => s.slice(0, MAX_ITEM_CHARS));
}

export interface ContentCheckResult {
  score: number;
  issues: string[];
  strengths: string[];
  suggestions: string[];
  revisedVersion: string;
}

// Validate + clamp the model's JSON into a CheckResult shape. Returns null
// if the output doesn't look like a check result at all.
export function parseCheckResult(text: string): ContentCheckResult | null {
  const raw = extractJson(text);
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  // A non-numeric score means the model didn't produce a usable check —
  // reject rather than clamp null/strings into a confident-looking 0.
  if (typeof obj.score !== 'number') return null;

  return {
    score: clampScore(obj.score),
    issues: asStringList(obj.issues),
    strengths: asStringList(obj.strengths),
    suggestions: asStringList(obj.suggestions),
    revisedVersion:
      typeof obj.revisedVersion === 'string' ? obj.revisedVersion.slice(0, MAX_CONTENT_CHARS) : '',
  };
}

/** The draft is untrusted (users paste third-party text); fence it so it can't override the rubric. */
export function fenceDraft(content: string): string {
  return wrapUntrusted(content, 'user_draft', MAX_CONTENT_CHARS);
}

/** Run the main brand check. Returns null when the model output fails validation. */
export async function runBrandCheck(
  anthropic: Anthropic,
  brandDNA: BrandDNA,
  fencedContent: string
): Promise<ContentCheckResult | null> {
  const message = await anthropic.messages.create({
    model: CHECK_MODEL,
    max_tokens: 2048,
    // Sonnet 5 runs adaptive thinking when the field is omitted — keep the
    // legacy no-thinking behavior so the token budget is all response.
    thinking: { type: 'disabled' },
    messages: [
      { role: 'user', content: GUARD_PREAMBLE + buildCheckPrompt(brandDNA, fencedContent) },
    ],
  });
  const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
  return parseCheckResult(text);
}
