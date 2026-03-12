'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface BreakdownTeaserProps {
  brandScore: number;
  archetype: string;
  strengths: string[];
  improvements: string[];
}

type TeaserPhase = 'idle' | 'erasing' | 'typing-email' | 'email-input' | 'submitting' | 'erasing-confirm' | 'typing-confirm' | 'done';

function useTypewriter(text: string, speed: number = 40, active: boolean = false) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) { setDisplayed(''); setDone(false); return; }
    let i = 0;
    setDisplayed('');
    setDone(false);
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setDone(true); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, active]);

  return { displayed, done };
}

function useBackspace(text: string, speed: number = 25, active: boolean = false) {
  const [displayed, setDisplayed] = useState(text);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) { setDisplayed(text); setDone(false); return; }
    let len = text.length;
    setDisplayed(text);
    setDone(false);
    const interval = setInterval(() => {
      len--;
      setDisplayed(text.slice(0, len));
      if (len <= 0) { clearInterval(interval); setDone(true); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, active]);

  return { displayed, done };
}

export default function BreakdownTeaser({ brandScore, archetype, strengths, improvements }: BreakdownTeaserProps) {
  const [phase, setPhase] = useState<TeaserPhase>('idle');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const buttonText = 'View your brand breakdown';

  // Phase: erasing the button text
  const erase1 = useBackspace(buttonText, 20, phase === 'erasing');
  useEffect(() => { if (erase1.done && phase === 'erasing') setPhase('typing-email'); }, [erase1.done, phase]);

  // Phase: typing "enter your email"
  const typeEmail = useTypewriter('enter your email', 40, phase === 'typing-email');
  useEffect(() => {
    if (typeEmail.done && phase === 'typing-email') {
      setPhase('email-input');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [typeEmail.done, phase]);

  // Phase: erasing before confirm
  const erase2 = useBackspace('enter your email', 20, phase === 'erasing-confirm');
  useEffect(() => { if (erase2.done && phase === 'erasing-confirm') setPhase('typing-confirm'); }, [erase2.done, phase]);

  // Phase: typing confirm message
  const typeConfirm = useTypewriter('got it. check your inbox', 40, phase === 'typing-confirm');
  useEffect(() => { if (typeConfirm.done && phase === 'typing-confirm') setPhase('done'); }, [typeConfirm.done, phase]);

  const handleClick = () => {
    if (phase === 'idle') setPhase('erasing');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setPhase('submitting');
    setError(null);

    try {
      const res = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'breakdown-teaser' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setPhase('erasing-confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setPhase('email-input');
    }
  };

  // Determine what text to show
  let displayText = '';
  let showInput = false;
  let showCursor = true;

  switch (phase) {
    case 'idle':
      displayText = buttonText;
      showCursor = false;
      break;
    case 'erasing':
      displayText = erase1.displayed;
      break;
    case 'typing-email':
      displayText = typeEmail.displayed;
      break;
    case 'email-input':
      displayText = 'enter your email';
      showInput = true;
      showCursor = false;
      break;
    case 'submitting':
      displayText = 'enter your email';
      showInput = true;
      showCursor = false;
      break;
    case 'erasing-confirm':
      displayText = erase2.displayed;
      break;
    case 'typing-confirm':
      displayText = typeConfirm.displayed;
      break;
    case 'done':
      displayText = 'got it. check your inbox';
      showCursor = false;
      break;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      style={{
        width: '100%',
        maxWidth: '600px',
        marginTop: '60px',
        textAlign: 'center',
      }}
    >
      {/* Blurred preview of breakdown data */}
      <div style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '24px',
      }}>
        <div style={{
          padding: '32px 24px',
          background: 'rgba(255,255,255,0.03)',
          filter: 'blur(6px)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {/* Fake breakdown preview content */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <div style={{ fontFamily: "'VCR OSD Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: '4px' }}>ARCHETYPE</div>
              <div style={{ fontFamily: "'VCR OSD Mono', monospace", fontSize: '16px', color: '#fff' }}>{archetype}</div>
            </div>
            <div>
              <div style={{ fontFamily: "'VCR OSD Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: '4px' }}>BRAND SCORE</div>
              <div style={{ fontFamily: "'VCR OSD Mono', monospace", fontSize: '16px', color: '#0047FF' }}>{brandScore}/100</div>
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontFamily: "'VCR OSD Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: '8px' }}>STRENGTHS</div>
            {strengths.slice(0, 3).map((s, i) => (
              <div key={i} style={{ fontFamily: "'VCR OSD Mono', monospace", fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>{s}</div>
            ))}
          </div>
          <div>
            <div style={{ fontFamily: "'VCR OSD Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: '8px' }}>AREAS TO IMPROVE</div>
            {improvements.slice(0, 3).map((s, i) => (
              <div key={i} style={{ fontFamily: "'VCR OSD Mono', monospace", fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>{s}</div>
            ))}
          </div>
        </div>

        {/* Overlay gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(transparent 0%, rgba(5,5,5,0.8) 100%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Typewriter CTA area */}
      <div style={{ minHeight: '100px' }}>
        {/* The animated text line */}
        <div style={{
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '14px',
          letterSpacing: '0.1em',
          color: phase === 'idle' ? '#0047FF' : phase === 'done' ? '#10B981' : 'rgba(255,255,255,0.7)',
          cursor: phase === 'idle' ? 'pointer' : 'default',
          marginBottom: '16px',
          transition: 'color 0.3s ease',
        }}
          onClick={handleClick}
        >
          {displayText}
          {showCursor && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
              style={{ marginLeft: '2px' }}
            >
              _
            </motion.span>
          )}
        </div>

        {/* Email input — slides in when ready */}
        {showInput && (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            style={{ display: 'flex', gap: '8px', justifyContent: 'center', maxWidth: '360px', margin: '0 auto' }}
          >
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={phase === 'submitting'}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#fff',
                fontFamily: "'VCR OSD Mono', monospace",
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={phase === 'submitting' || !email.trim()}
              style={{
                padding: '12px 20px',
                background: '#0047FF',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '12px',
                letterSpacing: '0.1em',
                cursor: phase === 'submitting' ? 'wait' : 'pointer',
                opacity: phase === 'submitting' ? 0.7 : 1,
              }}
            >
              {phase === 'submitting' ? '...' : '→'}
            </button>
          </motion.form>
        )}

        {error && (
          <div style={{
            marginTop: '8px',
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '11px',
            color: '#EF4444',
          }}>
            {error}
          </div>
        )}
      </div>
    </motion.div>
  );
}
