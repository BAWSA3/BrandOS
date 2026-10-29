import {
  anchorQuotes,
  localMarks,
  matchIdea,
  mergeMarks,
  shapeOf,
  type LiveRead,
  type ProofPost,
  type VoiceProfile,
} from '@/lib/live-marks';
import type { LiveState } from './types';

/**
 * Scripted playback for the live composer (?demo= on the preview harness, and
 * the Remotion edit). Pure and deterministic: a seeded typist, fixed pauses,
 * sample data, no network. `demoStateAt(t)` is the whole film at time t (ms),
 * so a Remotion composition can render frame → state with no clock of its own.
 */

export type Step = { type: string } | { pause: number } | { back: number };

export interface DemoScript {
  seed: number;
  steps: Step[];
  /** Scripted fast-pass answers, by draft prefix: the longest matching prefix wins. */
  reads: { upTo: string; read: LiveRead }[];
  profile: VoiceProfile;
  pillars: string[];
  proof: Partial<Record<ReturnType<typeof shapeOf>, ProofPost>>;
  ideas: { id: string; text: string }[];
  landingReady: boolean;
}

/** Typing pauses longer than this count as "stopped typing" (live read fires). */
export const PAUSE_MS = 1200;
/** The scripted read lands this long after the pause starts (feels like a network call). */
export const READ_DELAY_MS = 420;

// mulberry32: tiny seeded PRNG, so every run types the same way
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Key {
  at: number;
  text: string;
}

/** Every keystroke as (time, text after it). Human speed: ~45–110ms a key, slower after punctuation. */
export function keystrokes(script: DemoScript): { keys: Key[]; end: number } {
  const r = rng(script.seed);
  const keys: Key[] = [];
  let t = 600;
  let text = '';
  for (const step of script.steps) {
    if ('pause' in step) {
      t += step.pause;
    } else if ('back' in step) {
      for (let i = 0; i < step.back; i++) {
        t += 28 + r() * 22;
        text = [...text].slice(0, -1).join('');
        keys.push({ at: t, text });
      }
    } else {
      for (const ch of step.type) {
        t += 45 + r() * 65 + (/[.,!?]/.test(ch) ? 160 + r() * 120 : 0) + (ch === '\n' ? 260 : 0);
        text += ch;
        keys.push({ at: t, text });
      }
    }
  }
  return { keys, end: t + 2400 };
}

function readFor(script: DemoScript, text: string): LiveRead | null {
  let best: { n: number; read: LiveRead } | null = null;
  for (const r of script.reads) {
    if (text.startsWith(r.upTo) && (!best || r.upTo.length > best.n))
      best = { n: r.upTo.length, read: r.read };
  }
  return best?.read ?? null;
}

/** The composer's full state at time t of the scripted film. */
export function demoStateAt(
  script: DemoScript,
  t: number,
  keys = keystrokes(script).keys
): LiveState {
  let i = -1;
  for (let k = 0; k < keys.length && keys[k].at <= t; k++) i = k;
  const text = i >= 0 ? keys[i].text : '';
  const lastKey = i >= 0 ? keys[i].at : 0;
  const typing = i >= 0 && t - lastKey < PAUSE_MS;

  // the live read in force: the one answered at the most recent pause that has landed
  let read: LiveRead | null = null;
  let readText = '';
  for (let k = 0; k <= i; k++) {
    const next = keys[k + 1]?.at ?? Infinity;
    const lands = keys[k].at + PAUSE_MS + READ_DELAY_MS;
    if (next > lands && lands <= t) {
      const r = readFor(script, keys[k].text);
      if (r) {
        read = r;
        readText = keys[k].text;
      }
    }
  }
  const reading = !typing && i >= 0 && readText !== text && t - lastKey >= PAUSE_MS;
  const marks = mergeMarks(
    localMarks(text, script.profile),
    read ? anchorQuotes(text, read.marks) : [],
    script.landingReady
  );
  return {
    text,
    marks,
    score: read?.score ?? null,
    pillars: script.pillars,
    pillar: read?.pillar ?? null,
    proof: script.landingReady ? (script.proof[shapeOf(text)] ?? null) : null,
    idea: matchIdea(text, script.ideas),
    landingReady: script.landingReady,
    voiceReady: true,
    posts: script.profile.posts,
    typing,
    reading,
    error: null,
  };
}

// --- the sample film ---------------------------------------------------------

