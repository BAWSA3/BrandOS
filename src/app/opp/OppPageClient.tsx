'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserResult {
  profile: {
    name: string;
    username: string;
    description: string;
    profile_image_url: string;
    public_metrics: {
      followers_count: number;
      following_count: number;
      tweet_count: number;
      listed_count: number;
    };
  };
  score: number;
  archetype: string;
  phases: {
    define: number;
    check: number;
    generate: number;
    scale: number;
  };
}

interface RoastInsights {
  topicOverlap: string;
  strengthContrast: string;
  weaknessExploit: string;
}

interface RoastResult {
  phases: {
    define: { winner: string; line: string; gap: number };
    check: { winner: string; line: string; gap: number };
    generate: { winner: string; line: string; gap: number };
    scale: { winner: string; line: string; gap: number };
  };
  verdict: { winner: string; line: string };
  insights: RoastInsights;
  shareOneLiner: string;
}

interface InteractionBreakdown {
  replies: number;
  mentions: number;
  retweets: number;
  quoteTweets: number;
}

interface InteractionData {
  userA: string;
  userB: string;
  mutualScore: number;
  aToB: { score: number; breakdown: InteractionBreakdown };
  bToA: { score: number; breakdown: InteractionBreakdown };
}

interface OppResult {
  user1: UserResult;
  user2: UserResult;
  roast: RoastResult;
  interactionData?: InteractionData | null;
}

interface LeaderboardEntry {
  username: string;
  matchupCount: number;
  wins: number;
  losses: number;
  winRate: number;
  avgScore: number;
}

type FlowState = 'input' | 'scanning' | 'results' | 'error';
type InputMode = 'auto' | 'manual';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getThreatLevel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'LETHAL', color: '#FF3333' };
  if (score >= 60) return { label: 'DANGEROUS', color: '#FFB800' };
  if (score >= 40) return { label: 'MODERATE', color: '#00FF88' };
  return { label: 'LOW RISK', color: '#666' };
}

