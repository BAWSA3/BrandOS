'use client';

import { useRef, useCallback } from 'react';
import { TrackKey, Question } from '../types';
import { TRACK_META } from '../lib/data';

const colorMap = {
  blue: { bg: 'rgba(0,71,255,0.08)', text: '#0047FF', border: 'rgba(0,71,255,0.15)' },
  green: { bg: 'rgba(16,185,129,0.08)', text: '#10B981', border: 'rgba(16,185,129,0.15)' },
  amber: { bg: 'rgba(245,158,11,0.08)', text: '#F59E0B', border: 'rgba(245,158,11,0.15)' },
  red: { bg: 'rgba(239,68,68,0.08)', text: '#EF4444', border: 'rgba(239,68,68,0.15)' },
};

const trackColor: Record<TrackKey, keyof typeof colorMap> = {
  t2: 'blue',
  t3: 'green',
  t4: 'amber',
  t5: 'red',
};

interface Props {
  track: TrackKey;
  questions: Question[];
  responses: Record<string, string>;
  onChange?: (id: string, value: string) => void;
  readOnly?: boolean;
}

function AutoTextarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      if (ref.current) {
        ref.current.style.height = 'auto';
        ref.current.style.height = ref.current.scrollHeight + 'px';
      }
    },
    [onChange]
  );

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={handleChange}
      rows={3}
      style={{
        width: '100%',
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.15)',
        borderRadius: 4,
        padding: '12px 14px',
        color: 'rgba(0,0,0,0.85)',
        fontFamily: "'Helvetica Neue', 'Helvetica', sans-serif",
        fontSize: 14,
        lineHeight: 1.6,
        resize: 'none',
        outline: 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxSizing: 'border-box',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'rgba(0,71,255,0.5)';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,71,255,0.1)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    />
  );
}

export default function TrackSection({
  track,
  questions,
  responses,
  onChange,
  readOnly = false,
}: Props) {
  const meta = TRACK_META[track];
  const c = colorMap[trackColor[track]];

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Track header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: c.text,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.35)',
          }}
        >
          {'/* \u2500\u2500 TRACK: '}
          {meta.label.toUpperCase()}
          {' \u2500\u2500 */'}
        </span>
      </div>

      {/* Question cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {questions.map((q) => (
          <div
            key={q.id}
            style={{
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 4,
              padding: '16px 20px',
            }}
          >
            <div
              style={{
                fontFamily: "'Helvetica Neue', 'Helvetica', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                color: 'rgba(0,0,0,0.85)',
                marginBottom: 10,
                lineHeight: 1.5,
              }}
            >
              {q.text}
            </div>

            {readOnly ? (
              <div
                style={{
                  fontFamily: "'Helvetica Neue', 'Helvetica', sans-serif",
                  fontSize: 14,
                  color: responses[q.id] ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.35)',
                  lineHeight: 1.6,
                  fontStyle: responses[q.id] ? 'normal' : 'italic',
                }}
              >
                {responses[q.id] || 'No response recorded'}
              </div>
            ) : (
              <AutoTextarea value={responses[q.id] || ''} onChange={(v) => onChange?.(q.id, v)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
