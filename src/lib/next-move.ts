/**
 * Today's move (dashboard v2): one clear suggestion drawn from the member's own
 * record, never a blank page. Pure and client-safe, so "Show another" and the
 * persona answer re-rank without a request. The order is the order the moves
 * are offered in; the first is today's.
 *
 * Rules kept here on purpose:
 * - only real numbers from the record (no invented stats);
 * - no hashtag advice, and threads are never pushed as the growth lever
 *   (they're one depth format among several), so the format move skips them;
 * - bad news comes with one fix.
 */

export type Persona = 'creator' | 'founder' | 'builder';
export type FounderFor = 'me' | 'company';

export interface MoveInput {
  handle: string;
  outlier: { tweetId: string; text: string; views: number; multiple: number } | null;
  formats: { format: string; label: string; rate: number | null; share: number; posts: number }[];
  score: {
    value: number;
    weakest: string | null;
    phases: Record<string, number> | null;
    nextMoves: string[];
  } | null;
  /** The brand's idea board, newest first (status: saved | drafting | posted). */
  ideas: { id: string; text: string; status: string }[];
  /** People to know (053): set when few known accounts engage or Scale is weakest. */
  connect?: { reason: 'engagers' | 'scale' | 'both'; knownEngagers: number } | null;
}

export interface Move {
  id: string;
  kind: 'connect' | 'build' | 'finish' | 'fix' | 'phase';
  title: string;
  why: string;
  stat: { value: number; suffix: string; label: string } | null;
  source: string;
  action: { label: string; href: string };
}

const PHASE: Record<string, string> = {
  define: 'Define',
  check: 'Check',
  generate: 'Generate',
  scale: 'Scale',
};

const FORMAT_MOVE: Record<string, string> = {
  media: 'Put an image or a short video on your next post.',
  quote: 'Quote a post in your niche and add your own take.',
  text: 'Make your next post a short text-only one.',
};

