'use client'

import { InterviewSummary } from '../types'

export default function SummaryView({ summary }: { summary: InterviewSummary }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Headline */}
      <div
        style={{
          background: '#F2F0EF',
          border: '1px solid rgba(0,0,0,0.08)',
          borderLeft: '3px solid #0047FF',
          borderRadius: 4,
          padding: '16px 20px',
        }}
      >
        <div
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.35)',
            marginBottom: 8,
          }}
        >
          Headline
        </div>
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Helvetica', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            color: 'rgba(0,0,0,0.85)',
            lineHeight: 1.5,
          }}
        >
          {summary.headline}
        </div>
      </div>

      {/* Profile Summary */}
      <div
        style={{
          background: '#F2F0EF',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 4,
          padding: '16px 20px',
        }}
      >
        <div
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.35)',
            marginBottom: 8,
          }}
        >
          Profile Summary
        </div>
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Helvetica', sans-serif",
            fontSize: 14,
            color: 'rgba(0,0,0,0.5)',
            lineHeight: 1.7,
          }}
        >
          {summary.profileSummary}
        </div>
      </div>

      {/* Pain Points */}
      <BulletList
        label="Pain Points"
        items={summary.painPoints}
        prefix="[!]"
        prefixColor="#EF4444"
      />

      {/* BrandOS Signals */}
      <BulletList
        label="BrandOS Signals"
        items={summary.brandOSSignals}
        prefix="[>]"
        prefixColor="#0047FF"
      />

      {/* Key Insights */}
      <BulletList
        label="Key Insights"
        items={summary.keyInsights}
        prefix="[*]"
        prefixColor="#10B981"
      />

      {/* Follow-up */}
      <div
        style={{
          background: 'rgba(0,71,255,0.04)',
          border: '1px solid rgba(0,71,255,0.15)',
          borderRadius: 4,
          padding: '16px 20px',
        }}
      >
        <div
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.35)',
            marginBottom: 8,
          }}
        >
          Recommended Follow-up
        </div>
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Helvetica', sans-serif",
            fontSize: 14,
            color: 'rgba(0,0,0,0.5)',
            lineHeight: 1.7,
          }}
        >
          {summary.followUp}
        </div>
      </div>
    </div>
  )
}

function BulletList({
  label,
  items,
  prefix,
  prefixColor,
}: {
  label: string
  items: string[]
  prefix: string
  prefixColor: string
}) {
  return (
    <div
      style={{
        background: '#F2F0EF',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 4,
        padding: '16px 20px',
      }}
    >
      <div
        style={{
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(0,0,0,0.35)',
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              fontFamily: "'Helvetica Neue', 'Helvetica', sans-serif",
              fontSize: 14,
              color: 'rgba(0,0,0,0.5)',
              lineHeight: 1.6,
            }}
          >
            <span
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: 12,
                color: prefixColor,
                flexShrink: 0,
                marginTop: 1,
                fontWeight: 700,
              }}
            >
              {prefix}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
