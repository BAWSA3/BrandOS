/**
 * Extract Voice Samples
 *
 * Pulls a user's recent original tweets via SocialData.tools, picks a
 * diverse high-signal sample, and writes them to docs/content/VOICE.md
 * in the format VOICE.md already specifies.
 *
 * Does NOT include replies (filtered by SocialData's timeline endpoint
 * and re-filtered here for safety). Includes threads as individual tweets
 * since SocialData returns them that way.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/extract-voice.ts @handle
 *   npx tsx --env-file=.env.local scripts/extract-voice.ts @handle --count=300
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Minimal SocialData client (inlined so we don't pull the whole app)
// ---------------------------------------------------------------------------

const SOCIALDATA_BASE = 'https://api.socialdata.tools';

interface RawTweet {
  id_str: string;
  full_text?: string;
  text?: string;
  created_at: string;
  favorite_count?: number;
  retweet_count?: number;
  reply_count?: number;
  quote_count?: number;
  ext_views?: { count?: number };
  in_reply_to_status_id_str?: string | null;
  retweeted_status?: unknown;
  entities?: {
    urls?: { expanded_url: string }[];
    media?: unknown[];
  };
}

interface Tweet {
  id: string;
  text: string;
  createdAt: string;
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  impressions: number;
  hasMedia: boolean;
  hasLink: boolean;
  length: number;
  lineCount: number;
}

async function socialFetch(path: string): Promise<Response> {
  const key = process.env.SOCIALDATA_API_KEY;
  if (!key) throw new Error('SOCIALDATA_API_KEY missing — run with --env-file=.env.local');
  return fetch(`${SOCIALDATA_BASE}${path}`, {
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
  });
}

async function resolveUserId(username: string): Promise<string> {
  const clean = username.replace(/^@/, '');
  const res = await socialFetch(`/twitter/user/${encodeURIComponent(clean)}`);
  if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
  const data = await res.json();
  if (!data?.id_str) throw new Error(`User @${clean} not found`);
  return data.id_str;
}

async function fetchRawTweets(userId: string, count: number): Promise<RawTweet[]> {
  const all: RawTweet[] = [];
  let cursor: string | undefined;
  const pageSize = Math.min(200, count);

  while (all.length < count) {
    const qs = new URLSearchParams({ count: String(pageSize) });
    if (cursor) qs.set('cursor', cursor);
    const res = await socialFetch(`/twitter/user/${userId}/tweets?${qs}`);
    if (!res.ok) {
      console.error(`tweets fetch failed: ${res.status}`);
      break;
    }
    const data = await res.json();
    const batch: RawTweet[] = data.tweets || data || [];
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    cursor = data.next_cursor || data.cursor;
    if (!cursor) break;
  }

  return all.slice(0, count);
}

function normalize(raw: RawTweet): Tweet {
  const text = raw.full_text || raw.text || '';
  return {
    id: raw.id_str,
    text,
    createdAt: raw.created_at,
    likes: raw.favorite_count || 0,
    retweets: raw.retweet_count || 0,
    replies: raw.reply_count || 0,
    quotes: raw.quote_count || 0,
    impressions: raw.ext_views?.count || 0,
    hasMedia: !!(raw.entities?.media && raw.entities.media.length > 0),
    hasLink: !!(raw.entities?.urls && raw.entities.urls.length > 0),
    length: text.length,
    lineCount: text.split('\n').length,
  };
}

// ---------------------------------------------------------------------------
// Scoring & sampling
// ---------------------------------------------------------------------------

function engagementScore(t: Tweet): number {
  // Weighted engagement — replies/quotes signal resonance more than likes
  return t.impressions + t.likes * 10 + t.retweets * 30 + t.quotes * 40 + t.replies * 15;
}

function resonanceScore(t: Tweet): number {
  // Pure "did people stop and engage" — ignores impressions
  return t.replies * 3 + t.quotes * 4 + t.retweets * 2 + t.likes;
}

function pickDiverseSample(tweets: Tweet[]): Tweet[] {
  const picked = new Map<string, Tweet>();

  // Top 8 by raw impressions (viral voice)
  [...tweets]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 8)
    .forEach((t) => picked.set(t.id, t));

  // Top 8 by resonance (replies/quotes matter here)
  [...tweets]
    .sort((a, b) => resonanceScore(b) - resonanceScore(a))
    .slice(0, 8)
    .forEach((t) => picked.set(t.id, t));

  // 5 short (one-liners — compressed voice)
  [...tweets]
    .filter((t) => t.length > 10 && t.length <= 80 && !t.hasLink)
    .sort((a, b) => engagementScore(b) - engagementScore(a))
    .slice(0, 5)
    .forEach((t) => picked.set(t.id, t));

  // 5 medium (conversational voice)
  [...tweets]
    .filter((t) => t.length > 80 && t.length <= 200)
    .sort((a, b) => engagementScore(b) - engagementScore(a))
    .slice(0, 5)
    .forEach((t) => picked.set(t.id, t));

  // 3 long (essay/thread-opener voice)
  [...tweets]
    .filter((t) => t.length > 200)
    .sort((a, b) => engagementScore(b) - engagementScore(a))
    .slice(0, 3)
    .forEach((t) => picked.set(t.id, t));

  // 3 recent (last month) — catches current voice, not just all-time bangers
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  [...tweets]
    .filter((t) => {
      const ts = new Date(t.createdAt).getTime();
      return !isNaN(ts) && ts > thirtyDaysAgo;
    })
    .sort((a, b) => engagementScore(b) - engagementScore(a))
    .slice(0, 3)
    .forEach((t) => picked.set(t.id, t));

  // Sort final output by engagement, descending
  return [...picked.values()].sort((a, b) => engagementScore(b) - engagementScore(a));
}

// ---------------------------------------------------------------------------
// Voice pattern analysis
// ---------------------------------------------------------------------------

const CORPORATE_WORDS = [
  'unlock', 'leverage', 'game-changer', 'game changer', 'revolutionary',
  'at scale', 'disruptive', '10x', 'needle-mover', 'moving the needle',
  'in today\'s economy', 'let\'s dive in', 'here\'s the thing',
  'synergy', 'paradigm', 'ecosystem', 'circle back', 'deep dive',
];

function analyzeVoice(samples: Tweet[]): {
  avgLength: number;
  avgLines: number;
  lowercaseStarts: number;
  emdashUsage: number;
  ellipsisUsage: number;
  questionsAsked: number;
  topWords: { word: string; count: number }[];
  corporateOffenders: string[];
  hookPatterns: string[];
} {
  const joined = samples.map((t) => t.text).join(' ');
  const lowercaseStarts = samples.filter((t) => /^[a-z]/.test(t.text.trim())).length;
  const emdashUsage = (joined.match(/—/g) || []).length;
  const ellipsisUsage = (joined.match(/\.\.\.|…/g) || []).length;
  const questionsAsked = samples.filter((t) => t.text.includes('?')).length;

  // Word frequency (simple, skip stopwords)
  const STOPWORDS = new Set([
    'the','a','an','and','or','but','if','then','is','are','was','were','be','been','being',
    'to','of','in','on','at','for','with','by','from','as','this','that','these','those',
    'i','you','he','she','it','we','they','me','him','her','us','them','my','your','his','our',
    'do','does','did','have','has','had','will','would','could','should','can','may','might',
    'not','no','yes','so','too','very','just','really','only','even','much','more','most','less',
    'what','when','where','who','why','how','there','here','its',
  ]);
  const words = joined.toLowerCase().match(/\b[a-z][a-z']{2,}\b/g) || [];
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (STOPWORDS.has(w)) continue;
    freq[w] = (freq[w] || 0) + 1;
  }
  const topWords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, count]) => ({ word, count }));

  // Corporate word check
  const lowerJoined = joined.toLowerCase();
  const corporateOffenders = CORPORATE_WORDS.filter((w) => lowerJoined.includes(w));

  // Hook pattern — first line of each sample
  const hookPatterns = samples.slice(0, 10).map((t) => t.text.split('\n')[0].slice(0, 100));

  return {
    avgLength: Math.round(samples.reduce((s, t) => s + t.length, 0) / samples.length),
    avgLines: +(samples.reduce((s, t) => s + t.lineCount, 0) / samples.length).toFixed(1),
    lowercaseStarts,
    emdashUsage,
    ellipsisUsage,
    questionsAsked,
    topWords,
    corporateOffenders,
    hookPatterns,
  };
}

// ---------------------------------------------------------------------------
// VOICE.md writer
// ---------------------------------------------------------------------------

function safeDate(s: string | undefined): string {
  if (!s) return 'unknown-date';
  const d = new Date(s);
  if (isNaN(d.getTime())) return 'unknown-date';
  return d.toISOString().slice(0, 10);
}

function formatSamples(samples: Tweet[]): string {
  return samples
    .map((t) => {
      const date = safeDate(t.createdAt);
      const preview = t.text.split('\n')[0].slice(0, 60).replace(/\s+/g, ' ');
      const formatType =
        t.length <= 80 ? 'single (short)' :
        t.length <= 200 ? 'single (medium)' :
        'single (long)';
      const perf = `${t.impressions.toLocaleString()} views / ${t.likes.toLocaleString()} likes / ${t.replies.toLocaleString()} replies / ${t.retweets.toLocaleString()} RTs / ${t.quotes.toLocaleString()} quotes`;

      return [
        `### ${date} — "${preview}${t.text.length > 60 ? '…' : ''}"`,
        `**Performance:** ${perf}`,
        `**Format:** ${formatType}${t.hasMedia ? ' + media' : ''}${t.hasLink ? ' + link' : ''}`,
        '',
        t.text,
        '',
        '---',
        '',
      ].join('\n');
    })
    .join('\n');
}

function buildVoiceMd(handle: string, samples: Tweet[], analysis: ReturnType<typeof analyzeVoice>): string {
  const cleanHandle = handle.replace(/^@/, '');
  const now = new Date().toISOString().slice(0, 10);

  return `# Voice — how Jeffrey writes

**This is the single most important file in the Content project.**
Auto-populated from @${cleanHandle}'s X timeline on ${now}.
Re-run \`npx tsx --env-file=.env.local scripts/extract-voice.ts @${cleanHandle}\`
every 2-3 months to refresh as voice evolves.

---

## Voice samples

${formatSamples(samples)}
---

## Voice rules (auto-extracted — edit after reviewing)

Patterns detected across ${samples.length} samples:

- **Average post length:** ${analysis.avgLength} chars
- **Average line breaks per post:** ${analysis.avgLines}
- **Lowercase sentence starts:** ${analysis.lowercaseStarts}/${samples.length} samples (${Math.round(analysis.lowercaseStarts / samples.length * 100)}%)
- **Em-dash usage (—):** ${analysis.emdashUsage} occurrences
- **Ellipsis usage (...):** ${analysis.ellipsisUsage} occurrences
- **Questions asked:** ${analysis.questionsAsked}/${samples.length} samples

### Top 15 content words (excluding stopwords)
${analysis.topWords.map((w) => `- \`${w.word}\` (×${w.count})`).join('\n')}

### Hook patterns — how you open posts
${analysis.hookPatterns.map((h, i) => `${i + 1}. ${h}`).join('\n')}

### Corporate-word check
${analysis.corporateOffenders.length === 0
  ? '✓ Clean — none of the common corporate offenders appeared in your samples.'
  : `Found these in your samples (consider if this is intentional):\n${analysis.corporateOffenders.map((w) => `- "${w}"`).join('\n')}`}

---

## Voice rules — YOUR turn (fill these in)

Study your samples above, then write what YOU notice. Auto-extraction
catches surface patterns but misses the voice underneath.

- **Sentence length:** [look at samples — short? mix? varies by format?]
- **Capitalization philosophy:** [why do/don't you capitalize?]
- **Punctuation signatures:** [em-dashes, ellipses, no commas, etc]
- **Formatting:** [line break pattern? bullet usage?]
- **Words I use deliberately:** [pick 10 from top-words that are ON-brand]
- **Words I NEVER use:** [your personal offender list]
- **How I hook:** [statement? question? contrarian claim? specific number?]
- **How I close:** [CTA? question? just stop?]
- **Signature moves:** [thread numbering? specific formatting? emoji patterns?]

---

## Anti-patterns (what I am NOT)

Often easier to define the voice by what it isn't. Fill in 3-5:

- Not [___]
- Not [___]
- Not [___]

---

## Red flags — Claude should flag itself when:
- It uses a word not in your samples
- It defaults to LinkedIn-style hooks ("Here's what nobody tells you…")
- It adds emojis you don't use
- It writes sentences longer than your longest sample
- It uses corporate words: leverage, unlock, at scale, game-changer,
  revolutionary, 10x, synergy, deep dive
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const handle = args.find((a) => a.startsWith('@')) || args[0];
  if (!handle) {
    console.error('Usage: npx tsx --env-file=.env.local scripts/extract-voice.ts @handle [--count=200]');
    process.exit(1);
  }
  const countArg = args.find((a) => a.startsWith('--count='));
  const count = countArg ? parseInt(countArg.split('=')[1], 10) : 200;

  const clean = handle.replace(/^@/, '');
  console.log(`\n→ Resolving @${clean}...`);

  const userId = await resolveUserId(clean);
  console.log(`→ User ID: ${userId}`);
  console.log(`→ Fetching up to ${count} tweets...`);

  const raw = await fetchRawTweets(userId, count);
  console.log(`→ Got ${raw.length} raw tweets`);

  // Filter: no retweets, no replies, must have text
  const filtered = raw
    .filter((t) => !t.retweeted_status)
    .filter((t) => !t.in_reply_to_status_id_str)
    .filter((t) => !(t.full_text || t.text || '').startsWith('RT @'))
    .filter((t) => (t.full_text || t.text || '').trim().length > 10);

  console.log(`→ After filtering (no RTs, no replies): ${filtered.length} original posts`);

  const tweets = filtered.map(normalize);
  const samples = pickDiverseSample(tweets);
  console.log(`→ Picked ${samples.length} diverse samples`);

  const analysis = analyzeVoice(samples);
  const md = buildVoiceMd(handle, samples, analysis);

  const outPath = resolve(process.cwd(), 'docs/content/VOICE.md');
  writeFileSync(outPath, md, 'utf-8');
  console.log(`\n✓ Wrote ${samples.length} samples to ${outPath}`);
  console.log(`✓ Analysis summary:`);
  console.log(`  - avg length: ${analysis.avgLength} chars, avg lines: ${analysis.avgLines}`);
  console.log(`  - lowercase starts: ${analysis.lowercaseStarts}/${samples.length}`);
  console.log(`  - em-dashes: ${analysis.emdashUsage}, ellipses: ${analysis.ellipsisUsage}`);
  console.log(`  - corporate offenders: ${analysis.corporateOffenders.length === 0 ? 'none ✓' : analysis.corporateOffenders.join(', ')}`);
  console.log(`\nNext: review VOICE.md and fill in the "YOUR turn" section.\n`);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
