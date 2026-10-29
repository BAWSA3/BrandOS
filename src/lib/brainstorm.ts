import Anthropic from '@anthropic-ai/sdk';
import { GUARD_PREAMBLE, wrapUntrusted } from '@/lib/prompt-safety';
import { extractJson } from '@/lib/score-schemas';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import { replyText } from '@/lib/model-text';

/**
 * Studio brainstorm: from one "Next time" suggestion on an analyzed post,
 * suggest 3-5 new post IDEAS (angles, not drafts) that fit the creator's
 * brand. BrandOS suggests, the creator writes: no finished posts, ever.
 * Post text and suggestions are untrusted input; the model's JSON is
 * validated and trimmed. Server-only.
 */

export interface Idea {
  title: string;
  hook: string;
  format: string;
  why: string;
}

export interface BrainstormInput {
  handle: string;
  archetype: string | null;
  pillars: string[];
  summary: string | null;
  postExcerpt: string;
  postFit: number;
  suggestion: string;
}

const MODEL = 'claude-sonnet-5';
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function parseIdeas(text: string): Idea[] {
  const raw = extractJson(text) as { ideas?: unknown } | null;
  if (!raw || !Array.isArray(raw.ideas)) return [];
  return (raw.ideas as Record<string, unknown>[])
    .map((i) => ({
      title: str(i?.title, 140),
      hook: str(i?.hook, 220),
      format: str(i?.format, 120),
      why: str(i?.why, 260),
    }))
    .filter((i) => i.title && i.hook && i.why)
    .slice(0, 5);
}

export async function brainstorm(input: BrainstormInput): Promise<Idea[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Brainstorming is unavailable right now.');
  const archetype =
    input.archetype && input.archetype !== 'unknown'
      ? (getArchetypeInfo(input.archetype)?.name ?? input.archetype)
      : null;
  const brand = [
    archetype ? `Archetype: ${archetype}` : null,
    input.pillars.length ? `Content pillars: ${input.pillars.join(', ')}` : null,
    input.summary ? `Brand read: ${input.summary}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const prompt = `${GUARD_PREAMBLE}
You are BrandOS, a brand strategist helping a creator (@${input.handle}) find their next posts. They reviewed one of their posts (brand fit ${input.postFit}/100) and want to build on one "next time" suggestion BrandOS gave them.

Suggest 4 NEW post ideas that act on that suggestion and fit their brand.
Rules:
- Ideas, not drafts. Never write the post or full sentences of it. The creator writes it.
- "title": the idea in a few words. "hook": the direction for the opening (describe it, don't write it). "format": e.g. thread, single post + screenshot, short video, poll. "why": one line on why it fits THEIR brand and builds on the suggestion.
- Specific to their brand and this post. No generic social-media advice. Address them as "you". Never assume gender.
- Each idea different from the others.
Return ONLY JSON: {"ideas":[{"title":"","hook":"","format":"","why":""}]}

THEIR BRAND:
${brand || '(no scan details)'}

THE POST THEY REVIEWED:
${wrapUntrusted(input.postExcerpt, 'post', 600)}

THE SUGGESTION TO BUILD ON:
${wrapUntrusted(input.suggestion, 'suggestion', 300)}`;

  const msg = await new Anthropic({ apiKey }).messages.create({
    model: MODEL,
    max_tokens: 1200,
    thinking: { type: 'disabled' },
    messages: [{ role: 'user', content: prompt }],
  });
  const text = replyText(msg);
  const ideas = parseIdeas(text);
  if (!ideas.length) throw new Error('The brainstorm came back empty. Try again.');
  return ideas;
}
