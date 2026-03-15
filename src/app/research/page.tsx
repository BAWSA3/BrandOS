'use client'

import { useState, useEffect, useCallback } from 'react'
import { Interview, InterviewMeta } from './types'
import { storage } from './lib/storage'
import { exportAllCSV } from './lib/export'
import Dashboard from './components/Dashboard'
import NewInterview from './components/NewInterview'
import InterviewDetail from './components/InterviewDetail'
import APIKeyModal from './components/APIKeyModal'

type View = 'dashboard' | 'new' | 'detail'

const FILM_GRAIN_URL = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`

export default function ResearchPage() {
  const [view, setView] = useState<View>('dashboard')
  const [interviews, setInterviews] = useState<InterviewMeta[]>([])
  const [activeIV, setActiveIV] = useState<Interview | null>(null)
  const [draft, setDraft] = useState<Partial<Interview> | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [showKeyModal, setShowKeyModal] = useState(false)

  const refresh = useCallback(() => {
    setInterviews(storage.getIndex())
  }, [])

  useEffect(() => {
    refresh()
    const key = storage.getApiKey()
    setApiKey(key)
    if (!key) setShowKeyModal(true)
  }, [refresh])

  const handleNewInterview = () => {
    setDraft({})
    setView('new')
  }

  const handleOpenInterview = (id: string) => {
    const iv = storage.getInterview(id)
    if (iv) {
      setActiveIV(iv)
      setView('detail')
    }
  }

  const handleSaveInterview = (iv: Interview) => {
    storage.saveInterview(iv)
    setActiveIV(iv)
    setDraft(null)
    refresh()
    setView('detail')
  }

  const handleUpdateInterview = (iv: Interview) => {
    storage.saveInterview(iv)
    setActiveIV(iv)
    refresh()
  }

  const handleDeleteInterview = (id: string) => {
    storage.deleteInterview(id)
    setActiveIV(null)
    refresh()
    setView('dashboard')
  }

  const handleSaveApiKey = (key: string) => {
    storage.setApiKey(key)
    setApiKey(key)
    setShowKeyModal(false)
  }

  const handleCancelNew = () => {
    // Save draft if exists
    if (draft && draft.username) {
      const iv: Interview = {
        id: draft.id || crypto.randomUUID(),
        username: draft.username || '',
        tier: draft.tier || '',
        date: draft.date || new Date().toISOString(),
        signals: draft.signals || {},
        profile: draft.profile || null,
        responses: draft.responses || {},
        summary: null,
        status: 'draft',
      }
      storage.saveInterview(iv)
      refresh()
    }
    setDraft(null)
    setView('dashboard')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F2F0EF', color: 'rgba(0,0,0,0.85)' }}>
      {/* Film grain overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: FILM_GRAIN_URL,
          backgroundRepeat: 'repeat',
          pointerEvents: 'none',
          zIndex: 10,
          opacity: 0.04,
        }}
      />

      {/* Sidebar */}
      <aside
        style={{
          width: 260,
          borderRight: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          background: '#F2F0EF',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {/* Decorative corner bracket — top-left */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 30,
            height: 30,
            borderTop: '1px solid rgba(0,0,0,0.1)',
            borderLeft: '1px solid rgba(0,0,0,0.1)',
            pointerEvents: 'none',
          }}
        />
        {/* Decorative corner bracket — bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            width: 30,
            height: 30,
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            borderRight: '1px solid rgba(0,0,0,0.1)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)', position: 'relative' }}>
          <div style={{ fontFamily: "'VCR OSD Mono', monospace", fontWeight: 700, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0047FF' }}>
            BRANDOS
          </div>
          <div style={{ fontFamily: "'PP NeueBit', monospace", fontSize: 11, color: 'rgba(0,0,0,0.5)', marginTop: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            RESEARCH HUB
          </div>
          {/* Version label */}
          <span
            style={{
              position: 'absolute',
              top: 24,
              right: 20,
              fontFamily: "'PP NeueBit', monospace",
              fontSize: 10,
              color: 'rgba(0,0,0,0.25)',
            }}
          >
            v1.0
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          <NavItem
            label="Dashboard"
            active={view === 'dashboard'}
            onClick={() => { setView('dashboard'); setActiveIV(null) }}
          />
          <NavItem
            label={activeIV ? `@${activeIV.username}` : 'Active interview'}
            active={view === 'detail'}
            disabled={!activeIV}
            onClick={() => activeIV && setView('detail')}
          />
          <div style={{ height: 8 }} />
          <NavItem
            label="API key"
            badge={apiKey ? 'SET' : 'MISSING'}
            badgeColor={apiKey ? '#10B981' : '#F59E0B'}
            onClick={() => setShowKeyModal(true)}
          />
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 8px 16px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <button
            onClick={handleNewInterview}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: '#0047FF',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontFamily: "'VCR OSD Mono', monospace",
              fontWeight: 500,
              fontSize: 11,
              cursor: 'pointer',
              marginBottom: 8,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            + New interview
          </button>
          <button
            onClick={exportAllCSV}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'transparent',
              color: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(0,0,0,0.15)',
              borderRadius: 4,
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: 10,
              cursor: 'pointer',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Export all CSV
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {view === 'dashboard' && (
          <Dashboard
            interviews={interviews}
            onNew={handleNewInterview}
            onOpen={handleOpenInterview}
          />
        )}
        {view === 'new' && (
          <NewInterview
            draft={draft}
            setDraft={setDraft}
            onSave={handleSaveInterview}
            onCancel={handleCancelNew}
          />
        )}
        {view === 'detail' && activeIV && (
          <InterviewDetail
            iv={activeIV}
            onBack={() => { setView('dashboard'); setActiveIV(null) }}
            onUpdate={handleUpdateInterview}
            onDelete={handleDeleteInterview}
            apiKey={apiKey}
            onNeedKey={() => setShowKeyModal(true)}
          />
        )}

        {/* Footer decorative element */}
        <div
          style={{
            position: 'fixed',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'PP NeueBit', monospace",
            fontSize: 10,
            color: 'rgba(0,0,0,0.2)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
            zIndex: 11,
          }}
        >
          ── POWERED BY AI ──
        </div>
      </main>

      {/* API Key Modal */}
      {showKeyModal && (
        <APIKeyModal
          onSave={handleSaveApiKey}
          onClose={() => setShowKeyModal(false)}
          currentKey={apiKey}
        />
      )}
    </div>
  )
}

function NavItem({
  label,
  active,
  disabled,
  badge,
  badgeColor,
  onClick,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  badge?: string
  badgeColor?: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '8px 12px',
        background: active ? 'rgba(0,71,255,0.08)' : 'transparent',
        border: 'none',
        borderLeft: active ? '2px solid #0047FF' : '2px solid transparent',
        borderRadius: 4,
        color: disabled ? 'rgba(0,0,0,0.25)' : active ? '#0047FF' : 'rgba(0,0,0,0.5)',
        fontFamily: "'VCR OSD Mono', monospace",
        fontSize: 11,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        cursor: disabled ? 'default' : 'pointer',
        textAlign: 'left',
        marginBottom: 2,
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {badge && (
        <span
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.1em',
            padding: '2px 6px',
            borderRadius: 4,
            background: badgeColor === '#10B981' ? 'rgba(16,185,129,0.12)' : badgeColor === '#F59E0B' ? 'rgba(245,158,11,0.12)' : 'rgba(0,71,255,0.08)',
            color: badgeColor || '#0047FF',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  )
}
