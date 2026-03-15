'use client'

import { useState, useMemo } from 'react'
import { Interview, SignalValue, T1Signals, ProfileType, TrackKey } from '../types'
import { T1_QUESTIONS, getQuestionsForProfile } from '../lib/data'
import { classifyProfile } from '../lib/classify'
import ProfileBanner from './ProfileBanner'
import TrackSection from './TrackSection'

const colorMap = {
  blue:  { bg: 'rgba(0,71,255,0.08)',    text: '#0047FF',  border: 'rgba(0,71,255,0.15)' },
  green: { bg: 'rgba(16,185,129,0.08)',   text: '#10B981',  border: 'rgba(16,185,129,0.15)' },
  amber: { bg: 'rgba(245,158,11,0.08)',   text: '#F59E0B',  border: 'rgba(245,158,11,0.15)' },
  red:   { bg: 'rgba(239,68,68,0.08)',    text: '#EF4444',  border: 'rgba(239,68,68,0.15)' },
}

const TIERS = ['5k\u201325k followers', '25k\u2013100k followers', '100k+ followers'] as const

interface Props {
  draft: Partial<Interview> | null
  setDraft: (d: Partial<Interview> | null) => void
  onSave: (iv: Interview) => void
  onCancel: () => void
}

export default function NewInterview({ draft, setDraft, onSave, onCancel }: Props) {
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState(draft?.username || '')
  const [tier, setTier] = useState(draft?.tier || '')
  const [signals, setSignals] = useState<T1Signals>(draft?.signals || {})
  const [responses, setResponses] = useState<Record<string, string>>(draft?.responses || {})

  const profile = useMemo(() => {
    const { t1q1, t1q2, t1q3 } = signals
    if (t1q1 && t1q2 && t1q3) return classifyProfile(signals as Required<T1Signals>)
    return null
  }, [signals])

  const adaptiveQuestions = useMemo(() => {
    if (!profile) return []
    return getQuestionsForProfile(profile)
  }, [profile])

  const trackGroups = useMemo(() => {
    const groups: Record<string, typeof adaptiveQuestions> = {}
    for (const q of adaptiveQuestions) {
      if (!groups[q.track]) groups[q.track] = []
      groups[q.track].push(q)
    }
    return groups
  }, [adaptiveQuestions])

  const answerCount = Object.values(responses).filter((v) => v.trim()).length

  const canContinue = () => {
    if (step === 1) return username.trim() && tier
    if (step === 2) return signals.t1q1 && signals.t1q2 && signals.t1q3
    if (step === 3) return true
    return true
  }

  const handleSave = (status: 'draft' | 'complete') => {
    const iv: Interview = {
      id: crypto.randomUUID(),
      username: username.replace(/^@/, '').trim(),
      tier,
      date: new Date().toISOString(),
      signals,
      profile,
      responses,
      summary: null,
      status: status,
    }
    onSave(iv)
  }

  const buildDraft = (): Partial<Interview> => ({
    username: username.replace(/^@/, '').trim(),
    tier,
    signals,
    profile,
    responses,
    status: 'draft',
  })

  const mono: React.CSSProperties = {
    fontFamily: "'VCR OSD Mono', monospace",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  }

  const body: React.CSSProperties = {
    fontFamily: "'Helvetica Neue', 'Helvetica', sans-serif",
  }

  return (
    <div>
      {/* Progress dots */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          marginBottom: 32,
        }}
      >
        {[1, 2, 3, 4].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: s < step ? '#0047FF' : s === step ? 'transparent' : 'transparent',
                border: s <= step ? '2px solid #0047FF' : '2px solid rgba(0,0,0,0.15)',
                transition: 'all 0.2s',
              }}
            />
            {i < 3 && (
              <div
                style={{
                  width: 32,
                  height: 2,
                  background: s < step ? '#0047FF' : 'rgba(0,0,0,0.15)',
                  transition: 'background 0.2s',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — Setup */}
      {step === 1 && (
        <div>
          <div style={{ ...mono, color: 'rgba(0,0,0,0.35)', marginBottom: 20 }}>{'/* STEP 1 \u2014 SETUP */'}</div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ ...mono, color: 'rgba(0,0,0,0.35)', display: 'block', marginBottom: 8 }}>
              X Handle
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
              placeholder="username"
              style={{
                width: '100%',
                background: '#F2F0EF',
                border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: 4,
                padding: '12px 14px',
                color: 'rgba(0,0,0,0.85)',
                ...body,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,71,255,0.5)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,71,255,0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          <div>
            <label style={{ ...mono, color: 'rgba(0,0,0,0.35)', display: 'block', marginBottom: 10 }}>
              Tier
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TIERS.map((t) => {
                const active = tier === t
                return (
                  <button
                    key={t}
                    onClick={() => setTier(t)}
                    style={{
                      ...body,
                      fontSize: 13,
                      fontWeight: 500,
                      color: active ? '#fff' : 'rgba(0,0,0,0.5)',
                      background: active ? '#0047FF' : 'transparent',
                      border: `1px solid ${active ? '#0047FF' : 'rgba(0,0,0,0.15)'}`,
                      borderRadius: 4,
                      padding: '8px 18px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Diagnostic */}
      {step === 2 && (
        <div>
          <div style={{ ...mono, color: 'rgba(0,0,0,0.35)', marginBottom: 20 }}>{'/* STEP 2 \u2014 DIAGNOSTIC */'}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {T1_QUESTIONS.map((q) => {
              const key = q.id as keyof T1Signals
              const selected = signals[key]

              return (
                <div
                  key={q.id}
                  style={{
                    background: '#F2F0EF',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 4,
                    padding: '16px 20px',
                  }}
                >
                  <div
                    style={{
                      ...body,
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'rgba(0,0,0,0.85)',
                      marginBottom: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    {q.text}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['a', 'b', 'c'] as SignalValue[]).map((v) => {
                      const active = selected === v
                      return (
                        <button
                          key={v}
                          onClick={() =>
                            setSignals((s) => ({ ...s, [key]: v }))
                          }
                          style={{
                            ...mono,
                            fontSize: 13,
                            color: active ? '#fff' : 'rgba(0,0,0,0.5)',
                            background: active ? '#0047FF' : 'transparent',
                            border: `1px solid ${active ? '#0047FF' : 'rgba(0,0,0,0.15)'}`,
                            borderRadius: 4,
                            padding: '8px 20px',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            textTransform: 'uppercase',
                          }}
                        >
                          {v}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 3 — Adaptive */}
      {step === 3 && profile && (
        <div>
          <div style={{ ...mono, color: 'rgba(0,0,0,0.35)', marginBottom: 16 }}>{'/* STEP 3 \u2014 ADAPTIVE QUESTIONS */'}</div>
          <div style={{ marginBottom: 24 }}>
            <ProfileBanner profile={profile} />
          </div>

          {(Object.keys(trackGroups) as TrackKey[]).map((tk) => (
            <TrackSection
              key={tk}
              track={tk}
              questions={trackGroups[tk]}
              responses={responses}
              onChange={(id, val) =>
                setResponses((r) => ({ ...r, [id]: val }))
              }
            />
          ))}
        </div>
      )}

      {/* Step 4 — Review */}
      {step === 4 && (
        <div>
          <div style={{ ...mono, color: 'rgba(0,0,0,0.35)', marginBottom: 20 }}>{'/* STEP 4 \u2014 REVIEW */'}</div>

          <div
            style={{
              background: '#F2F0EF',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 4,
              padding: '24px 28px',
            }}
          >
            <Row label="Username" value={`@${username}`} />
            <Row label="Tier" value={tier} />
            <Row label="Profile" value={profile || '\u2014'} />
            <Row label="Answers" value={`${answerCount} responses`} last />
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 32,
          paddingTop: 20,
          borderTop: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={step === 1 ? onCancel : () => setStep(step - 1)}
            style={{
              ...body,
              fontSize: 14,
              fontWeight: 500,
              color: 'rgba(0,0,0,0.5)',
              background: 'transparent',
              border: '1px solid rgba(0,0,0,0.15)',
              borderRadius: 4,
              padding: '8px 20px',
              cursor: 'pointer',
            }}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {(step === 2 || step === 3) && (
            <button
              onClick={() => {
                setDraft(buildDraft())
                handleSave('draft')
              }}
              style={{
                ...body,
                fontSize: 14,
                fontWeight: 500,
                color: '#F59E0B',
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.15)',
                borderRadius: 4,
                padding: '8px 20px',
                cursor: 'pointer',
              }}
            >
              Save Draft
            </button>
          )}
        </div>

        <button
          onClick={() => {
            if (step < 4) setStep(step + 1)
            else handleSave('complete')
          }}
          disabled={!canContinue()}
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#fff',
            background: canContinue() ? '#0047FF' : 'rgba(0,0,0,0.15)',
            border: 'none',
            borderRadius: 4,
            padding: '8px 24px',
            cursor: canContinue() ? 'pointer' : 'not-allowed',
            opacity: canContinue() ? 1 : 0.5,
            boxShadow: canContinue() ? '0 4px 24px rgba(0,71,255,0.3)' : 'none',
          }}
        >
          {step === 4 ? 'Save' : 'Continue'}
        </button>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  last,
}: {
  label: string
  value: string | null
  last?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: last ? 'none' : '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <span
        style={{
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(0,0,0,0.35)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Helvetica Neue', 'Helvetica', sans-serif",
          fontSize: 14,
          fontWeight: 500,
          color: 'rgba(0,0,0,0.85)',
        }}
      >
        {value}
      </span>
    </div>
  )
}
