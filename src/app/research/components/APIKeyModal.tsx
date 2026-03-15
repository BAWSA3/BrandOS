'use client'

import { useState } from 'react'

interface Props {
  onSave: (key: string) => void
  onClose: () => void
  currentKey?: string
}

export default function APIKeyModal({ onSave, onClose, currentKey }: Props) {
  const [key, setKey] = useState(currentKey || '')

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#F2F0EF',
          border: '1px solid rgba(0,0,0,0.15)',
          borderRadius: 4,
          padding: 32,
          width: '100%',
          maxWidth: 460,
          margin: '0 16px',
          boxShadow: '0 4px 40px rgba(0,0,0,0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.85)',
            marginBottom: 6,
          }}
        >
          ANTHROPIC API KEY
        </div>
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Helvetica', sans-serif",
            fontSize: 13,
            color: 'rgba(0,0,0,0.5)',
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          Required to generate AI interview summaries.
        </div>

        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-ant-..."
          style={{
            width: '100%',
            background: '#F2F0EF',
            border: '1px solid rgba(0,0,0,0.15)',
            borderRadius: 4,
            padding: '12px 14px',
            color: 'rgba(0,0,0,0.85)',
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: 13,
            outline: 'none',
            marginBottom: 12,
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

        <div
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: 10,
            color: 'rgba(0,0,0,0.35)',
            lineHeight: 1.5,
            marginBottom: 24,
            letterSpacing: '0.05em',
          }}
        >
          Get your key at{' '}
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#0047FF', textDecoration: 'none' }}
          >
            console.anthropic.com
          </a>
          . Stored locally, never sent to any server other than Anthropic.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(0,0,0,0.5)',
              background: 'transparent',
              border: '1px solid rgba(0,0,0,0.15)',
              borderRadius: 4,
              padding: '8px 20px',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)')}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (key.trim()) onSave(key.trim())
            }}
            disabled={!key.trim()}
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#fff',
              background: key.trim() ? '#0047FF' : 'rgba(0,0,0,0.15)',
              border: 'none',
              borderRadius: 4,
              padding: '8px 20px',
              cursor: key.trim() ? 'pointer' : 'not-allowed',
              opacity: key.trim() ? 1 : 0.5,
              boxShadow: key.trim() ? '0 4px 24px rgba(0,71,255,0.3)' : 'none',
              transition: 'background 0.15s',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
