'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  DAYS_OF_WEEK,
  DayOfWeek,
  ContentEngineOutput,
  DEFAULT_CONTENT_ENGINE_CONFIG,
} from '@/lib/agents/content-engine.types';

interface QuickVoiceScan {
  toneWords: string[];
  doPatterns: string[];
  dontPatterns: string[];
  sampleTopics: string[];
  suggestedVibe: string;
  confidence: number;
}

const TONE_PRESETS = [
  { id: 'bold', label: 'bold & direct' },
  { id: 'chill', label: 'chill & playful' },
  { id: 'pro', label: 'professional' },
  { id: 'edgy', label: 'edgy & experimental' },
  { id: 'default', label: 'balanced' },
];

const QUICK_TOPICS = [
  'build update',
  'content strategy',
  'creator economy',
  'AI tools',
  'growth tactics',
  'community building',
];

const TRIAL_DAYS = 7;
const GENS_PER_DAY = 3;

// Trial tracking
function getTrialState(): { startDate: string | null; daysUsed: Record<string, number> } {
  if (typeof window === 'undefined') return { startDate: null, daysUsed: {} };
  try {
    const raw = localStorage.getItem('brandos-trial');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { startDate: null, daysUsed: {} };
}

function saveTrialState(state: { startDate: string; daysUsed: Record<string, number> }) {
  localStorage.setItem('brandos-trial', JSON.stringify(state));
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

export default function TryEnginePage() {
  const [name, setName] = useState('');
  const [tone, setTone] = useState('default');
  const [topic, setTopic] = useState('');
  const [output, setOutput] = useState<ContentEngineOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(1);
  const [rateLimited, setRateLimited] = useState(false);

  // Trial state
  const [trialDay, setTrialDay] = useState(0); // 0-indexed current day in trial
  const [todayGens, setTodayGens] = useState(0);
  const [trialExpired, setTrialExpired] = useState(false);

  // Voice scan state
  const [voiceScan, setVoiceScan] = useState<QuickVoiceScan | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanTick, setScanTick] = useState(1);

  // Today's schedule format
  const today = (() => {
    const dayIndex = new Date().getDay();
    return dayIndex === 0 ? 'Sunday' : DAYS_OF_WEEK[dayIndex - 1];
  })() as DayOfWeek;
  const todayFormat = DEFAULT_CONTENT_ENGINE_CONFIG.schedule[today].post1.format;

  // Initialize trial
  useEffect(() => {
    const state = getTrialState();
    const todayKey = getTodayKey();

    if (!state.startDate) {
      // First visit — don't start trial until first generation
      setTrialDay(0);
      setTodayGens(0);
      return;
    }

    const elapsed = daysBetween(state.startDate, todayKey);

    if (elapsed >= TRIAL_DAYS) {
      setTrialExpired(true);
      setTrialDay(TRIAL_DAYS);
    } else {
      setTrialDay(elapsed);
      setTodayGens(state.daysUsed[todayKey] || 0);
    }
  }, []);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setTick(p => (p >= 3 ? 1 : p + 1)), 380);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    if (!scanning) return;
    const id = setInterval(() => setScanTick(p => (p >= 3 ? 1 : p + 1)), 380);
    return () => clearInterval(id);
  }, [scanning]);

  const scanVoice = useCallback(async (username: string) => {
    const clean = username.replace(/^@/, '').trim();
    if (!clean || clean.length < 2) return;

    setScanning(true);
    setScanError(null);
    setVoiceScan(null);

    try {
      const res = await fetch('/api/try-engine/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      setVoiceScan(data);
      if (data.suggestedVibe && TONE_PRESETS.some(t => t.id === data.suggestedVibe)) {
        setTone(data.suggestedVibe);
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Could not scan profile');
    } finally {
      setScanning(false);
    }
  }, []);

  const generate = async () => {
    if (loading || trialExpired || todayGens >= GENS_PER_DAY) return;

    setLoading(true);
    setOutput(null);
    setError(null);
    setRateLimited(false);

    try {
      const res = await fetch('/api/try-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || undefined,
          tone,
          day: today,
          slot: 'post1',
          topic: topic || undefined,
          voiceScan: voiceScan || undefined,
        }),
      });
      const data = await res.json();

      if (res.status === 429) {
        setRateLimited(true);
        setError(data.error);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      setOutput(data);

      // Update trial state
      const todayKey = getTodayKey();
      const state = getTrialState();
      const startDate = state.startDate || todayKey;
      const newGens = (state.daysUsed[todayKey] || 0) + 1;
      saveTrialState({
        startDate,
        daysUsed: { ...state.daysUsed, [todayKey]: newGens },
      });
      setTodayGens(newGens);

      if (!state.startDate) {
        setTrialDay(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const copyPost = () => {
    if (!output?.content) return;
    navigator.clipboard.writeText(output.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dots = '.'.repeat(tick);
  const scanDots = '.'.repeat(scanTick);
  const todayRemaining = GENS_PER_DAY - todayGens;
  const daysRemaining = TRIAL_DAYS - trialDay;
  const canGenerate = !trialExpired && todayGens < GENS_PER_DAY;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] relative">
      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-[680px] mx-auto px-6 py-12 relative">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" style={{ boxShadow: '0 0 6px var(--accent)' }} />
            <span className="label-mono text-[var(--accent)]">7-day free trial</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-1" style={{ fontFamily: 'var(--font-vcr, "VCR OSD Mono", monospace)' }}>
            content engine_
          </h1>
          <p className="font-mono text-xs text-[var(--text-tertiary)] leading-relaxed mt-2 max-w-md">
            7 days. A different content format each day. Generate on-brand posts in your voice — no sign-up needed.
          </p>
        </div>

        {/* Trial Progress */}
        <div className="glass-card border border-[var(--surface-tertiary)] rounded-[var(--radius-md)] p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="label-mono text-[var(--text-quaternary)]">Your 7-day trial</span>
            <span className="label-mono text-[var(--text-quaternary)]">
              {trialExpired ? 'trial ended' : `day ${trialDay + 1} of ${TRIAL_DAYS}`}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: TRIAL_DAYS }).map((_, i) => {
              const state = getTrialState();
              const isToday = i === trialDay && !trialExpired;
              const isUsed = i < trialDay;
              const startDate = state.startDate;
              const dayDate = startDate ? new Date(new Date(startDate).getTime() + i * 86400000) : new Date(Date.now() + i * 86400000);
              const dayIndex = dayDate.getDay();
              const dayName = dayIndex === 0 ? 'Sunday' : DAYS_OF_WEEK[dayIndex - 1];
              const dayFormat = DEFAULT_CONTENT_ENGINE_CONFIG.schedule[dayName as DayOfWeek].post1.format;

              return (
                <div
                  key={i}
                  className="flex-1 rounded-[var(--radius-sm)] p-2 text-center"
                  style={{
                    background: isToday ? 'var(--accent)' : isUsed ? 'rgba(10, 132, 255, 0.08)' : 'var(--surface)',
                    border: `1px solid ${isToday ? 'var(--accent)' : 'var(--surface-tertiary)'}`,
                  }}
                >
                  <div className="font-mono text-[8px] mb-0.5" style={{ color: isToday ? '#fff' : 'var(--text-quaternary)' }}>
                    {dayName.slice(0, 3)}
                  </div>
                  <div className="font-mono text-[8px] font-bold" style={{ color: isToday ? '#fff' : isUsed ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                    {dayFormat}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Panel */}
        <div className="glass-card border border-[var(--surface-tertiary)] rounded-[var(--radius-md)] p-6 mb-4">

          {/* Today's Format */}
          <div className="mb-6 p-3 rounded-[var(--radius-sm)] border border-[var(--surface-tertiary)]" style={{ background: 'rgba(10, 132, 255, 0.04)' }}>
            <span className="label-mono text-[var(--text-quaternary)]">Today's format: </span>
            <span className="label-mono font-bold text-[var(--accent)]">{todayFormat}</span>
            <span className="label-mono text-[var(--text-quaternary)]"> · {today}</span>
          </div>

          {/* Username + Voice Scan */}
          <div className="mb-6">
            <div className="label-mono text-[var(--text-quaternary)] mb-2">Your X handle</div>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="@yourhandle"
                className="terminal-input flex-1 bg-[var(--surface)] border border-[var(--surface-tertiary)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-[var(--transition-fast)]"
              />
              <button
                onClick={() => scanVoice(name)}
                disabled={scanning || !name.replace(/^@/, '').trim()}
                className="label-mono px-4 py-2.5 rounded-[var(--radius-sm)] transition-[var(--transition-fast)] shrink-0"
                style={scanning
                  ? { background: 'var(--surface-tertiary)', color: 'var(--text-quaternary)' }
                  : { background: 'var(--accent)', color: '#fff' }
                }
              >
                {scanning ? `scanning${scanDots}` : 'scan voice'}
              </button>
            </div>

            {voiceScan && (
              <div className="mt-3 p-3 rounded-[var(--radius-sm)] border border-[var(--surface-tertiary)]" style={{ background: 'rgba(10, 132, 255, 0.04)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
                  <span className="label-mono" style={{ color: 'var(--success)' }}>
                    voice detected — {voiceScan.confidence}% confidence
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {voiceScan.toneWords.map(w => (
                    <span key={w} className="label-mono px-2 py-0.5 rounded-[var(--radius-sm)] border border-[var(--accent)]/20 text-[var(--accent)]">{w}</span>
                  ))}
                </div>
                {voiceScan.doPatterns.length > 0 && (
                  <p className="font-mono text-[10px] text-[var(--text-tertiary)] leading-relaxed">
                    {voiceScan.doPatterns.slice(0, 3).join(' · ')}
                  </p>
                )}
              </div>
            )}

            {scanError && (
              <p className="mt-2 font-mono text-[10px]" style={{ color: 'var(--warning)' }}>
                {scanError} — you can still generate with a vibe preset below.
              </p>
            )}
          </div>

          {/* Vibe Selector */}
          <div className="mb-6">
            <div className="label-mono text-[var(--text-quaternary)] mb-2">
              Vibe {voiceScan && <span className="text-[var(--success)]">(auto-detected)</span>}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {TONE_PRESETS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-[var(--radius-sm)] transition-[var(--transition-fast)] ${
                    tone === t.id
                      ? 'bg-[var(--accent)] text-white font-bold'
                      : 'text-[var(--text-tertiary)] border border-[var(--surface-tertiary)] hover:border-[var(--text-quaternary)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Input */}
          <div className="mb-6">
            <div className="label-mono text-[var(--text-quaternary)] mb-2">
              Topic <span style={{ color: 'var(--surface-tertiary)' }}>(optional)</span>
            </div>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. shipped a new feature this week"
              className="terminal-input w-full bg-[var(--surface)] border border-[var(--surface-tertiary)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-[var(--transition-fast)]"
            />
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {QUICK_TOPICS.map(t => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className="label-mono px-2.5 py-1 text-[var(--text-quaternary)] border border-[var(--surface-tertiary)] rounded-[var(--radius-sm)] hover:text-[var(--text-secondary)] transition-[var(--transition-fast)]"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Generate or Gate */}
          {trialExpired ? (
            <div className="text-center py-4">
              <p className="font-mono text-sm text-[var(--text-secondary)] mb-2">
                Your 7-day trial has ended.
              </p>
              <p className="font-mono text-xs text-[var(--text-tertiary)] mb-5">
                You've experienced the full weekly content system. Sign up free to keep generating with unlimited access, deep voice fingerprinting, and the full BrandOS suite.
              </p>
              <Link
                href="/app"
                className="label-mono inline-block px-6 py-3 rounded-[var(--radius-sm)]"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                sign up free →
              </Link>
            </div>
          ) : todayGens >= GENS_PER_DAY ? (
            <div className="text-center py-4">
              <p className="font-mono text-sm text-[var(--text-secondary)] mb-2">
                You've used today's {GENS_PER_DAY} generations.
              </p>
              <p className="font-mono text-xs text-[var(--text-tertiary)] mb-4">
                Come back tomorrow for a new format. {daysRemaining - 1} day{daysRemaining - 1 !== 1 ? 's' : ''} left in your trial.
              </p>
              <Link
                href="/app"
                className="label-mono inline-block px-5 py-2.5 rounded-[var(--radius-sm)]"
                style={{ background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)' }}
              >
                or sign up now for unlimited →
              </Link>
            </div>
          ) : (
            <>
              <button
                onClick={generate}
                disabled={loading}
                className="label-mono w-full py-3.5 rounded-[var(--radius-sm)] transition-[var(--transition-fast)]"
                style={loading
                  ? { background: 'var(--surface-tertiary)', color: 'var(--text-quaternary)', cursor: 'default' }
                  : { background: 'var(--accent)', color: '#fff', cursor: 'pointer' }
                }
              >
                {loading ? `generating${dots}` : '\u2192 generate post'}
              </button>
              <div className="text-center mt-3">
                <span className="label-mono text-[var(--text-quaternary)]">
                  {todayRemaining} generation{todayRemaining !== 1 ? 's' : ''} left today · {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                </span>
              </div>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="border rounded-[var(--radius-md)] px-4 py-3 mb-4" style={{ background: 'rgba(255, 59, 48, 0.06)', borderColor: 'rgba(255, 59, 48, 0.15)' }}>
            <span className="label-mono" style={{ color: 'var(--danger)' }}>[ERROR] {error}</span>
            {rateLimited && (
              <div className="mt-2">
                <Link href="/app" className="label-mono text-[var(--accent)] underline">
                  Sign up for unlimited access →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="glass-card border border-[var(--surface-tertiary)] rounded-[var(--radius-md)] overflow-hidden">
            {output.meta.format && (
              <div className="border-b border-[var(--surface-tertiary)] px-5 py-3" style={{ background: 'var(--surface-hover)' }}>
                <span className="label-mono text-[var(--text-quaternary)]">Format: </span>
                <span className="label-mono font-bold text-[var(--accent)]">{output.meta.format}</span>
              </div>
            )}

            <div className="px-6 py-6">
              <div className="text-sm leading-8 text-[var(--text-primary)] whitespace-pre-wrap font-mono">
                {output.content || output.raw}
              </div>
            </div>

            {/* Voice Match Nudge */}
            <div className="border-t border-[var(--surface-tertiary)] px-5 py-3" style={{ background: 'rgba(10, 132, 255, 0.04)' }}>
              <div className="flex items-center" style={{ gap: '12px' }}>
                <div className="label-mono" style={{ color: voiceScan ? 'var(--accent)' : 'var(--warning)' }}>
                  voice match: ~{voiceScan ? '60' : '40'}%
                </div>
                <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                  {voiceScan
                    ? 'Quick scan. Full Brand DNA gets you to 85%+. '
                    : 'Users with Brand DNA average 85%+. '
                  }
                  <Link href="/app" className="text-[var(--accent)] underline">Set up yours free →</Link>
                </span>
              </div>
            </div>

            {(output.footer?.postingWindow || output.footer?.hashtags) && (
              <div className="border-t border-[var(--surface-tertiary)] px-5 py-2.5 flex flex-wrap" style={{ gap: '8px 24px' }}>
                {output.footer.postingWindow && (
                  <div>
                    <span className="label-mono text-[var(--text-quaternary)]">Window: </span>
                    <span className="label-mono text-[var(--text-secondary)]">{output.footer.postingWindow}</span>
                  </div>
                )}
                {output.footer.hashtags && (
                  <div>
                    <span className="label-mono text-[var(--text-quaternary)]">Hashtags: </span>
                    <span className="label-mono text-[var(--text-secondary)]">{output.footer.hashtags}</span>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-[var(--surface-tertiary)] px-5 py-3 flex gap-3">
              <button
                onClick={copyPost}
                className="label-mono px-4 py-2 rounded-[var(--radius-sm)] transition-[var(--transition-fast)]"
                style={copied
                  ? { background: 'var(--success)', color: '#fff' }
                  : { background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)' }
                }
              >
                {copied ? '[OK] copied' : 'copy post'}
              </button>
              {canGenerate && (
                <button
                  onClick={generate}
                  className="label-mono px-4 py-2 rounded-[var(--radius-sm)] transition-[var(--transition-fast)]"
                  style={{ background: 'transparent', color: 'var(--text-tertiary)', border: '1px solid var(--surface-tertiary)' }}
                >
                  regenerate ({todayRemaining})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-10 glass-card border border-[var(--surface-tertiary)] rounded-[var(--radius-md)] p-6 text-center">
          <h2 className="font-mono text-sm font-bold text-[var(--text-primary)] mb-2">Want posts that actually sound like you?</h2>
          <p className="font-mono text-xs text-[var(--text-tertiary)] mb-5 max-w-sm mx-auto">
            BrandOS maps your voice from real content, then generates posts with your exact tone, patterns, and vocabulary. Free to start.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/app"
              className="label-mono inline-block px-5 py-2.5 rounded-[var(--radius-sm)]"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              get started free
            </Link>
            <Link
              href="/score"
              className="label-mono inline-block px-5 py-2.5 rounded-[var(--radius-sm)]"
              style={{ background: 'transparent', color: 'var(--text-tertiary)', border: '1px solid var(--surface-tertiary)' }}
            >
              check your brand score
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-5 border-t border-[var(--surface-tertiary)] flex justify-between label-mono text-[var(--text-quaternary)]">
          <span>BrandOS</span>
          <span>7-day free trial</span>
        </div>
      </div>
    </div>
  );
}
