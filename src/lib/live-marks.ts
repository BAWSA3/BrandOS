/**
 * Live composer marks (pure: no DB, no network; covered by `npm run test:live-marks`).
 * docs/LIVE-COMPOSER-SPEC.md. A mark points at a span of the draft and says
 * what's off and why. It never offers replacement wording.
 *
 *   Tier 0 (this file, every keystroke): voice marks measured against the
 *     brand's own posts: casing, sentence length, emoji, "!", em dashes,
 *     question openers, stock phrases they never use.
 *   Tier 1 (/api/dashboard/live-marks, after a pause): the model's voice,
 *     lane and landing marks, returned as quotes and anchored here.
 *
 * Hashtags are never marked either way (no hashtag advice, ever).
 */

export type Lens = 'voice' | 'lane' | 'landing';

export interface Mark {
  /** Stable while the quoted text survives edits (lens + source + quote). */
  id: string;
  start: number;
  end: number;
  lens: Lens;
  note: string;
  source: 'local' | 'model';
}

/** A model mark before anchoring: the exact words it points at. */
export interface QuoteMark {
  lens: Lens;
  quote: string;
  note: string;
}

export interface VoiceProfile {
  posts: number;
  /** Share of posts written in lowercase (sentence starts not capitalised). */
  lowercase: number;
  /** Median words per sentence across their posts. */
  sentenceWords: number;
  emoji: number;
  exclaim: number;
  emDash: number;
  /** Share of posts that open on a question. */
  questionOpen: number;
  /** Stock phrases from STOCK that appear somewhere in their posts. */
  usedStock: string[];
}

/** Below this, there's too little to say how they sound: tier 0 stays off. */
export const VOICE_MIN_POSTS = 5;
/** Below this, Landing marks are hidden (spec: thin history hides Landing). */
export const LANDING_MIN_POSTS = 10;
export const LIVE_MAX_CHARS = 2_000;
export const NOTE_MAX = 160;
export const MAX_MODEL_MARKS = 6;

// Generic phrases that read as someone else (or as a model). Marked only when
// the brand has never used them.
export const STOCK = [
  'excited to announce',
  'game changer',
  'game-changer',
  "in today's",
  "let's dive in",
  'dive into',
  'delve',
  'unlock',
  'leverage',
  'elevate',
  'thrilled to',
  'here’s the thing',
  "here's the thing",
  'a thread',
  'buckle up',
];

const EMOJI = /\p{Extended_Pictographic}/u;
const EMOJI_G = /\p{Extended_Pictographic}/gu;
const SENTENCE = /[^.!?\n]+[.!?]*/g;

