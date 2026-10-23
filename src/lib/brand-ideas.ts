import Anthropic from '@anthropic-ai/sdk';
import prisma from '@/lib/db';
import { GUARD_PREAMBLE, wrapUntrusted } from '@/lib/prompt-safety';
import { parseIdeas, type Idea } from '@/lib/brainstorm';
import type { GrowthView } from '@/lib/growth-data';

/**
 * BrandOS ideas for the growth dashboard's idea board (migration 042): new
 * post ideas built from ONE brand's own analytics — what's working, its best
 * and worst posts, competitors, audience and weakest phase. Every "why" must
 * cite a number from that data, so the ideas are this brand's, not generic.
 * Ideas, never drafts (the creator writes). Post text is untrusted input; the
 * model's JSON is validated and trimmed (parseIdeas). Server-only.
 */

const MODEL = 'claude-sonnet-5';
/** At most this many fresh BrandOS ideas waiting on a board before we add more. */
export const OPEN_BRANDOS_IDEAS = 3;
const pct = (n: number | null) => (n === null ? 'unknown' : `${n.toFixed(1)}%`);

/** The analytics facts the model may cite. Pure (tested). */
export function ideaFacts(v: GrowthView): string {
  const g = v.growth;
  const lines = [
    `Account type: ${v.brand.kind === 'brand' ? 'a brand / company account (speak to the team running it: campaigns, launches, community, product)' : 'a creator (a person)'}`,
    v.score
      ? `Brand score ${v.score.value}/100${v.score.archetype ? `, archetype ${v.score.archetype}` : ''}${v.score.weakest ? `, weakest phase: ${v.score.weakest}` : ''}`
      : null,
    `Engagement ${pct(g.engagement)} of views · ${g.postsPerDay === null ? '?' : g.postsPerDay.toFixed(1)} posts/day · ${g.samplePosts} recent posts read`,
    v.formats.length
      ? `By format: ${v.formats.map((f) => `${f.label} ${pct(f.rate)} (${f.share}% of posts)`).join('; ')}`
      : null,
    v.peakHour !== null ? `Best posting hour: ${v.peakHour}:00 UTC` : null,
    v.competitors.filter((c) => !c.you).length
      ? `Competitors: ${v.competitors
          .filter((c) => !c.you)
          .map(
            (c) =>
              `@${c.handle} ${pct(c.engagement)} engagement, ${c.postsPerDay?.toFixed(1) ?? '?'} posts/day${c.mediaShare !== null ? `, ${Math.round(c.mediaShare * 100)}% media` : ''}`
          )
          .join('; ')}`
      : null,
    v.audience
      ? `Audience (30 days): ${v.audience.people} people engaged, ${Math.round((v.audience.returningShare ?? 0) * 100)}% came back; most engaged: ${v.audience.topEngagers
          .slice(0, 3)
          .map((e) => `@${e.handle}`)
          .join(', ')}`
      : null,
    v.score?.nextMoves.length
      ? `Open advice from their brand read: ${v.score.nextMoves.join(' | ')}`
      : null,
  ];
  return lines.filter(Boolean).join('\n');
}

export async function generateBrandIdeas(v: GrowthView): Promise<Idea[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('BrandOS ideas are unavailable right now.');
  const posts = [
    ...v.best.map((p) => `BEST (${p.rate.toFixed(1)}%): ${p.text}`),
    ...(v.worst ? [`WORST (${v.worst.rate.toFixed(1)}%): ${v.worst.text}`] : []),
  ].join('\n');

  const prompt = `${GUARD_PREAMBLE}
You are BrandOS, a brand strategist. Suggest 3 NEW post ideas for @${v.brand.handle} based ONLY on their own analytics below.
Rules:
- Ideas, not drafts. Never write the post or full sentences of it. They write it.
- "title": the idea in a few words. "hook": the direction for the opening (describe it, don't write it). "format": e.g. thread, single post + screenshot, short video, poll, quote post. "why": ONE line that cites a specific number from the analytics (e.g. "threads earn 3.4% vs your 1.4% text-only").
- Lean into what's working for THEM; fix their weakest spot; learn from a competitor only if the numbers show it.
- Each idea different in format and angle. No generic social-media advice. Address them as "you". Never assume gender.
Return ONLY JSON: {"ideas":[{"title":"","hook":"","format":"","why":""}]}

THEIR ANALYTICS:
${ideaFacts(v)}

THEIR BEST AND WORST RECENT POSTS:
${wrapUntrusted(posts || '(none yet)', 'posts', 1500)}`;

  const msg = await new Anthropic({ apiKey }).messages.create({
    model: MODEL,
    max_tokens: 1200,
    thinking: { type: 'disabled' },
    messages: [{ role: 'user', content: prompt }],
  });
  const text = msg.content[0]?.type === 'text' ? msg.content[0].text : '';
  return parseIdeas(text).slice(0, 3);
}

/**
 * Add BrandOS ideas to a brand's board when it has fewer than
 * OPEN_BRANDOS_IDEAS waiting. Returns how many were added.
 */
export async function refreshBrandIdeas(v: GrowthView, userId: string): Promise<number> {
  const open = await prisma.idea.count({
    where: { accountId: v.brand.id, source: 'brandos', status: 'saved' },
  });
  if (open >= OPEN_BRANDOS_IDEAS) return 0;
  const ideas = (await generateBrandIdeas(v)).slice(0, OPEN_BRANDOS_IDEAS - open);
  if (!ideas.length) return 0;
  await prisma.idea.createMany({
    data: ideas.map((i) => ({
      userId,
      accountId: v.brand.id,
      source: 'brandos',
      suggestion: i.title,
      title: i.title,
      hook: i.hook,
      format: i.format,
      why: i.why,
    })),
  });
  return ideas.length;
}