function renderHPBar(value: number, max = 100, width = 12): string {
  const filled = Math.round((value / max) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

const PHASES = [
  { key: 'define' as const, label: 'DEFINE', icon: '◎' },
  { key: 'check' as const, label: 'CHECK', icon: '◈' },
  { key: 'generate' as const, label: 'GENERATE', icon: '◆' },
  { key: 'scale' as const, label: 'SCALE', icon: '◉' },
];

const AUTO_SCAN_STEPS = [
  { text: 'INITIATING RECON SWEEP...', icon: '◌' },
  { text: 'SCANNING TARGET DNA...', icon: '◎' },
  { text: 'ANALYZING INTERACTION PATTERNS...', icon: '◈' },
  { text: 'CONFIRMING MUTUAL ENGAGEMENT...', icon: '⊕' },
  { text: 'RIVAL LOCKED — SCORING TARGET...', icon: '◆' },
  { text: 'COMPILING INTELLIGENCE REPORT...', icon: '◉' },
];

const MANUAL_SCAN_STEPS = [
  { text: 'SCANNING AGENT 1...', icon: '◌' },
  { text: 'SCANNING AGENT 2...', icon: '◎' },
  { text: 'CROSS-REFERENCING PROFILES...', icon: '◈' },
  { text: 'GENERATING THREAT ANALYSIS...', icon: '◆' },
  { text: 'COMPILING MISSION DEBRIEF...', icon: '⊕' },
];

const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";

// ---------------------------------------------------------------------------
// Radar Animation
// ---------------------------------------------------------------------------

function RadarSweep({ active }: { active: boolean }) {
  return (
    <div style={{ position: 'relative', width: '180px', height: '180px' }}>
      {[1, 2, 3, 4].map((ring) => (
        <div key={ring} style={{ position: 'absolute', top: `${50 - ring * 12.5}%`, left: `${50 - ring * 12.5}%`, width: `${ring * 25}%`, height: `${ring * 25}%`, borderRadius: '50%', border: '1px solid rgba(0, 255, 136, 0.15)' }} />
      ))}
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(0, 255, 136, 0.1)' }} />
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(0, 255, 136, 0.1)' }} />
      {active && (
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', top: '50%', left: '50%', width: '50%', height: '2px', transformOrigin: '0 0', background: 'linear-gradient(90deg, rgba(0, 255, 136, 0.8), transparent)' }} />
      )}
      <motion.div animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
        style={{ position: 'absolute', top: '50%', left: '50%', width: '6px', height: '6px', borderRadius: '50%', background: '#00FF88', transform: 'translate(-50%, -50%)', boxShadow: '0 0 12px rgba(0,255,136,0.6)' }} />
      {active && [
        { top: '30%', left: '65%', delay: 0.5 },
        { top: '60%', left: '25%', delay: 1.2 },
        { top: '45%', left: '72%', delay: 2.0 },
      ].map((blip, i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
          transition={{ delay: blip.delay, duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
          style={{ position: 'absolute', top: blip.top, left: blip.left, width: '4px', height: '4px', borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 8px rgba(0,255,136,0.5)' }} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OppPageClient() {
  const [state, setState] = useState<FlowState>('input');
  const [inputMode, setInputMode] = useState<InputMode>('auto');
  const [user1Input, setUser1Input] = useState('');
  const [user2Input, setUser2Input] = useState('');
  const [result, setResult] = useState<OppResult | null>(null);
  const [error, setError] = useState('');
  const [scanStep, setScanStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [email, setEmail] = useState('');
  const [emailState, setEmailState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [quickWins, setQuickWins] = useState<string[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  // Fetch leaderboard on mount
  useEffect(() => {
    fetch('/api/opp/leaderboard?limit=5')
      .then((r) => r.json())
      .then((data) => { if (data.leaderboard) setLeaderboard(data.leaderboard); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const u1 = params.get('u1');
    const u2 = params.get('u2');
    if (u1) setUser1Input(u1);
    if (u2) { setUser2Input(u2); setInputMode('manual'); }
  }, []);

  const scanSteps = inputMode === 'auto' ? AUTO_SCAN_STEPS : MANUAL_SCAN_STEPS;

  const handleAutoSubmit = useCallback(async () => {
    const clean = user1Input.replace(/^@/, '').trim();
    if (!clean) { setError('AGENT HANDLE REQUIRED.'); setState('error'); return; }
    setState('scanning');
    setScanStep(0);
    const stepInterval = setInterval(() => {
      setScanStep((prev) => Math.min(prev + 1, AUTO_SCAN_STEPS.length - 1));
    }, 3000);

    try {
      const scoreRes = await fetch('/api/x-brand-score', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean }),
      });
      if (!scoreRes.ok) throw new Error(`TARGET @${clean} NOT FOUND IN DATABASE`);
      const scoreData = await scoreRes.json();
      const userScore = scoreData.brandScore.overallScore;
      const userArchetype = scoreData.brandScore.archetype?.primary || '';

      const matchRes = await fetch('/api/opp/match', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean, score: userScore, archetype: userArchetype }),
      });
      if (!matchRes.ok) {
        const matchData = await matchRes.json();
        throw new Error(matchData.error || 'NO RIVAL FOUND IN DATABASE');
      }
      const { rival, interactionData } = await matchRes.json();

      const oppRes = await fetch('/api/opp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1: clean, user2: rival, interactionData }),
      });
      clearInterval(stepInterval);
      if (!oppRes.ok) { const data = await oppRes.json(); throw new Error(data.error || 'INTEL GENERATION FAILED'); }
      const data: OppResult = await oppRes.json();
      setResult(data);
      setState('results');
      updateUrl(data);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err instanceof Error ? err.message : 'MISSION ABORTED — UNKNOWN ERROR');
      setState('error');
    }
  }, [user1Input]);

  const handleManualSubmit = useCallback(async () => {
    const clean1 = user1Input.replace(/^@/, '').trim();
    const clean2 = user2Input.replace(/^@/, '').trim();
    if (!clean1 || !clean2) { setError('BOTH AGENT HANDLES REQUIRED.'); setState('error'); return; }
    if (clean1.toLowerCase() === clean2.toLowerCase()) { setError("CAN'T RUN OPS ON YOURSELF, AGENT."); setState('error'); return; }
    setState('scanning');
    setScanStep(0);
    const stepInterval = setInterval(() => {
      setScanStep((prev) => Math.min(prev + 1, MANUAL_SCAN_STEPS.length - 1));
    }, 2500);

    try {
      const response = await fetch('/api/opp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1: clean1, user2: clean2 }),
      });
      clearInterval(stepInterval);
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'INTEL GENERATION FAILED'); }
      const data: OppResult = await response.json();
      setResult(data);
      setState('results');
      updateUrl(data);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err instanceof Error ? err.message : 'MISSION ABORTED — UNKNOWN ERROR');
      setState('error');
    }
  }, [user1Input, user2Input]);

  function updateUrl(data: OppResult) {
    const params = new URLSearchParams({
      u1: data.user1.profile.username, u2: data.user2.profile.username,
      s1: String(data.user1.score), s2: String(data.user2.score),
      a1: data.user1.archetype, a2: data.user2.archetype,
      d1: String(data.user1.phases.define), d2: String(data.user2.phases.define),
      c1: String(data.user1.phases.check), c2: String(data.user2.phases.check),
      g1: String(data.user1.phases.generate), g2: String(data.user2.phases.generate),
      sc1: String(data.user1.phases.scale), sc2: String(data.user2.phases.scale),
    });
    window.history.replaceState(null, '', `/opp?${params.toString()}`);
  }

  function shareToX() {
    if (!result) return;
    const text = result.roast.shareOneLiner;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function downloadCard() {
    if (!cardRef.current) return;
    const { domToPng } = await import('modern-screenshot');
    const dataUrl = await domToPng(cardRef.current, { scale: 2 });
    const link = document.createElement('a');
    link.download = `opp-${result?.user1.profile.username}-vs-${result?.user2.profile.username}.png`;
    link.href = dataUrl;
    link.click();
  }

  async function handleBeatMyOpp() {
    if (!result || !email || emailState === 'sending') return;
    setEmailState('sending');
    try {
      const res = await fetch('/api/opp/beat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          username: result.user1.profile.username,
          oppUsername: result.user2.profile.username,
          userScore: result.user1.score,
          oppScore: result.user2.score,
          phases: result.user1.phases,
          oppPhases: result.user2.phases,
          archetype: result.user1.archetype,
          oppArchetype: result.user2.archetype,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuickWins(data.quickWins || []);
        setEmailState('sent');
      } else {
        setEmailState('idle');
      }
    } catch {
      setEmailState('idle');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060A0F', color: '#fff', fontFamily: MONO, position: 'relative', overflow: 'hidden' }}>
      {/* Grid overlay */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
      {/* Scanline */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 3px)', pointerEvents: 'none', zIndex: 10 }} />

      {/* Header */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(0,255,136,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,255,136,0.02)', position: 'relative', zIndex: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 8px rgba(0,255,136,0.5)' }} />
          <span style={{ color: '#00FF88', fontSize: '10px', letterSpacing: '0.2em' }}>BRANDOS</span>
          <span style={{ color: 'rgba(0,255,136,0.2)' }}>│</span>
          <span style={{ color: 'rgba(0,255,136,0.5)', fontSize: '9px', letterSpacing: '0.15em' }}>OPP INTELLIGENCE UNIT</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: 'rgba(0,255,136,0.3)', fontSize: '9px', letterSpacing: '0.1em' }}>CLASSIFIED</span>
          <a href="/" style={{ color: 'rgba(0,255,136,0.2)', fontSize: '9px', letterSpacing: '0.1em', textDecoration: 'none' }}>mybrandos.app</a>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px', position: 'relative', zIndex: 5 }}>
        <AnimatePresence mode="wait">
          {/* ── INPUT ─────────────────────────────────── */}
          {state === 'input' && (
            <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <motion.div initial={{ opacity: 0, scale: 0.9, rotate: -2 }} animate={{ opacity: 1, scale: 1, rotate: -1 }}
                style={{ display: 'inline-block', padding: '6px 16px', border: '2px solid rgba(255,51,51,0.4)', borderRadius: '2px', color: '#FF3333', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '32px' }}>
                ■ CLASSIFIED — EYES ONLY
              </motion.div>

              <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '4px', letterSpacing: '0.05em' }}>FIND YOUR OPP</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, rgba(0,255,136,0.3), transparent)' }} />
                <span style={{ color: 'rgba(0,255,136,0.4)', fontSize: '9px', letterSpacing: '0.15em' }}>MISSION BRIEFING</span>
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(270deg, rgba(0,255,136,0.3), transparent)' }} />
              </div>

              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '40px', lineHeight: '1.7' }}>
                {inputMode === 'auto'
                  ? "Enter your handle. We'll scan your interactions, find your #1 rival, and run the intel."
                  : "Enter both handles. We'll tell you who cooks."}
              </p>

              {/* Leaderboard teaser */}
              {leaderboard.length > 0 && (
                <div style={{ marginBottom: '32px', padding: '16px', background: 'rgba(0,255,136,0.02)', border: '1px solid rgba(0,255,136,0.08)', borderRadius: '4px' }}>
                  <div style={{ color: 'rgba(0,255,136,0.4)', fontSize: '9px', letterSpacing: '0.15em', marginBottom: '12px' }}>
                    🏆 MOST TARGETED OPPS
                  </div>
                  {leaderboard.slice(0, 3).map((entry, i) => (
                    <div key={entry.username} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 2 ? '1px solid rgba(0,255,136,0.05)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#FFB800', fontSize: '10px', width: '16px' }}>#{i + 1}</span>
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>@{entry.username}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: 'rgba(0,255,136,0.4)', fontSize: '9px' }}>{entry.matchupCount} matchups</span>
                        <span style={{ color: entry.winRate >= 50 ? '#00FF88' : '#FF3333', fontSize: '9px' }}>{entry.winRate}% W</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ color: '#00FF88', fontSize: '9px', letterSpacing: '0.15em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ opacity: 0.5 }}>{'>'}</span> AGENT HANDLE
                  </label>
                  <input type="text" value={user1Input} onChange={(e) => setUser1Input(e.target.value)} placeholder="@yourhandle"
                    onKeyDown={(e) => { if (e.key === 'Enter') { if (inputMode === 'auto') handleAutoSubmit(); else document.getElementById('opp-input-2')?.focus(); } }}
                    style={{ width: '100%', padding: '16px 20px', background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '4px', color: '#fff', fontSize: '16px', fontFamily: MONO, outline: 'none', boxSizing: 'border-box', caretColor: '#00FF88' }} />
                </div>
                {inputMode === 'manual' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0', gap: '12px' }}>
                      <div style={{ height: '1px', width: '40px', background: 'rgba(255,51,51,0.3)' }} />
                      <span style={{ color: '#FF3333', fontSize: '16px', fontWeight: 700, letterSpacing: '0.2em' }}>VS</span>
                      <div style={{ height: '1px', width: '40px', background: 'rgba(255,51,51,0.3)' }} />
                    </div>
                    <label style={{ color: '#00FF88', fontSize: '9px', letterSpacing: '0.15em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ opacity: 0.5 }}>{'>'}</span> TARGET HANDLE
                    </label>
                    <input id="opp-input-2" type="text" value={user2Input} onChange={(e) => setUser2Input(e.target.value)} placeholder="@theirhandle"
                      onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                      style={{ width: '100%', padding: '16px 20px', background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '4px', color: '#fff', fontSize: '16px', fontFamily: MONO, outline: 'none', boxSizing: 'border-box', caretColor: '#00FF88' }} />
                  </motion.div>
                )}
              </div>

              <button onClick={() => setInputMode(inputMode === 'auto' ? 'manual' : 'auto')}
                style={{ background: 'none', border: 'none', color: 'rgba(0,255,136,0.4)', fontSize: '10px', letterSpacing: '0.1em', fontFamily: MONO, cursor: 'pointer', marginBottom: '24px', padding: '4px 0' }}>
                {inputMode === 'auto' ? '[ SWITCH TO MANUAL TARGET MODE ]' : '[ SWITCH TO AUTO-DETECT MODE ]'}
              </button>

              <button onClick={inputMode === 'auto' ? handleAutoSubmit : handleManualSubmit}
                style={{ width: '100%', padding: '18px', background: 'transparent', border: '2px solid #00FF88', borderRadius: '4px', color: '#00FF88', fontSize: '13px', letterSpacing: '0.2em', fontFamily: MONO, cursor: 'pointer' }}>
                {inputMode === 'auto' ? '⊕ INITIATE RECON' : '⊕ LAUNCH MISSION'}
              </button>
            </motion.div>
          )}

          {/* ── SCANNING ──────────────────────────────── */}
          {state === 'scanning' && (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '500px', gap: '32px' }}>
              <RadarSweep active={true} />
              <div style={{ padding: '24px 32px', background: 'rgba(0,255,136,0.02)', border: '1px solid rgba(0,255,136,0.1)', borderRadius: '4px', width: '100%', maxWidth: '420px' }}>
                <div style={{ color: 'rgba(0,255,136,0.3)', fontSize: '9px', letterSpacing: '0.15em', marginBottom: '16px' }}>MISSION LOG</div>
                {scanSteps.map((step, i) => (
                  <motion.div key={step.text} initial={{ opacity: 0, x: -10 }} animate={{ opacity: i <= scanStep ? 1 : 0.15, x: 0 }} transition={{ delay: i * 0.3 }}
                    style={{ fontSize: '11px', color: i < scanStep ? '#00FF88' : i === scanStep ? '#FFB800' : 'rgba(255,255,255,0.2)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {i < scanStep && <span style={{ color: '#00FF88' }}>✓</span>}
                    {i === scanStep && <motion.span animate={{ opacity: [1, 0.2] }} transition={{ duration: 0.6, repeat: Infinity }} style={{ color: '#FFB800' }}>{step.icon}</motion.span>}
                    {i > scanStep && <span style={{ opacity: 0.3 }}>{step.icon}</span>}
                    {step.text}
                  </motion.div>
                ))}
              </div>
              <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ color: 'rgba(0,255,136,0.4)', fontSize: '10px', letterSpacing: '0.15em' }}>
                ESTIMATED TIME: ~20 SECONDS
              </motion.div>
            </motion.div>
          )}

          {/* ── ERROR ─────────────────────────────────── */}
          {state === 'error' && (
            <motion.div key="error" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: '80px 24px' }}>
              <div style={{ color: '#FF3333', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '16px' }}>⚠ MISSION FAILED</div>
              <div style={{ color: '#FF3333', fontSize: '13px', marginBottom: '32px' }}>{error}</div>
              <button onClick={() => { setState('input'); setError(''); }}
                style={{ padding: '14px 32px', background: 'transparent', border: '1px solid rgba(255,51,51,0.3)', borderRadius: '4px', color: '#FF3333', fontSize: '11px', letterSpacing: '0.15em', fontFamily: MONO, cursor: 'pointer' }}>
                RETRY MISSION
              </button>
            </motion.div>
          )}

          {/* ── RESULTS ──────────────────────────────── */}
          {state === 'results' && result && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Header */}
              <motion.div initial={{ opacity: 0, scale: 1.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ color: '#00FF88', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '8px' }}>■ INTELLIGENCE REPORT COMPLETE</div>
                <div style={{ color: 'rgba(0,255,136,0.2)', fontSize: '9px', letterSpacing: '0.15em' }}>@{result.user1.profile.username} vs @{result.user2.profile.username}</div>
              </motion.div>

              {/* Interaction intel badge */}
              {result.interactionData && result.interactionData.mutualScore > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                  style={{ padding: '12px 16px', background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.15)', borderRadius: '4px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#FFB800', fontSize: '14px' }}>⚡</span>
                  <div>
                    <div style={{ color: '#FFB800', fontSize: '10px', letterSpacing: '0.12em', marginBottom: '2px' }}>ACTIVE RIVALS DETECTED</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
                      These two interact on X — {result.interactionData.aToB.breakdown.replies + result.interactionData.bToA.breakdown.replies} replies, {result.interactionData.aToB.breakdown.retweets + result.interactionData.bToA.breakdown.retweets} RTs, {result.interactionData.aToB.breakdown.quoteTweets + result.interactionData.bToA.breakdown.quoteTweets} QRTs between them
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Shareable Card */}
              <div ref={cardRef}
                style={{ width: '600px', height: '340px', background: '#060A0F', padding: '20px 24px', borderRadius: '4px', border: '1px solid rgba(0,255,136,0.15)', fontFamily: MONO, color: '#fff', position: 'relative', overflow: 'hidden', marginBottom: '24px', boxSizing: 'border-box' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(rgba(0,255,136,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.02) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 3px)', pointerEvents: 'none' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00FF88' }} />
                    <span style={{ color: '#00FF88', fontSize: '8px', letterSpacing: '0.2em' }}>BRANDOS</span>
                    <span style={{ color: 'rgba(0,255,136,0.2)', fontSize: '8px' }}>│</span>
                    <span style={{ color: 'rgba(0,255,136,0.5)', fontSize: '8px', letterSpacing: '0.12em' }}>OPP INTEL REPORT</span>
                  </div>
                  <span style={{ color: 'rgba(0,255,136,0.3)', fontSize: '7px', letterSpacing: '0.1em' }}>mybrandos.app/opp</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', position: 'relative' }}>
                  <CardDossier user={result.user1} side="left" />
                  <span style={{ color: '#FF3333', fontSize: '18px', fontWeight: 700, letterSpacing: '0.15em', textShadow: '0 0 20px rgba(255,51,51,0.3)' }}>VS</span>
                  <CardDossier user={result.user2} side="right" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '12px', position: 'relative' }}>
                  {PHASES.map((phase) => {
                    const s1 = result.user1.phases[phase.key]; const s2 = result.user2.phases[phase.key]; const w = s1 >= s2 ? 'left' : 'right';
                    return (
                      <div key={phase.key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: 'rgba(0,255,136,0.5)', fontSize: '7px', letterSpacing: '0.08em', width: '55px' }}>{phase.icon} {phase.label}</span>
                        <span style={{ color: w === 'left' ? '#00FF88' : 'rgba(255,255,255,0.2)', fontSize: '8px', letterSpacing: '0.02em' }}>{renderHPBar(s1, 100, 10)}</span>
                        <span style={{ color: '#fff', fontSize: '8px', fontWeight: w === 'left' ? 700 : 400, width: '18px', textAlign: 'right' }}>{s1}</span>
                        <span style={{ color: 'rgba(255,51,51,0.3)', fontSize: '7px' }}>│</span>
                        <span style={{ color: '#fff', fontSize: '8px', fontWeight: w === 'right' ? 700 : 400, width: '18px' }}>{s2}</span>
                        <span style={{ color: w === 'right' ? '#00FF88' : 'rgba(255,255,255,0.2)', fontSize: '8px', letterSpacing: '0.02em' }}>{renderHPBar(s2, 100, 10)}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '2px', position: 'relative' }}>
                  <span style={{ color: '#00FF88', fontSize: '7px', letterSpacing: '0.15em' }}>⊕ VERDICT</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '8px', maxWidth: '380px', textAlign: 'right', lineHeight: '1.4' }}>
                    {result.roast.verdict.line.length > 100 ? result.roast.verdict.line.slice(0, 100) + '...' : result.roast.verdict.line}
                  </span>
                </div>
              </div>

              {/* Dossiers */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <AgentDossier user={result.user1} label="AGENT" />
                <div style={{ display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>
                  <div style={{ color: '#FF3333', fontSize: '28px', fontWeight: 700, letterSpacing: '0.15em', textShadow: '0 0 30px rgba(255,51,51,0.3)' }}>VS</div>
                </div>
                <AgentDossier user={result.user2} label="TARGET" />
              </motion.div>

              {/* Comparative Insights */}
              {result.roast.insights && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  style={{ marginBottom: '32px', padding: '20px', background: 'rgba(0,255,136,0.02)', border: '1px solid rgba(0,255,136,0.08)', borderRadius: '4px' }}>
                  <div style={{ color: '#00FF88', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '16px' }}>◈ TACTICAL ANALYSIS</div>
                  {[
                    { label: 'OVERLAP', text: result.roast.insights.topicOverlap },
                    { label: 'EDGE', text: result.roast.insights.strengthContrast },
                    { label: 'VULNERABILITY', text: result.roast.insights.weaknessExploit },
                  ].map((insight) => (
                    <div key={insight.label} style={{ marginBottom: '12px', display: 'flex', gap: '12px' }}>
                      <span style={{ color: 'rgba(0,255,136,0.4)', fontSize: '9px', letterSpacing: '0.1em', width: '90px', flexShrink: 0 }}>{insight.label}</span>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', lineHeight: '1.6' }}>{insight.text}</span>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Phase Breakdown */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ height: '1px', width: '20px', background: 'rgba(0,255,136,0.3)' }} />
                  <span style={{ color: '#00FF88', fontSize: '10px', letterSpacing: '0.15em' }}>PHASE-BY-PHASE INTEL</span>
                  <div style={{ height: '1px', flex: 1, background: 'rgba(0,255,136,0.1)' }} />
                </div>
                {PHASES.map((phase, i) => {
                  const s1 = result.user1.phases[phase.key]; const s2 = result.user2.phases[phase.key];
                  return (
                    <motion.div key={phase.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.15 }}
                      style={{ marginBottom: '12px', padding: '16px', background: 'rgba(0,255,136,0.02)', borderRadius: '4px', border: '1px solid rgba(0,255,136,0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#00FF88', fontSize: '12px' }}>{phase.icon}</span>
                          <span style={{ color: '#00FF88', fontSize: '11px', letterSpacing: '0.12em' }}>{phase.label}</span>
                        </div>
                        <span style={{ color: 'rgba(0,255,136,0.4)', fontSize: '9px', letterSpacing: '0.1em' }}>WON BY {result.roast.phases[phase.key].winner}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', width: '70px' }}>@{result.user1.profile.username.slice(0, 8)}</span>
                        <span style={{ color: s1 >= s2 ? '#00FF88' : 'rgba(255,255,255,0.2)', fontSize: '12px' }}>{renderHPBar(s1, 100, 14)}</span>
                        <span style={{ color: '#fff', fontSize: '13px', fontWeight: s1 >= s2 ? 700 : 400, width: '28px', textAlign: 'right' }}>{s1}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', width: '70px' }}>@{result.user2.profile.username.slice(0, 8)}</span>
                        <span style={{ color: s2 >= s1 ? '#00FF88' : 'rgba(255,255,255,0.2)', fontSize: '12px' }}>{renderHPBar(s2, 100, 14)}</span>
                        <span style={{ color: '#fff', fontSize: '13px', fontWeight: s2 >= s1 ? 700 : 400, width: '28px', textAlign: 'right' }}>{s2}</span>
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontStyle: 'italic', lineHeight: '1.6', borderLeft: '2px solid rgba(0,255,136,0.15)', paddingLeft: '12px' }}>
                        {result.roast.phases[phase.key].line}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Final Verdict */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
                style={{ padding: '24px', background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '4px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ color: '#00FF88', fontSize: '10px', letterSpacing: '0.15em' }}>⊕ FINAL VERDICT</span>
                  <div style={{ height: '1px', flex: 1, background: 'rgba(0,255,136,0.15)' }} />
                  <span style={{ color: '#FFB800', fontSize: '9px', letterSpacing: '0.1em' }}>WINNER: {result.roast.verdict.winner}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.8' }}>{result.roast.verdict.line}</div>
              </motion.div>

              {/* Email Capture — "Beat My Opp" */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
                style={{ padding: '24px', background: 'rgba(255,184,0,0.04)', border: '1px solid rgba(255,184,0,0.15)', borderRadius: '4px', marginBottom: '32px' }}>
                {emailState === 'sent' ? (
                  <div>
                    <div style={{ color: '#FFB800', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '16px' }}>⊕ QUICK WINS — YOUR MISSION ORDERS</div>
                    {quickWins.map((win, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ color: '#00FF88', fontSize: '11px', flexShrink: 0 }}>⊕</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', lineHeight: '1.6' }}>{win}</span>
                      </div>
                    ))}
                    <div style={{ color: 'rgba(0,255,136,0.4)', fontSize: '10px', marginTop: '16px', letterSpacing: '0.1em' }}>
                      ✓ FULL INTEL REPORT SENT TO YOUR INBOX
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ color: '#FFB800', fontSize: '11px', letterSpacing: '0.12em', marginBottom: '8px' }}>
                      🎯 HOW DO I BEAT MY OPP?
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', lineHeight: '1.6', marginBottom: '16px' }}>
                      Get a personalized ops plan — 3 quick wins now + a full tactical report delivered to your inbox.
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="agent@email.com"
                        onKeyDown={(e) => e.key === 'Enter' && handleBeatMyOpp()}
                        style={{ flex: 1, padding: '12px 16px', background: 'rgba(255,184,0,0.04)', border: '1px solid rgba(255,184,0,0.2)', borderRadius: '4px', color: '#fff', fontSize: '13px', fontFamily: MONO, outline: 'none', caretColor: '#FFB800' }} />
                      <button onClick={handleBeatMyOpp} disabled={emailState === 'sending'}
                        style={{ padding: '12px 20px', background: '#FFB800', border: 'none', borderRadius: '4px', color: '#060A0F', fontSize: '10px', letterSpacing: '0.12em', fontFamily: MONO, cursor: 'pointer', fontWeight: 700, opacity: emailState === 'sending' ? 0.5 : 1 }}>
                        {emailState === 'sending' ? 'SENDING...' : 'SEND INTEL'}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Share buttons */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
                style={{ display: 'flex', gap: '10px', marginBottom: '32px', flexWrap: 'wrap' }}>
                <button onClick={shareToX}
                  style={{ flex: 1, minWidth: '140px', padding: '16px', background: '#00FF88', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', letterSpacing: '0.15em', color: '#060A0F', fontFamily: MONO, fontWeight: 700 }}>
                  SHARE ON X
                </button>
                <button onClick={copyLink}
                  style={{ padding: '16px 20px', background: 'transparent', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '4px', cursor: 'pointer', color: '#00FF88', fontSize: '11px', letterSpacing: '0.12em', fontFamily: MONO }}>
                  {copied ? '✓ COPIED' : 'COPY LINK'}
                </button>
                <button onClick={downloadCard}
                  style={{ padding: '16px 20px', background: 'transparent', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '4px', cursor: 'pointer', color: '#00FF88', fontSize: '11px', letterSpacing: '0.12em', fontFamily: MONO }}>
                  DOWNLOAD INTEL
                </button>
              </motion.div>

              {/* Post-results actions */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '40px' }}>
                <button onClick={() => { setState('input'); setInputMode('manual'); setResult(null); setUser2Input(''); setEmailState('idle'); setQuickWins([]); setEmail(''); window.history.replaceState(null, '', '/opp'); }}
                  style={{ flex: 1, minWidth: '140px', padding: '16px', background: 'rgba(255,51,51,0.06)', border: '1px solid rgba(255,51,51,0.2)', borderRadius: '4px', cursor: 'pointer', color: '#FF3333', fontSize: '11px', letterSpacing: '0.12em', fontFamily: MONO }}>
                  ⊕ CHALLENGE A SPECIFIC TARGET
                </button>
                <button onClick={() => { setState('input'); setInputMode('auto'); setResult(null); setUser1Input(''); setUser2Input(''); setEmailState('idle'); setQuickWins([]); setEmail(''); window.history.replaceState(null, '', '/opp'); }}
                  style={{ flex: 1, minWidth: '140px', padding: '16px', background: 'transparent', border: '1px solid rgba(0,255,136,0.1)', borderRadius: '4px', cursor: 'pointer', color: 'rgba(0,255,136,0.5)', fontSize: '11px', letterSpacing: '0.12em', fontFamily: MONO }}>
                  NEW RECON MISSION
                </button>
              </motion.div>

              {/* Full Leaderboard */}
              {leaderboard.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
                  style={{ padding: '20px', background: 'rgba(0,255,136,0.02)', border: '1px solid rgba(0,255,136,0.08)', borderRadius: '4px', marginBottom: '32px' }}>
                  <div style={{ color: '#00FF88', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '16px' }}>🏆 GLOBAL OPP LEADERBOARD — MOST TARGETED</div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', color: 'rgba(0,255,136,0.3)', fontSize: '8px', letterSpacing: '0.1em' }}>
                    <span style={{ width: '24px' }}>#</span>
                    <span style={{ flex: 1 }}>AGENT</span>
                    <span style={{ width: '60px', textAlign: 'right' }}>MATCHUPS</span>
                    <span style={{ width: '50px', textAlign: 'right' }}>WIN %</span>
                    <span style={{ width: '50px', textAlign: 'right' }}>AVG</span>
                  </div>
                  {leaderboard.map((entry, i) => (
                    <div key={entry.username} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 0', borderBottom: i < leaderboard.length - 1 ? '1px solid rgba(0,255,136,0.05)' : 'none' }}>
                      <span style={{ color: i < 3 ? '#FFB800' : 'rgba(255,255,255,0.3)', fontSize: '10px', width: '24px', fontWeight: i < 3 ? 700 : 400 }}>#{i + 1}</span>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', flex: 1 }}>@{entry.username}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', width: '60px', textAlign: 'right' }}>{entry.matchupCount}</span>
                      <span style={{ color: entry.winRate >= 50 ? '#00FF88' : '#FF3333', fontSize: '10px', width: '50px', textAlign: 'right' }}>{entry.winRate}%</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', width: '50px', textAlign: 'right' }}>{entry.avgScore}</span>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Footer */}
              <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(0,255,136,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(0,255,136,0.2)', fontSize: '9px', letterSpacing: '0.1em' }}>POWERED BY AI BRAND INTELLIGENCE</span>
                <span style={{ color: 'rgba(0,255,136,0.2)', fontSize: '9px', letterSpacing: '0.1em' }}>BRANDOS v2.0</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CardDossier({ user, side }: { user: UserResult; side: 'left' | 'right' }) {
  const threat = getThreatLevel(user.score);
  const align = side === 'right' ? 'flex-end' : 'flex-start';
  const textAlign = side === 'right' ? ('right' as const) : ('left' as const);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align, width: '200px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: side === 'right' ? 'row-reverse' : 'row', marginBottom: '4px' }}>
        {user.profile.profile_image_url && (
          <img src={user.profile.profile_image_url} alt={user.profile.username} crossOrigin="anonymous"
            style={{ width: '36px', height: '36px', borderRadius: '4px', border: `1px solid ${threat.color}`, opacity: 0.9 }} />
        )}
        <div style={{ textAlign }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '8px', letterSpacing: '0.08em' }}>@{user.profile.username}</div>
          <div style={{ color: threat.color, fontSize: '24px', fontWeight: 700, lineHeight: '1.1' }}>{user.score}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexDirection: side === 'right' ? 'row-reverse' : 'row' }}>
        <span style={{ color: '#00FF88', fontSize: '7px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{user.archetype}</span>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '7px' }}>│</span>
        <span style={{ color: threat.color, fontSize: '7px', letterSpacing: '0.08em' }}>{threat.label}</span>
      </div>
    </div>
  );
}

function AgentDossier({ user, label }: { user: UserResult; label: string }) {
  const threat = getThreatLevel(user.score);
  return (
    <div style={{ flex: '1 1 240px', minWidth: '240px', padding: '20px', background: 'rgba(0,255,136,0.02)', border: '1px solid rgba(0,255,136,0.1)', borderRadius: '4px' }}>
      <div style={{ color: 'rgba(0,255,136,0.3)', fontSize: '8px', letterSpacing: '0.2em', marginBottom: '16px' }}>{label} DOSSIER</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        {user.profile.profile_image_url && (
          <img src={user.profile.profile_image_url} alt={user.profile.username}
            style={{ width: '52px', height: '52px', borderRadius: '4px', border: `2px solid ${threat.color}` }} />
        )}
        <div>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>{user.profile.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>@{user.profile.username}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
        <span style={{ color: threat.color, fontSize: '40px', fontWeight: 700, lineHeight: '1' }}>{user.score}</span>
        <div>
          <div style={{ color: threat.color, fontSize: '9px', letterSpacing: '0.12em', fontWeight: 600 }}>{threat.label}</div>
          <div style={{ color: '#00FF88', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '2px' }}>{user.archetype}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '16px', paddingTop: '12px', borderTop: '1px solid rgba(0,255,136,0.08)' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '8px', letterSpacing: '0.1em' }}>FOLLOWERS</div>
          <div style={{ color: '#fff', fontSize: '12px' }}>{formatNumber(user.profile.public_metrics.followers_count)}</div>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '8px', letterSpacing: '0.1em' }}>POSTS</div>
          <div style={{ color: '#fff', fontSize: '12px' }}>{formatNumber(user.profile.public_metrics.tweet_count)}</div>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '8px', letterSpacing: '0.1em' }}>LISTED</div>
          <div style={{ color: '#fff', fontSize: '12px' }}>{formatNumber(user.profile.public_metrics.listed_count)}</div>
        </div>
      </div>
    </div>
  );
}