const PROFILE: VoiceProfile = {
  posts: 48,
  lowercase: 0.92,
  sentenceWords: 11,
  emoji: 0.02,
  exclaim: 0.03,
  emDash: 0,
  questionOpen: 0.04,
  usedStock: [],
};

const L1 = 'i asked 40 brands why they skip creators.';
const L2 = ' 31 gave the same answer: they couldn’t tell what the creator was known for.';
const L3 = '\n\nten seconds on a profile. that’s the whole audition.';

export const SAMPLE_SCRIPT: DemoScript = {
  seed: 7,
  steps: [
    { type: 'Excited to announce' },
    { pause: 1700 },
    { back: 19 },
    { pause: 500 },
    { type: L1 },
    { pause: 2200 },
    { type: L2 },
    { pause: 2400 },
    { type: ' honestly it changed how i think about posting' },
    { pause: 2300 },
    { back: 46 },
    { pause: 400 },
    { type: L3 },
    { pause: 3200 },
  ],
  reads: [
    { upTo: 'Excited', read: { score: 22, pillar: null, marks: [] } },
    { upTo: L1, read: { score: 71, pillar: 0, marks: [] } },
    {
      upTo: L1 + L2,
      read: {
        score: 82,
        pillar: 0,
        marks: [
          {
            lens: 'landing',
            quote: 'they couldn’t tell what the creator was known for',
            note: 'Your best receipts posts end on a number. This one ends on the claim.',
          },
        ],
      },
    },
    {
      upTo: L1 + L2 + ' honestly',
      read: {
        score: 74,
        pillar: null,
        marks: [
          {
            lens: 'lane',
            quote: 'it changed how i think about posting',
            note: 'Drifts into your own process. Your lane is what brands look for.',
          },
          {
            lens: 'voice',
            quote: 'honestly',
            note: 'You never hedge into a point. Your posts state it.',
          },
        ],
      },
    },
    { upTo: L1 + L2 + L3, read: { score: 91, pillar: 0, marks: [] } },
  ],
  profile: PROFILE,
  pillars: [
    'What brands actually look for in creators',
    'Building BrandOS in public',
    'Receipts over vibes',
  ],
  proof: {
    long: {
      text: 'i asked 40 brands why they skipped creators. here is what they said',
      lift: 3.1,
    },
    short: { text: 'brands don’t read bios. they read your last ten posts.', lift: 2.4 },
  },
  ideas: [
    { id: 'i1', text: 'What 40 brands told me about why they skip creators' },
    { id: 'i2', text: 'How I priced my first brand deal' },
  ],
  landingReady: true,
};

/** Same film for a thin history: no Landing, no proof. */
export const THIN_SCRIPT: DemoScript = {
  ...SAMPLE_SCRIPT,
  landingReady: false,
  profile: { ...PROFILE, posts: 7 },
};

/**
 * Time in the film just after the draft equals `text` and its read has landed
 * (for still frames: the harness's ?state=). Falls back to the film's end.
 */
export function settledAt(script: DemoScript, text: string): number {
  const { keys, end } = keystrokes(script);
  for (let k = 0; k < keys.length; k++) {
    if (
      keys[k].text === text &&
      (keys[k + 1]?.at ?? Infinity) > keys[k].at + PAUSE_MS + READ_DELAY_MS
    ) {
      return keys[k].at + PAUSE_MS + READ_DELAY_MS + 50;
    }
  }
  return end;
}

export const SAMPLE_TEXT = { L1, L2, L3, HONEST: ' honestly it changed how i think about posting' };

/** Sample data for a typed draft (the harness's ?state=live): local marks + scripted reads, no network. */
export function scriptedState(script: DemoScript, text: string, typing: boolean): LiveState {
  const read = typing ? null : readFor(script, text.trim());
  return {
    text,
    marks: mergeMarks(
      localMarks(text, script.profile),
      read ? anchorQuotes(text, read.marks) : [],
      script.landingReady
    ),
    score: read?.score ?? null,
    pillars: script.pillars,
    pillar: read?.pillar ?? null,
    proof: script.landingReady ? (script.proof[shapeOf(text)] ?? null) : null,
    idea: matchIdea(text, script.ideas),
    landingReady: script.landingReady,
    voiceReady: true,
    posts: script.profile.posts,
    typing,
    reading: false,
    error: null,
  };
}