const clip = (s: string, n = 90) => {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

const compact = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 10_000
      ? `${Math.round(n / 1000)}K`
      : n >= 1000
        ? `${(n / 1000).toFixed(1)}K`
        : String(Math.round(n));

const writeHref = (prompt: string) => `/dashboard/write?prompt=${encodeURIComponent(prompt)}`;

/** Who the writing is for, as the copywriter prompt says it. */
function voiceFor(persona: Persona | null, founderFor: FounderFor | null) {
  if (persona === 'founder' && founderFor === 'company') return ' for my company';
  if (persona === 'builder') return ', showing what I built';
  return '';
}

export function nextMoves(
  input: MoveInput,
  persona: Persona | null = null,
  founderFor: FounderFor | null = null
): Move[] {
  const out: Move[] = [];
  const voice = voiceFor(persona, founderFor);

  // 0. Meet the people in your niche (the gap is people, not posts)
  if (input.connect) {
    const c = input.connect;
    out.push({
      id: 'connect',
      kind: 'connect',
      title: 'Reach out to 3 people in your niche this week.',
      why:
        c.reason === 'scale'
          ? "Scale is your weakest phase: the right people don't know you yet. We picked people in your niche, with a first message for each."
          : 'Few known accounts engage with your posts yet. We picked people in your niche, with a first message for each.',
      stat:
        c.reason === 'scale'
          ? null
          : {
              value: c.knownEngagers,
              suffix: '',
              label: `known account${c.knownEngagers === 1 ? '' : 's'} engaging, 30 days`,
            },
      source: 'From your record / who engages with you',
      action: { label: 'See who', href: '/dashboard?view=playbook#people' },
    });
  }

  // 1. Build on the post that travelled furthest
  if (input.outlier && input.outlier.multiple >= 5) {
    const o = input.outlier;
    out.push({
      id: `build-${o.tweetId}`,
      kind: 'build',
      title: 'Write a follow-up to the post that reached furthest.',
      why: `“${clip(o.text)}” did ${compact(o.views)} views. The people it reached haven't seen what comes next.`,
      stat: { value: o.multiple, suffix: '×', label: 'your usual reach' },
      source: 'From your record / your recent posts', // VCR has no · glyph
      action: {
        label: 'Start writing',
        href: writeHref(`A follow-up to my post “${clip(o.text, 160)}”${voice}`),
      },
    });
  }

  // 2. Finish something half-built (drafting first, then the newest saved idea)
  const half =
    input.ideas.find((i) => i.status === 'drafting') ??
    input.ideas.find((i) => i.status === 'saved');
  if (half && half.text.trim()) {
    const open = input.ideas.filter((i) => i.status === 'drafting' || i.status === 'saved').length;
    out.push({
      id: `finish-${half.id}`,
      kind: 'finish',
      title: `Finish the idea you started: “${clip(half.text, 70)}”`,
      why:
        half.status === 'drafting'
          ? 'You were drafting it. Half the work is done; it only needs the last pass.'
          : 'It is still waiting on your board. Write it the way you would post it.',
      stat: { value: open, suffix: '', label: open === 1 ? 'idea waiting' : 'ideas waiting' },
      source: 'From your idea board',
      action: { label: 'Write it', href: writeHref(`${clip(half.text, 240)}${voice}`) },
    });
  }

  // 3. A format you under-use that works for you (never "post more threads")
  const rated = input.formats.filter(
    (f): f is typeof f & { rate: number } => f.rate !== null && f.posts > 0
  );
  const usual = [...rated].sort((a, b) => b.share - a.share)[0];
  const lever = [...rated]
    .filter((f) => f.format !== 'thread' && f.format !== usual?.format)
    .sort((a, b) => b.rate - a.rate)[0];
  if (usual && lever && lever.share < 30 && lever.rate >= usual.rate * 1.3) {
    const lift = Math.round((lever.rate / usual.rate) * 10) / 10;
    out.push({
      id: `fix-${lever.format}`,
      kind: 'fix',
      title: FORMAT_MOVE[lever.format] ?? `Try more ${lever.label.toLowerCase()} this week.`,
      why: `${lever.label} earn ${lever.rate.toFixed(1)}% engagement against ${usual.rate.toFixed(1)}% for ${usual.label.toLowerCase()}, and they're only ${lever.share}% of your posts.`,
      stat: { value: lift, suffix: '×', label: 'engagement' },
      source: 'From your record / your recent posts', // VCR has no · glyph
      action: {
        label: 'Start writing',
        href: writeHref(`A post ${lever.label.toLowerCase()}${voice}`),
      },
    });
  }

  // 4. The weakest phase, with the read's own first next move as the fix
  const s = input.score;
  if (s?.weakest && s.phases && s.nextMoves[0]) {
    const v = s.phases[s.weakest];
    out.push({
      id: `phase-${s.weakest}`,
      kind: 'phase',
      title: s.nextMoves[0],
      why: `${PHASE[s.weakest] ?? s.weakest} is your weakest phase. That's where the next points on your score are.`,
      stat:
        typeof v === 'number'
          ? { value: v, suffix: '', label: `${PHASE[s.weakest] ?? s.weakest} / 100` }
          : null,
      source: 'From your latest read',
      action: { label: 'Open your Playbook', href: '/dashboard?view=playbook' },
    });
  }

  // Founders and builders lead with making something; creators with what's working
  if (persona === 'founder' || persona === 'builder') {
    const finish = out.findIndex((m) => m.kind === 'finish');
    if (finish > 0) out.unshift(...out.splice(finish, 1));
  }
  return out;
}

/** The day's pick: stable within a day, so a refresh doesn't change it. */
export function pickIndex(count: number, day: string): number {
  if (count <= 1) return 0;
  // only the first two are "today" candidates; the rest come via "Show another"
  let h = 0;
  for (const ch of day) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % Math.min(2, count);
}
