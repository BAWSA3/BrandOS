'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  anchorQuotes,
  LIVE_MAX_CHARS,
  localMarks,
  matchIdea,
  mergeMarks,
  shapeOf,
  VOICE_MIN_POSTS,
  type DraftShape,
  type LiveRead,
  type ProofPost,
  type VoiceProfile,
} from '@/lib/live-marks';
import { keystrokes, demoStateAt, PAUSE_MS, type DemoScript } from './demo';
import type { LiveState } from './types';

/**
 * The live composer's engine (docs/LIVE-COMPOSER-SPEC.md):
 *   tier 0: voice marks computed here on every keystroke (no network),
 *   tier 1: /api/dashboard/live-marks after a pause; quotes re-anchor on every
 *           edit, so marks follow their words and drop when the words go.
 * Switching brand refetches the profile and re-reads the draft.
 */

interface Ctx {
  profile: VoiceProfile;
  landingReady: boolean;
  pillars: string[];
  proof: Partial<Record<DraftShape, ProofPost>>;
}

const READ_AFTER_MS = 1300;

export function useLiveComposer({
  text,
  accountId,
  ideas,
  enabled = true,
}: {
  text: string;
  accountId: string | null;
  ideas: { id: string; text: string }[];
  /** off: no requests at all (the room without LIVE_COMPOSER) */
  enabled?: boolean;
}): LiveState {
  const [ctx, setCtx] = useState<{ key: string; value: Ctx | null; error: string | null } | null>(
    null
  );
  const [read, setRead] = useState<{ key: string; text: string; value: LiveRead } | null>(null);
  const [inflight, setInflight] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState(0);
  const [now, setNow] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const brandKey = accountId ?? '';

  // brand context: once per brand
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const q = accountId ? `?account=${encodeURIComponent(accountId)}` : '';
    fetch(`/api/dashboard/live-marks${q}`)
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as Ctx & { error?: string };
        if (cancelled) return;
        if (!res.ok)
          setCtx({ key: brandKey, value: null, error: j.error ?? 'Live marks are off right now.' });
        else setCtx({ key: brandKey, value: j, error: null });
      })
      .catch(
        () =>
          !cancelled &&
          setCtx({ key: brandKey, value: null, error: 'Live marks are off right now.' })
      );
    return () => {
      cancelled = true;
    };
  }, [accountId, brandKey, enabled]);

  // typing clock: a key resets it; the pause is when it's been quiet PAUSE_MS
  useEffect(() => {
    const at = Date.now();
    setLastKey(at);
    setNow(at);
    const t = setTimeout(() => setNow(Date.now()), PAUSE_MS + 20);
    return () => clearTimeout(t);
  }, [text]);

  // tier 1: read the draft after a pause (skip when unchanged or too short)
  const c = ctx?.key === brandKey ? ctx.value : null;
  useEffect(() => {
    const draft = text.trim();
    if (!c || draft.length < 12 || [...draft].length > LIVE_MAX_CHARS) return;
    if (read?.key === brandKey && read.text === draft) return;
    const ac = new AbortController();
    const t = setTimeout(async () => {
      setInflight(draft);
      try {
        const res = await fetch('/api/dashboard/live-marks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: draft, ...(accountId ? { account: accountId } : {}) }),
          signal: ac.signal,
        });
        const j = (await res.json().catch(() => ({}))) as LiveRead & { error?: string };
        if (!res.ok) throw new Error(j.error || 'Live marks paused. Keep writing.');
        setRead({ key: brandKey, text: draft, value: j });
        setError(null);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError((e as Error).message);
      } finally {
        setInflight((f) => (f === draft ? null : f));
      }
    }, READ_AFTER_MS);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [text, c, accountId, brandKey, read]);

  const local = useMemo(() => localMarks(text, c?.profile ?? null), [text, c]);
  const r = read?.key === brandKey ? read.value : null;
  const marks = useMemo(
    () => mergeMarks(local, r ? anchorQuotes(text, r.marks) : [], c?.landingReady ?? false),
    [local, r, text, c]
  );
  const landingReady = c?.landingReady ?? false;
  return {
    text,
    marks,
    score: r?.score ?? null,
    pillars: c?.pillars ?? [],
    pillar: r?.pillar ?? null,
    proof: landingReady ? (c?.proof[shapeOf(text)] ?? null) : null,
    idea: matchIdea(text, ideas),
    landingReady,
    voiceReady: (c?.profile.posts ?? 0) >= VOICE_MIN_POSTS,
    posts: c?.profile.posts ?? 0,
    typing: now - lastKey < PAUSE_MS,
    reading: inflight !== null,
    error: ctx?.key === brandKey ? (ctx.error ?? error) : null,
  };
}

/**
 * Scripted playback at wall-clock speed (the harness's ?demo=). Re-renders only
 * when the film's state changes (a key, a pause, a read), not every frame.
 */
export function useDemoComposer(script: DemoScript, opts: { loop?: boolean } = {}): LiveState {
  const film = useMemo(() => keystrokes(script), [script]);
  const [state, setState] = useState<LiveState>(() => demoStateAt(script, 0, film.keys));
  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    let sig = '';
    const tick = (ms: number) => {
      if (start === null) start = ms;
      let el = ms - start;
      if (el > film.end + 1500) {
        if (!opts.loop) return;
        start = ms;
        el = 0;
      }
      const next = demoStateAt(script, el, film.keys);
      const s = [
        next.text,
        next.typing,
        next.reading,
        next.score,
        next.pillar,
        next.marks.length,
      ].join('|');
      if (s !== sig) {
        sig = s;
        setState(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [script, film, opts.loop]);
  return state;
}
