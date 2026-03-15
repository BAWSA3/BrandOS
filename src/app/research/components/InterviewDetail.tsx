'use client'

import { useState, useMemo } from 'react'
import { Interview, ProfileType, TrackKey } from '../types'
import { TRACK_META, getQuestionsForProfile } from '../lib/data'
import { exportInterviewText } from '../lib/export'
import { generateSummary } from '../lib/api'
import TrackSection from './TrackSection'
import SummaryView from './SummaryView'

const colorMap = {
  blue:  { bg: 'rgba(0,71,255,0.08)',    text: '#0047FF',  border: 'rgba(0,71,255,0.15)' },
  green: { bg: 'rgba(16,185,129,0.08)',   text: '#10B981',  border: 'rgba(16,185,129,0.15)' },
  amber: { bg: 'rgba(245,158,11,0.08)',   text: '#F59E0B',  border: 'rgba(245,158,11,0.15)' },
  red:   { bg: 'rgba(239,68,68,0.08)',    text: '#EF4444',  border: 'rgba(239,68,68,0.15)' },
}

const profileColor: Record<ProfileType, keyof typeof colorMap> = {
  intuitive: 'blue',
  grinder: 'amber',
  builder: 'green',
}

interface Props {
  iv: Interview
  onBack: () => void
  onUpdate: (iv: Interview) => void
  onDelete: (id: string) => void
  apiKey: string
  onNeedKey: () => void
}

