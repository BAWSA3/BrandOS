'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCurrentBrand, useBrandStore, useHasHydrated } from '@/lib/store';
import { useSessionTracker } from '@/hooks/useSessionTracker';
import { analytics } from '@/lib/analytics';
import VoiceScanner from '@/components/content-engine/VoiceScanner';
import {
  DAYS_OF_WEEK,
  DayOfWeek,
  SlotId,
  ContentEngineOutput,
  DEFAULT_CONTENT_ENGINE_CONFIG,
} from '@/lib/agents/content-engine.types';

const FORMAT_OPTIONS = [
  '--', 'Thought', 'Hot Take', 'Story', 'Conversational',
];

const CTA_OPTIONS = [
  '--', 'Bookmark This', 'Agree/Disagree', 'Quote RT',
];

function AssignmentPicker({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Animate open
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    }
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) closeSmooth();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Scroll active into view
  useEffect(() => {
    if (!open || !scrollRef.current) return;
    const active = scrollRef.current.querySelector('[data-active="true"]');
    if (active) active.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [open]);

  const closeSmooth = () => {
    setClosing(true);
    setVisible(false);
    setTimeout(() => { setOpen(false); setClosing(false); }, 180);
  };

  const select = (v: string) => {
    onChange(v);
    closeSmooth();
  };

  const idx = options.indexOf(value);
  const nudge = (dir: -1 | 1) => {
    const next = idx + dir;
    if (next >= 0 && next < options.length) onChange(options[next]);
  };

  return (
    <div ref={ref} className="inline-block relative">
      {!open && !closing && (
        <button
          onClick={() => setOpen(true)}
          className="label-mono font-bold text-[var(--accent)] cursor-pointer rounded-[var(--radius-sm)] px-1 py-0.5 -mx-1 -mt-0.5 transition-all duration-200"
          style={{ textShadow: 'none' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.textShadow = '0 0 8px var(--accent)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(0, 71, 255, 0.06)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.textShadow = 'none';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          {value}
        </button>
      )}

      {(open || closing) && (
        <div
          className="inline-flex flex-col items-center gap-0.5"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(-4px) scale(0.96)',
            transition: 'opacity 180ms ease, transform 180ms ease',
          }}
        >
          <button
            onClick={() => nudge(-1)}
            disabled={idx <= 0}
            className="font-mono text-[9px] text-[var(--text-quaternary)] hover:text-[var(--accent)] transition-all duration-200 disabled:opacity-20 hover:scale-110 active:scale-90"
          >
            ▲
          </button>
          <div
            ref={scrollRef}
            className="max-h-[100px] overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--accent)]"
            style={{ boxShadow: '0 2px 12px rgba(0, 71, 255, 0.08)', scrollbarWidth: 'none', minWidth: 120, scrollBehavior: 'smooth' }}
          >
            {options.map(o => (
              <button
                key={o}
                data-active={value === o ? 'true' : undefined}
                onClick={() => select(o)}
                className={`block w-full text-center px-2 py-1.5 font-mono text-[10px] transition-all duration-150 ${
                  value === o
                    ? 'bg-[var(--accent)] text-white font-bold scale-[1.02]'
                    : 'text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] hover:scale-[1.01]'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
          <button
            onClick={() => nudge(1)}
            disabled={idx >= options.length - 1}
            className="font-mono text-[9px] text-[var(--text-quaternary)] hover:text-[var(--accent)] transition-all duration-200 disabled:opacity-20 hover:scale-110 active:scale-90"
          >
            ▼
          </button>
        </div>
      )}
    </div>
  );
}

export default function ContentEnginePage() {
  useSessionTracker('content-engine');

  const hydrated = useHasHydrated();
  const brand = useCurrentBrand();
  const {
    contentEngineConfigs, setContentEngineConfig,
    generationsUsed, generationLimit, isUnlocked,
    incrementGeneration, unlockUnlimited, initReferralCode, referralCode,
  } = useBrandStore();

  // Day is auto-detected (used internally for the API)
  const day: DayOfWeek = (() => {
    const dayIndex = new Date().getDay();
    return dayIndex === 0 ? 'Sunday' : DAYS_OF_WEEK[dayIndex - 1];
  })();
  const [slot, setSlot] = useState<SlotId>('post1');
  const [posts, setPosts] = useState<SlotId[]>(['post1']);
  const [confirmingDelete, setConfirmingDelete] = useState<SlotId | null>(null);
  const [formatBySlot, setFormatBySlot] = useState<Record<SlotId, string>>({ post1: '--', post2: '--' });
  const [ctaBySlot, setCtaBySlot] = useState<Record<SlotId, string>>({ post1: '--', post2: '--' });
  const selectedFormat = formatBySlot[slot];
  const selectedCTA = ctaBySlot[slot];
  const [topic, setTopic] = useState('');
  const [output, setOutput] = useState<ContentEngineOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(1);
  const [linkCopied, setLinkCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setTick(p => (p >= 3 ? 1 : p + 1)), 380);
    return () => clearInterval(id);
  }, [loading]);

  const remaining = isUnlocked ? Infinity : Math.max(0, generationLimit - generationsUsed);
  const atLimit = !isUnlocked && remaining <= 0;

  if (!hydrated) {
    return <div className="min-h-screen bg-[var(--background)]" />;
  }

  // Brand gate
  if (!brand || !brand.name) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-[var(--radius-lg)] bg-[var(--surface)] shadow-[var(--shadow-card)] flex items-center justify-center font-mono text-2xl text-[var(--accent)]">
            &gt;_
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Set Up Your Brand First</h1>
          <p className="text-[var(--text-tertiary)] mb-6">
            The content engine needs your brand DNA to generate on-brand content with your voice.
          </p>
          <Link
            href="/app"
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 font-medium rounded-[var(--radius-md)]"
          >
            Create Brand
          </Link>
        </div>
      </div>
    );
  }

  const rawConfig = contentEngineConfigs[brand.id] || DEFAULT_CONTENT_ENGINE_CONFIG;
  const config = { ...DEFAULT_CONTENT_ENGINE_CONFIG, ...rawConfig, doPatterns: rawConfig.doPatterns || [] };

  const getInviteLink = () => {
    const code = initReferralCode();
    return `${window.location.origin}/early-access?ref=${code}`;
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(getInviteLink());
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const checkReferral = async () => {
    const code = initReferralCode();
    setChecking(true);
    try {
      const res = await fetch(`/api/early-access?ref=${code}`);
      const data = await res.json();
      if (data.unlocked) {
        unlockUnlimited();
      } else {
        setError('No signups yet. Share your link to unlock unlimited generations.');
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      // silently fail
    } finally {
      setChecking(false);
    }
  };

  const generate = async () => {
    if (loading || atLimit) return;
    setLoading(true);
    setOutput(null);
    setError(null);

    try {
      const res = await fetch('/api/try-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: brand.name,
          tone: undefined,
          day,
          slot,
          topic: topic || undefined,
          ctaType: selectedCTA !== '--' ? selectedCTA : undefined,
          gapTargeted: config.engagement.topGaps[0] || undefined,
          voiceScan: config.voiceConstraints.length > 0 ? {
            toneWords: config.voiceConstraints,
            doPatterns: config.doPatterns,
            dontPatterns: config.neverSay,
            sampleTopics: config.themes,
            suggestedVibe: 'default',
            confidence: 0.7,
          } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setOutput(data);
      incrementGeneration();
      analytics.contentGenerated('content-engine');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed. Check connection and try again.');
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

  const addPost = () => {
    if (!posts.includes('post2')) {
      setPosts([...posts, 'post2']);
      setSlot('post2');
    }
  };

  const removePost = (id: SlotId) => {
    if (confirmingDelete === id) {
      setPosts(prev => prev.filter(p => p !== id));
      if (slot === id) setSlot(id === 'post1' ? 'post2' : 'post1');
      setConfirmingDelete(null);
    } else {
      setConfirmingDelete(id);
      setTimeout(() => setConfirmingDelete(prev => prev === id ? null : prev), 3000);
    }
  };

  const dots = '.'.repeat(tick);

  return (
    <div className={`min-h-screen bg-[var(--background)] text-[var(--text-primary)] relative ${!config.scannedHandle ? 'flex items-center justify-center' : ''}`}>
      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className={`max-w-[680px] mx-auto px-6 relative ${config.scannedHandle ? 'py-12' : 'py-6 w-full'}`}>

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" style={{ boxShadow: '0 0 6px var(--accent)' }} />
            <span className="label-mono text-[var(--accent)]">system online</span>
          </div>
          <h1
            className="text-2xl text-[var(--text-primary)] tracking-tight mb-1"
            style={{ fontFamily: 'var(--font-vcr, "VCR OSD Mono", monospace)' }}
          >
            content engine_
          </h1>
          <p className="label-mono text-[var(--text-quaternary)]">brandos · powered by claude</p>
        </div>

        {/* Voice & Context Scanner — first in flow */}
        <VoiceScanner
          config={config}
          brand={brand}
          onSave={(updated) => setContentEngineConfig(brand.id, updated)}
        />

        {/* Everything below only appears after voice scan is complete */}
        <div
          style={{
            maxHeight: config.scannedHandle ? 2000 : 0,
            opacity: config.scannedHandle ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.6s ease, opacity 0.4s ease 0.1s',
          }}
        >

        {/* Generate Panel */}
        <div className="glass-card border border-[var(--surface-tertiary)] rounded-[var(--radius-md)] p-6 mb-4">

          {/* Type Selector */}
          <div className="mb-5">
            <div className="label-mono text-[var(--text-quaternary)] mb-2">Type</div>
            <div className="flex gap-2">
              {/* Post 1 */}
              <div className="flex-1 flex items-center gap-1.5">
                <button
                  onClick={() => setSlot('post1')}
                  className={`btn-engine flex-1 px-3 py-2 text-xs font-mono rounded-[var(--radius-sm)] ${
                    slot === 'post1'
                      ? 'bg-[var(--accent)] text-white font-bold'
                      : 'text-[var(--text-tertiary)] border border-[var(--surface-tertiary)] hover:border-[var(--text-quaternary)]'
                  }`}
                >
                  Post 1
                </button>
                {posts.includes('post1') && posts.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removePost('post1'); }}
                    className={`transition-all duration-200 p-0.5 ${
                      confirmingDelete === 'post1'
                        ? 'text-[var(--danger)] scale-110'
                        : 'text-[var(--text-quaternary)] hover:text-[var(--danger)] hover:scale-110 active:scale-90'
                    }`}
                    title={confirmingDelete === 'post1' ? 'Click again to confirm' : 'Remove post'}
                  >
                    {confirmingDelete === 'post1' ? (
                      <span className="font-mono text-[9px] font-bold" style={{ animation: 'slideIn 0.2s ease' }}>delete?</span>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              {/* Post 2 or Add button */}
              {posts.includes('post2') ? (
                <div className="flex-1 flex items-center gap-1.5" style={{ animation: 'slideIn 0.3s ease' }}>
                  <button
                    onClick={() => setSlot('post2')}
                    className={`btn-engine flex-1 px-3 py-2 text-xs font-mono rounded-[var(--radius-sm)] ${
                      slot === 'post2'
                        ? 'bg-[var(--accent)] text-white font-bold'
                        : 'text-[var(--text-tertiary)] border border-[var(--surface-tertiary)] hover:border-[var(--text-quaternary)]'
                    }`}
                  >
                    Post 2
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removePost('post2'); }}
                    className={`transition-all duration-200 p-0.5 ${
                      confirmingDelete === 'post2'
                        ? 'text-[var(--danger)] scale-110'
                        : 'text-[var(--text-quaternary)] hover:text-[var(--danger)] hover:scale-110 active:scale-90'
                    }`}
                    title={confirmingDelete === 'post2' ? 'Click again to confirm' : 'Remove post'}
                  >
                    {confirmingDelete === 'post2' ? (
                      <span className="font-mono text-[9px] font-bold" style={{ animation: 'slideIn 0.2s ease' }}>delete?</span>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addPost()}
                  className="btn-engine flex-1 px-3 py-2 text-xs font-mono rounded-[var(--radius-sm)] text-[var(--text-quaternary)] border border-dashed border-[var(--surface-tertiary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  style={{ transition: 'all 0.25s ease' }}
                >
                  + add post
                </button>
              )}
            </div>
          </div>

          {/* Today's Assignment — clickable to change */}
          <div className="mb-5 px-4 py-3 rounded-[var(--radius-sm)] border border-[var(--surface-tertiary)]" style={{ background: 'var(--surface-hover)' }}>
            <div className="flex flex-wrap items-center" style={{ gap: '4px 20px' }}>
              <div className="flex items-center gap-1">
                <span className="label-mono text-[var(--text-quaternary)]">Format: </span>
                <AssignmentPicker
                  value={selectedFormat}
                  options={FORMAT_OPTIONS}
                  onChange={v => setFormatBySlot(prev => ({ ...prev, [slot]: v }))}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="label-mono text-[var(--text-quaternary)]">CTA: </span>
                <AssignmentPicker
                  value={selectedCTA}
                  options={CTA_OPTIONS}
                  onChange={v => setCtaBySlot(prev => ({ ...prev, [slot]: v }))}
                />
              </div>
            </div>
          </div>

          {/* Topic */}
          <div className="mb-6">
            <div className="label-mono text-[var(--text-quaternary)] mb-2">Topic</div>
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {(config.themes.length > 0
                ? config.themes
                : ['Build Updates', 'Content Systems', 'Creator Economy', 'Personal Branding', 'Lessons Learned', 'Hot Takes']
              ).map(t => (
                <button
                  key={t}
                  onClick={() => setTopic(topic === t ? '' : t)}
                  className={`btn-engine px-3 py-1.5 text-xs font-mono rounded-[var(--radius-sm)] ${
                    topic === t
                      ? 'bg-[var(--accent)] text-white font-bold'
                      : 'text-[var(--text-tertiary)] border border-[var(--surface-tertiary)] hover:border-[var(--text-quaternary)]'
                  }`}
                >
                  {t.toLowerCase()}
                </button>
              ))}
            </div>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="or type your own topic"
              className="terminal-input w-full bg-[var(--surface)] border border-[var(--surface-tertiary)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-[var(--transition-fast)]"
            />
          </div>

          {/* Generate Button */}
          {atLimit ? (
            /* At limit — show invite CTA instead */
            <div className="border rounded-[var(--radius-sm)] p-4 text-center" style={{ borderColor: 'var(--accent)', background: 'rgba(0, 71, 255, 0.04)' }}>
              <p className="font-mono text-xs text-[var(--text-primary)] mb-1 font-bold">you've used all {generationLimit} generations</p>
              <p className="font-mono text-[10px] text-[var(--text-quaternary)] mb-3">
                invite 1 friend to sign up and unlock unlimited generations.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={copyInviteLink}
                  className="btn-engine label-mono flex-1 py-2.5 rounded-[var(--radius-sm)]"
                  style={linkCopied
                    ? { background: 'var(--success)', color: '#fff' }
                    : { background: 'var(--accent)', color: '#fff', cursor: 'pointer' }
                  }
                >
                  {linkCopied ? 'link copied' : 'copy invite link'}
                </button>
                <button
                  onClick={checkReferral}
                  disabled={checking}
                  className="btn-engine label-mono px-4 py-2.5 rounded-[var(--radius-sm)] border border-[var(--surface-tertiary)] text-[var(--text-tertiary)]"
                  style={{ cursor: checking ? 'default' : 'pointer' }}
                >
                  {checking ? 'checking...' : 'check status'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={generate}
              disabled={loading || !topic.trim() || selectedFormat === '--' || selectedCTA === '--'}
              className="btn-engine label-mono w-full py-3.5 rounded-[var(--radius-sm)]"
              style={loading || !topic.trim() || selectedFormat === '--' || selectedCTA === '--'
                ? { background: 'var(--surface-tertiary)', color: 'var(--text-quaternary)', cursor: 'default' }
                : { background: 'var(--accent)', color: '#fff', cursor: 'pointer' }
              }
            >
              {loading ? `generating${dots}` : '\u2192 generate post'}
            </button>
          )}

          {/* Invite nudge when running low (3 or fewer remaining) */}
          {!isUnlocked && !atLimit && remaining <= 2 && (
            <div className="mt-3 border rounded-[var(--radius-sm)] px-4 py-3" style={{ borderColor: 'var(--surface-tertiary)', background: 'var(--surface-hover)' }}>
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] text-[var(--text-quaternary)]">
                  {remaining} generation{remaining !== 1 ? 's' : ''} left. invite a friend to unlock unlimited.
                </p>
                <button
                  onClick={copyInviteLink}
                  className="label-mono text-[10px] text-[var(--accent)] underline flex-shrink-0 ml-3"
                >
                  {linkCopied ? 'copied' : 'copy link'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="border rounded-[var(--radius-md)] px-4 py-3 mb-4" style={{ background: 'rgba(255, 59, 48, 0.06)', borderColor: 'rgba(255, 59, 48, 0.15)' }}>
            <span className="label-mono" style={{ color: 'var(--danger)' }}>[ERROR] {error}</span>
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="glass-card border border-[var(--surface-tertiary)] rounded-[var(--radius-md)] overflow-hidden">
            {/* Metadata Header */}
            <div className="border-b border-[var(--surface-tertiary)] px-5 py-3" style={{ background: 'var(--surface-hover)' }}>
              <div className="flex flex-wrap" style={{ gap: '4px 20px' }}>
                {output.meta.slot && (
                  <div>
                    <span className="label-mono text-[var(--text-quaternary)]">Slot: </span>
                    <span className="label-mono text-[var(--text-secondary)]">{output.meta.slot}</span>
                  </div>
                )}
                {output.meta.format && (
                  <div>
                    <span className="label-mono text-[var(--text-quaternary)]">Format: </span>
                    <span className="label-mono font-bold text-[var(--accent)]">{output.meta.format}</span>
                  </div>
                )}
                {output.meta.ctaType && (
                  <div>
                    <span className="label-mono text-[var(--text-quaternary)]">CTA: </span>
                    <span className="label-mono text-[var(--text-secondary)]">{output.meta.ctaType}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Post Content */}
            <div className="px-6 py-6">
              <div className="text-sm leading-8 text-[var(--text-primary)] whitespace-pre-wrap font-mono">
                {output.content || output.raw}
              </div>
            </div>

            {/* Nudge */}
            <div className="border-t border-[var(--surface-tertiary)] px-5 py-2.5">
              <p className="font-mono text-[11px] text-[var(--text-quaternary)]">
                sounds just like you?{' '}
                <Link href="/early-access" className="text-[var(--accent)] underline">get your brand score</Link>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-[var(--surface-tertiary)] px-5 py-3 flex gap-3">
              <button
                onClick={copyPost}
                className="btn-engine label-mono px-4 py-2 rounded-[var(--radius-sm)]"
                style={copied
                  ? { background: 'var(--success)', color: '#fff' }
                  : { background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)' }
                }
              >
                {copied ? '[OK] copied' : 'copy post'}
              </button>
              <button
                onClick={generate}
                className="btn-engine label-mono px-4 py-2 rounded-[var(--radius-sm)]"
                style={{ background: 'transparent', color: 'var(--text-tertiary)', border: '1px solid var(--surface-tertiary)' }}
              >
                regenerate
              </button>
            </div>
          </div>
        )}

        </div>{/* end scan-gated wrapper */}

        {/* Footer */}
        <div className="mt-12 pt-5 border-t border-[var(--surface-tertiary)] flex justify-between label-mono text-[var(--text-quaternary)]">
          <span>brick by brick</span>
          <span>{brand.name}</span>
        </div>
      </div>
    </div>
  );
}
