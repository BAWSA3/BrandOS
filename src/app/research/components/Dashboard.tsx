'use client';

import { InterviewMeta, ProfileType } from '../types';
import { PROFILES } from '../lib/data';

const colorMap = {
  blue: { bg: 'rgba(0,71,255,0.08)', text: '#0047FF', border: 'rgba(0,71,255,0.15)' },
  green: { bg: 'rgba(16,185,129,0.08)', text: '#10B981', border: 'rgba(16,185,129,0.15)' },
  amber: { bg: 'rgba(245,158,11,0.08)', text: '#F59E0B', border: 'rgba(245,158,11,0.15)' },
  red: { bg: 'rgba(239,68,68,0.08)', text: '#EF4444', border: 'rgba(239,68,68,0.15)' },
};

const profileColor: Record<ProfileType, keyof typeof colorMap> = {
  intuitive: 'blue',
  grinder: 'amber',
  builder: 'green',
};

interface Props {
  interviews: InterviewMeta[];
  onNew: () => void;
  onOpen: (id: string) => void;
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 4,
        padding: '12px 16px',
        flex: 1,
        minWidth: 100,
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div
        style={{
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(0,0,0,0.35)',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: 20,
          fontWeight: 700,
          color: color || 'rgba(0,0,0,0.85)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function IVRow({ iv, onClick }: { iv: InterviewMeta; onClick: () => void }) {
  const pc = iv.profile ? colorMap[profileColor[iv.profile]] : null;
  const statusColor = iv.status === 'complete' ? colorMap.green : colorMap.amber;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        background: '#ffffff',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,71,255,0.04)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
    >
      {/* Avatar */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: 14,
          fontWeight: 700,
          color: 'rgba(0,0,0,0.5)',
          flexShrink: 0,
          textTransform: 'uppercase',
        }}
      >
        {iv.username.charAt(0)}
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Helvetica', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: 'rgba(0,0,0,0.85)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          @{iv.username}
        </div>
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Helvetica', sans-serif",
            fontSize: 12,
            color: 'rgba(0,0,0,0.5)',
            marginTop: 2,
          }}
        >
          {iv.tier} &middot; {new Date(iv.date).toLocaleDateString()}
        </div>
      </div>

      {/* Profile badge */}
      {iv.profile && pc && (
        <span
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: pc.text,
            background: pc.bg,
            border: `1px solid ${pc.border}`,
            borderRadius: 4,
            padding: '3px 8px',
            whiteSpace: 'nowrap',
          }}
        >
          {iv.profile}
        </span>
      )}

      {/* Status badge */}
      <span
        style={{
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: statusColor.text,
          background: statusColor.bg,
          border: `1px solid ${statusColor.border}`,
          borderRadius: 4,
          padding: '3px 8px',
          whiteSpace: 'nowrap',
        }}
      >
        {iv.status}
      </span>

      {/* Chevron */}
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </div>
  );
}

export default function Dashboard({ interviews, onNew, onOpen }: Props) {
  const sorted = [...interviews].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const complete = interviews.filter((iv) => iv.status === 'complete').length;
  const intuitive = interviews.filter((iv) => iv.profile === 'intuitive').length;
  const builder = interviews.filter((iv) => iv.profile === 'builder').length;

  return (
    <div>
      {/* Stats row */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 24,
        }}
      >
        <StatCard label="Total" value={interviews.length} />
        <StatCard label="Complete" value={complete} color="#10B981" />
        <StatCard label="Intuitive" value={intuitive} color="#0047FF" />
        <StatCard label="Builder" value={builder} color="#10B981" />
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.35)',
          }}
        >
          // INTERVIEWS
        </div>
        <button
          onClick={onNew}
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
            padding: '8px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 24px rgba(0,71,255,0.3)',
          }}
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Interview
        </button>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 4,
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: 14,
              color: 'rgba(0,0,0,0.35)',
              marginBottom: 16,
            }}
          >
            {'> no interviews found_'}
            <span style={{ animation: 'blink 1s step-end infinite' }}>|</span>
          </div>
          <button
            onClick={onNew}
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
            Start First Interview
          </button>
          <style>{`@keyframes blink { 50% { opacity: 0 } }`}</style>
        </div>
      ) : (
        <div
          style={{
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          {sorted.map((iv) => (
            <IVRow key={iv.id} iv={iv} onClick={() => onOpen(iv.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