export default function InterviewDetail({
  iv,
  onBack,
  onUpdate,
  onDelete,
  apiKey,
  onNeedKey,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const pc = iv.profile ? colorMap[profileColor[iv.profile]] : null
  const statusColor = iv.status === 'complete' ? colorMap.green : colorMap.amber

  const questions = useMemo(() => {
    if (!iv.profile) return []
    return getQuestionsForProfile(iv.profile)
  }, [iv.profile])

  const trackGroups = useMemo(() => {
    const groups: Record<string, typeof questions> = {}
    for (const q of questions) {
      if (!groups[q.track]) groups[q.track] = []
      groups[q.track].push(q)
    }
    return groups
  }, [questions])

  const handleGenerate = async () => {
    if (!apiKey) {
      onNeedKey()
      return
    }
    setLoading(true)
    setError(null)
    try {
      const summary = await generateSummary(iv, apiKey)
      onUpdate({ ...iv, summary })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    exportInterviewText(iv)
  }

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
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
          paddingBottom: 20,
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: '1px solid rgba(0,0,0,0.15)',
            borderRadius: 4,
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: 'rgba(0,0,0,0.35)',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(0,0,0,0.65)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(0,0,0,0.35)')}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div
          style={{
            ...body,
            fontSize: 18,
            fontWeight: 600,
            color: 'rgba(0,0,0,0.85)',
          }}
        >
          @{iv.username}
        </div>

        {iv.profile && pc && (
          <span
            style={{
              ...mono,
              fontSize: 10,
              color: pc.text,
              background: pc.bg,
              border: `1px solid ${pc.border}`,
              borderRadius: 4,
              padding: '3px 8px',
            }}
          >
            {iv.profile}
          </span>
        )}

        <span
          style={{
            ...mono,
            fontSize: 10,
            color: statusColor.text,
            background: statusColor.bg,
            border: `1px solid ${statusColor.border}`,
            borderRadius: 4,
            padding: '3px 8px',
          }}
        >
          {iv.status}
        </span>

        <span style={{ ...body, fontSize: 13, color: 'rgba(0,0,0,0.5)' }}>
          {iv.tier} &middot; {new Date(iv.date).toLocaleDateString()}
        </span>
      </div>

      {/* Export panel */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 28,
        }}
      >
        <button
          onClick={handleExport}
          style={{
            ...body,
            fontSize: 13,
            fontWeight: 500,
            color: 'rgba(0,0,0,0.5)',
            background: 'transparent',
            border: '1px solid rgba(0,0,0,0.15)',
            borderRadius: 4,
            padding: '8px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.25)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)')}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Download .txt
        </button>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
        }}
      >
        {/* Left — Responses */}
        <div>
          <div style={{ ...mono, color: 'rgba(0,0,0,0.35)', marginBottom: 16 }}>// RESPONSES</div>
          {(Object.keys(trackGroups) as TrackKey[]).map((tk) => (
            <TrackSection
              key={tk}
              track={tk}
              questions={trackGroups[tk]}
              responses={iv.responses}
              readOnly
            />
          ))}
          {Object.keys(trackGroups).length === 0 && (
            <div style={{ ...body, fontSize: 14, color: 'rgba(0,0,0,0.5)', fontStyle: 'italic' }}>
              No adaptive questions recorded.
            </div>
          )}
        </div>

        {/* Right — AI Summary */}
        <div>
          <div style={{ ...mono, color: 'rgba(0,0,0,0.35)', marginBottom: 16 }}>// AI_SUMMARY</div>

          {error && (
            <div
              style={{
                background: colorMap.red.bg,
                border: `1px solid ${colorMap.red.border}`,
                borderRadius: 4,
                padding: '12px 16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontFamily: "'VCR OSD Mono', monospace", fontSize: 11, color: colorMap.red.text }}>
                {error}
              </span>
              <button
                onClick={handleGenerate}
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: colorMap.red.text,
                  background: 'transparent',
                  border: `1px solid ${colorMap.red.border}`,
                  borderRadius: 4,
                  padding: '4px 12px',
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          )}

          {loading && (
            <div
              style={{
                background: '#F2F0EF',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 4,
                padding: '32px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: 12,
                  color: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  letterSpacing: '0.1em',
                }}
              >
                {'[\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591] ANALYZING...'}
              </div>
            </div>
          )}

          {!loading && !iv.summary && !error && (
            <div
              style={{
                background: '#F2F0EF',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 4,
                padding: '40px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  ...body,
                  fontSize: 14,
                  color: 'rgba(0,0,0,0.5)',
                  marginBottom: 16,
                }}
              >
                No summary generated yet. Use AI to analyze this interview.
              </div>
              <button
                onClick={handleGenerate}
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#fff',
                  background: '#0047FF',
                  border: 'none',
                  borderRadius: 4,
                  padding: '10px 24px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 24px rgba(0,71,255,0.3)',
                }}
              >
                Generate Summary
              </button>
            </div>
          )}

          {!loading && iv.summary && (
            <div>
              <SummaryView summary={iv.summary} />
              <div style={{ marginTop: 16 }}>
                <button
                  onClick={handleGenerate}
                  style={{
                    ...body,
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'rgba(0,0,0,0.5)',
                    background: 'transparent',
                    border: '1px solid rgba(0,0,0,0.15)',
                    borderRadius: 4,
                    padding: '8px 16px',
                    cursor: 'pointer',
                  }}
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete */}
      <div
        style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              ...body,
              fontSize: 13,
              fontWeight: 500,
              color: 'rgba(0,0,0,0.5)',
              background: 'transparent',
              border: '1px solid rgba(0,0,0,0.15)',
              borderRadius: 4,
              padding: '8px 18px',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#EF4444'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(0,0,0,0.5)'
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'
            }}
          >
            Delete Interview
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ ...body, fontSize: 13, color: '#EF4444' }}>
              Are you sure?
            </span>
            <button
              onClick={() => onDelete(iv.id)}
              style={{
                ...body,
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                background: '#EF4444',
                border: 'none',
                borderRadius: 4,
                padding: '8px 18px',
                cursor: 'pointer',
              }}
            >
              Confirm Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{
                ...body,
                fontSize: 13,
                color: 'rgba(0,0,0,0.5)',
                background: 'transparent',
                border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: 4,
                padding: '8px 18px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Responsive styles for mobile stacking */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