function words(s: string): number {
  return s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Sentence starts: the first letter of the text and after . ! ? or a line break. */
function sentenceStarts(text: string): { index: number; ch: string }[] {
  const out: { index: number; ch: string }[] = [];
  const re = /(^|[.!?]\s+|\n\s*)(\p{L})/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push({ index: m.index + m[1].length, ch: m[2] });
  return out;
}

function isLowercasePost(text: string): boolean {
  // drop links and @handles, which are lowercase anyway
  const t = text.replace(/https?:\/\/\S+/g, '').replace(/@\w+/g, '');
  const starts = sentenceStarts(t);
  if (!starts.length) return false;
  const lower = starts.filter((s) => s.ch === s.ch.toLowerCase() && s.ch !== s.ch.toUpperCase());
  return lower.length / starts.length >= 0.8;
}

export function buildVoiceProfile(posts: string[]): VoiceProfile {
  const ps = posts.map((p) => p.trim()).filter(Boolean);
  const n = ps.length || 1;
  const share = (f: (p: string) => boolean) => ps.filter(f).length / n;
  const sentenceLens: number[] = [];
  for (const p of ps) {
    for (const s of p.replace(/https?:\/\/\S+/g, '').match(SENTENCE) ?? []) {
      const w = words(s);
      if (w > 0) sentenceLens.push(w);
    }
  }
  const all = ps.join('\n').toLowerCase();
  return {
    posts: ps.length,
    lowercase: share(isLowercasePost),
    sentenceWords: median(sentenceLens),
    emoji: share((p) => EMOJI.test(p)),
    exclaim: share((p) => p.includes('!')),
    emDash: share((p) => p.includes('—')),
    questionOpen: share((p) => /^[^.!?\n]*\?/.test(p)),
    usedStock: STOCK.filter((s) => all.includes(s)),
  };
}

function markId(lens: Lens, source: Mark['source'], key: string): string {
  return `${lens}:${source}:${key.toLowerCase().slice(0, 80)}`;
}

/** Tier 0: voice marks measured against their own posts. Empty below VOICE_MIN_POSTS. */
export function localMarks(text: string, p: VoiceProfile | null): Mark[] {
  if (!p || p.posts < VOICE_MIN_POSTS || !text.trim()) return [];
  const out: Mark[] = [];
  const add = (start: number, end: number, key: string, note: string) =>
    out.push({
      id: markId('voice', 'local', key),
      start,
      end,
      lens: 'voice',
      note,
      source: 'local',
    });

  const lower = text.toLowerCase();
  for (const phrase of STOCK) {
    if (p.usedStock.includes(phrase)) continue;
    const i = lower.indexOf(phrase);
    if (i >= 0)
      add(
        i,
        i + phrase.length,
        `stock-${phrase}`,
        `“${text.slice(i, i + phrase.length)}” isn’t a phrase you use.`
      );
  }

  // casing: one mark, on the first sentence start that breaks their habit
  const starts = sentenceStarts(text);
  if (p.lowercase >= 0.7) {
    const s = starts.find((x) => x.ch !== x.ch.toLowerCase());
    if (s) {
      const end = s.index + (text.slice(s.index).match(/^\S+/)?.[0].length ?? 1);
      add(
        s.index,
        end,
        'case-upper',
        'You write in lowercase. Capitals here read like someone else.'
      );
    }
  } else if (
    p.lowercase <= 0.2 &&
    starts.length >= 2 &&
    starts.every((x) => x.ch === x.ch.toLowerCase())
  ) {
    const s = starts[0];
    const end = s.index + (text.slice(s.index).match(/^\S+/)?.[0].length ?? 1);
    add(
      s.index,
      end,
      'case-lower',
      'You usually write in sentence case. All lowercase is a different voice.'
    );
  }

  // first sentence opening on a question when they almost never do
  if (p.questionOpen < 0.1) {
    const first = text.match(/^\s*([^.!?\n]*\?)/);
    if (first) {
      const start = text.indexOf(first[1]);
      add(
        start,
        start + first[1].length,
        'q-open',
        'You rarely open on a question. Your hooks are statements.'
      );
    }
  }

  if (p.emoji < 0.05) {
    let m: RegExpExecArray | null;
    const re = new RegExp(EMOJI_G.source, 'gu');
    let k = 0;
    while ((m = re.exec(text)) && k < 2) {
      add(m.index, m.index + m[0].length, `emoji-${k}`, 'You almost never use emoji.');
      k++;
    }
  }
  if (p.exclaim < 0.05) {
    const i = text.indexOf('!');
    if (i >= 0) add(i, i + 1, 'exclaim', 'You almost never use exclamation marks.');
  }
  if (p.emDash < 0.03) {
    const i = text.indexOf('—');
    if (i >= 0)
      add(i, i + 1, 'emdash', 'You don’t use em dashes. It reads as written by someone else.');
  }

  // sentences far longer than theirs
  if (p.sentenceWords > 0) {
    const limit = Math.max(Math.round(p.sentenceWords * 2.2), Math.round(p.sentenceWords + 14));
    let m: RegExpExecArray | null;
    const re = new RegExp(SENTENCE.source, 'g');
    let flagged = 0;
    while ((m = re.exec(text)) && flagged < 2) {
      const w = words(m[0]);
      if (w > limit) {
        const lead = m[0].length - m[0].trimStart().length;
        add(
          m.index + lead,
          m.index + m[0].trimEnd().length,
          `long-${m[0].trim().slice(0, 24)}`,
          `${w} words. Your sentences usually run about ${Math.round(p.sentenceWords)}.`
        );
        flagged++;
      }
    }
  }

  return out;
}

/**
 * Anchor model quotes in the current text. Quotes that no longer appear are
 * dropped (stale after an edit); each quote takes its first unused occurrence.
 */
export function anchorQuotes(text: string, quotes: QuoteMark[]): Mark[] {
  const out: Mark[] = [];
  const used: [number, number][] = [];
  for (const q of quotes) {
    const quote = q.quote.trim();
    if (quote.length < 2) continue;
    let from = 0;
    let at = -1;
    while ((at = text.indexOf(quote, from)) >= 0) {
      const end = at + quote.length;
      if (!used.some(([a, b]) => at < b && end > a)) break;
      from = at + 1;
    }
    if (at < 0) continue;
    used.push([at, at + quote.length]);
    out.push({
      id: markId(q.lens, 'model', quote),
      start: at,
      end: at + quote.length,
      lens: q.lens,
      note: q.note,
      source: 'model',
    });
  }
  return out;
}

/**
 * Local + model marks, in text order, overlaps removed (local wins: it's
 * measured), Landing hidden when history is thin.
 */
export function mergeMarks(local: Mark[], model: Mark[], landingReady: boolean): Mark[] {
  const all = [...local, ...model.filter((m) => landingReady || m.lens !== 'landing')];
  const kept: Mark[] = [];
  for (const m of all) {
    if (m.end <= m.start) continue;
    if (kept.some((k) => m.start < k.end && m.end > k.start)) continue;
    if (kept.some((k) => k.id === m.id)) continue;
    kept.push(m);
  }
  return kept.sort((a, b) => a.start - b.start);
}

/** Text split into plain and marked runs, for the underline layer. */
export function segments(text: string, marks: Mark[]): { text: string; mark: Mark | null }[] {
  const out: { text: string; mark: Mark | null }[] = [];
  let i = 0;
  for (const m of marks) {
    if (m.start < i || m.end > text.length) continue;
    if (m.start > i) out.push({ text: text.slice(i, m.start), mark: null });
    out.push({ text: text.slice(m.start, m.end), mark: m });
    i = m.end;
  }
  if (i < text.length) out.push({ text: text.slice(i), mark: null });
  return out;
}

/**
 * Validate the model's JSON into quote marks: known lenses, quotes that are
 * really in the draft, short notes, no rewrites, no hashtag talk.
 */
export function parseModelMarks(raw: unknown, draft: string): QuoteMark[] {
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : typeof raw === 'object' && raw !== null && Array.isArray((raw as { marks?: unknown }).marks)
      ? (raw as { marks: unknown[] }).marks
      : [];
  const out: QuoteMark[] = [];
  for (const item of list) {
    if (typeof item !== 'object' || item === null) continue;
    const r = item as Record<string, unknown>;
    const lens = r.lens;
    if (lens !== 'voice' && lens !== 'lane' && lens !== 'landing') continue;
    if (typeof r.quote !== 'string' || typeof r.note !== 'string') continue;
    const quote = r.quote.trim().slice(0, 300);
    const note = r.note.trim().replace(/\s+/g, ' ');
    if (quote.length < 2 || !draft.includes(quote)) continue;
    if (!note || note.length > NOTE_MAX * 2) continue;
    if (/hashtag|#\w/i.test(note)) continue;
    // marks say what's off and why; a quoted replacement is a rewrite
    if (/\b(instead|replace|rewrite|change it to|try)\b[^.]*["“]/i.test(note)) continue;
    out.push({ lens, quote, note: note.slice(0, NOTE_MAX) });
    if (out.length >= MAX_MODEL_MARKS) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// The live read beside the draft: score, playbook line, proof post, idea link.

export interface LiveRead {
  marks: QuoteMark[];
  /** Fit 0–100 for the draft so far, or null when the model gave none. */
  score: number | null;
  /** Index into the brand's playbook lines the draft is on, or null when off-lane. */
  pillar: number | null;
}

/** One of their own past posts, as proof that a shape works for them. */
export interface ProofPost {
  text: string;
  /** Engagement relative to their median post (3 = "3× avg"). */
  lift: number;
}

export type DraftShape = 'thread' | 'question' | 'list' | 'short' | 'long';

/** The draft's shape, for picking a proof post of the same shape. */
export function shapeOf(text: string): DraftShape {
  const t = text.trim();
  if (/🧵|\b1\s?\/\s?\d+\b|\(1\/\d+\)/.test(t)) return 'thread';
  if (/^[^.!\n]*\?/.test(t)) return 'question';
  if ((t.match(/^\s*(?:[-•*]|\d+[.)])\s+/gm) ?? []).length >= 2) return 'list';
  return [...t].length <= 140 ? 'short' : 'long';
}

export function parseLiveRead(raw: unknown, draft: string, pillars: number): LiveRead {
  const obj = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const s =
    typeof obj.score === 'number' && Number.isFinite(obj.score) ? Math.round(obj.score) : null;
  const p = typeof obj.pillar === 'number' && Number.isInteger(obj.pillar) ? obj.pillar : null;
  return {
    marks: parseModelMarks(raw, draft),
    score: s === null ? null : Math.max(0, Math.min(100, s)),
    pillar: p !== null && p >= 0 && p < pillars ? p : null,
  };
}

const STOP = new Set(
  'the a an and or but of to in on for with is are was were be been it its this that i my me you your we our they their at as by from so just not no do does did have has had what why how when who about into than then them there here can will would'.split(
    ' '
  )
);

function contentWords(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, '')
      .split(/[^\p{L}\p{N}']+/u)
      .filter((w) => w.length > 2 && !STOP.has(w))
  );
}

/** A saved idea the draft is clearly about (shared content words), or null. */
export function matchIdea<T extends { id: string; text: string }>(
  text: string,
  ideas: T[]
): T | null {
  const d = contentWords(text);
  if (d.size < 3) return null;
  let best: { idea: T; score: number } | null = null;
  for (const idea of ideas) {
    const w = contentWords(idea.text);
    if (!w.size) continue;
    let shared = 0;
    for (const x of w) if (d.has(x)) shared++;
    const score = shared / Math.min(w.size, d.size);
    if (shared >= 2 && score >= 0.34 && (!best || score > best.score)) best = { idea, score };
  }
  return best?.idea ?? null;
}
