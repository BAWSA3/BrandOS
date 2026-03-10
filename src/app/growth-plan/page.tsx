'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GrowthPlanWalkthrough from '@/components/GrowthPlan';
import type { GrowthPlanData } from '@/components/GrowthPlan/types';

type PageState = 'setup' | 'loading' | 'walkthrough' | 'complete';

export default function GrowthPlanPage() {
  const [state, setState] = useState<PageState>('setup');
  const [plan, setPlan] = useState<GrowthPlanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [currentFollowers, setCurrentFollowers] = useState('');
  const [targetFollowers, setTargetFollowers] = useState('');
  const [deadlineMonths, setDeadlineMonths] = useState('4');

  // Auto-detect brand on mount
  useEffect(() => {
    async function detectBrand() {
      try {
        const res = await fetch('/api/brands/me');
        if (res.ok) {
          const data = await res.json();
          if (data.brand?.id) {
            setBrandId(data.brand.id);
          }
        }
      } catch {
        // Silent fail — user can enter manually
      }
    }
    detectBrand();
  }, []);

  async function generatePlan() {
    if (!brandId) {
      setError('No brand found. Please run a Brand DNA analysis first.');
      return;
    }

    setState('loading');
    setError(null);

    try {
      const res = await fetch('/api/growth-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          currentFollowers: currentFollowers ? parseInt(currentFollowers) : undefined,
          targetFollowers: targetFollowers ? parseInt(targetFollowers) : undefined,
          deadlineMonths: parseInt(deadlineMonths),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate plan');
      }

      const { plan: generatedPlan } = await res.json();
      setPlan(generatedPlan);
      setState('walkthrough');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setState('setup');
    }
  }

  // Setup screen
  if (state === 'setup') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}
        >
          {/* Terminal header */}
          <div style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.12em',
            color: 'rgba(0,0,0,0.3)',
            marginBottom: '32px',
          }}>
            /* BRANDOS GROWTH PLAN */
          </div>

          <h1 style={{
            fontFamily: "'Helvetica Neue', sans-serif",
            fontSize: '32px',
            fontWeight: 600,
            color: '#000',
            margin: '0 0 12px 0',
          }}>
            Growth Plan Generator
          </h1>

          <p style={{
            fontFamily: "'Helvetica Neue', sans-serif",
            fontSize: '14px',
            color: 'rgba(0,0,0,0.5)',
            lineHeight: 1.6,
            marginBottom: '40px',
          }}>
            Data-driven growth plan built from your content intelligence system. Every recommendation is based on your real numbers.
          </p>

          {/* Input fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px', textAlign: 'left' }}>
            <div>
              <label style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.1em',
                color: 'rgba(0,0,0,0.4)',
                display: 'block',
                marginBottom: '8px',
              }}>CURRENT FOLLOWERS</label>
              <input
                type="number"
                value={currentFollowers}
                onChange={(e) => {
                  setCurrentFollowers(e.target.value);
                  if (e.target.value && !targetFollowers) {
                    setTargetFollowers(Math.round(parseInt(e.target.value) * 1.5).toString());
                  }
                }}
                placeholder="e.g. 33000"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '6px',
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontSize: '16px',
                  color: '#000',
                  background: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.1em',
                color: 'rgba(0,0,0,0.4)',
                display: 'block',
                marginBottom: '8px',
              }}>TARGET FOLLOWERS</label>
              <input
                type="number"
                value={targetFollowers}
                onChange={(e) => setTargetFollowers(e.target.value)}
                placeholder="e.g. 50000"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '6px',
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontSize: '16px',
                  color: '#000',
                  background: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.1em',
                color: 'rgba(0,0,0,0.4)',
                display: 'block',
                marginBottom: '8px',
              }}>TIMELINE (MONTHS)</label>
              <select
                value={deadlineMonths}
                onChange={(e) => setDeadlineMonths(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '6px',
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontSize: '16px',
                  color: '#000',
                  background: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="2">2 months (aggressive)</option>
                <option value="3">3 months</option>
                <option value="4">4 months (recommended)</option>
                <option value="6">6 months (steady)</option>
                <option value="12">12 months (long game)</option>
              </select>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: '6px',
              marginBottom: '16px',
              fontFamily: "'Helvetica Neue', sans-serif",
              fontSize: '13px',
              color: '#EF4444',
            }}>
              {error}
            </div>
          )}

          <button
            onClick={generatePlan}
            disabled={!brandId}
            style={{
              width: '100%',
              padding: '18px 32px',
              background: brandId ? '#0047FF' : 'rgba(0,0,0,0.1)',
              border: 'none',
              borderRadius: '6px',
              cursor: brandId ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => brandId && (e.currentTarget.style.background = '#0038CC')}
            onMouseLeave={(e) => brandId && (e.currentTarget.style.background = '#0047FF')}
          >
            <span style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '12px',
              letterSpacing: '0.12em',
              color: brandId ? '#fff' : 'rgba(0,0,0,0.3)',
            }}>
              {brandId ? 'GENERATE MY GROWTH PLAN' : 'RUN BRAND DNA FIRST'}
            </span>
          </button>

          {!brandId && (
            <p style={{
              fontFamily: "'Helvetica Neue', sans-serif",
              fontSize: '12px',
              color: 'rgba(0,0,0,0.4)',
              marginTop: '12px',
            }}>
              You need a Brand DNA analysis before generating a growth plan.
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  // Loading screen
  if (state === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.12em',
            color: 'rgba(0,0,0,0.4)',
            marginBottom: '24px',
          }}>
            ANALYZING YOUR DATA...
          </div>

          {/* Loading bar */}
          <div style={{
            width: '200px',
            height: '4px',
            background: 'rgba(0,0,0,0.05)',
            borderRadius: '2px',
            overflow: 'hidden',
            margin: '0 auto 24px',
          }}>
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: '50%',
                height: '100%',
                background: '#0047FF',
                borderRadius: '2px',
              }}
            />
          </div>

          <LoadingSteps />
        </motion.div>
      </div>
    );
  }

  // Walkthrough
  if (state === 'walkthrough' && plan) {
    return (
      <GrowthPlanWalkthrough
        plan={plan}
        onComplete={() => setState('complete')}
      />
    );
  }

  // Complete
  if (state === 'complete' && plan) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ maxWidth: '440px' }}
        >
          <div style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '32px',
            color: '#0047FF',
            marginBottom: '16px',
          }}>
            {plan.currentFollowers.toLocaleString()} → {plan.targetFollowers.toLocaleString()}
          </div>
          <p style={{
            fontFamily: "'Helvetica Neue', sans-serif",
            fontSize: '16px',
            color: 'rgba(0,0,0,0.6)',
            lineHeight: 1.6,
            marginBottom: '32px',
          }}>
            Your growth plan is ready. The intelligence system will track your progress automatically.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setState('walkthrough');
                window.scrollTo({ top: 0 });
              }}
              style={{
                padding: '14px 28px',
                background: 'transparent',
                border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <span style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: 'rgba(0,0,0,0.6)',
              }}>REVIEW PLAN</span>
            </button>
            <button
              onClick={() => window.location.href = '/app'}
              style={{
                padding: '14px 28px',
                background: '#0047FF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <span style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: '#fff',
              }}>GO TO DASHBOARD</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}

function LoadingSteps() {
  const [step, setStep] = useState(0);
  const steps = [
    'scanning performance snapshots...',
    'analyzing gap dimensions...',
    'comparing against viral benchmarks...',
    'identifying growth levers...',
    'building execution plan...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2000);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
      {steps.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: i <= step ? 1 : 0.2 }}
          transition={{ duration: 0.3 }}
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.05em',
            color: i < step ? '#10B981' : i === step ? '#0047FF' : 'rgba(0,0,0,0.2)',
          }}
        >
          {i < step ? '[✓]' : i === step ? '[>]' : '[ ]'} {s}
        </motion.div>
      ))}
    </div>
  );
}
