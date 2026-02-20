'use client';

import { useState } from 'react';
import type { CalendarDraft } from '@/hooks/useCalendarDrafts';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  idea: { bg: 'rgba(255,214,10,0.12)', text: '#FFD60A', label: 'Idea' },
  draft: { bg: 'rgba(10,132,255,0.12)', text: '#0A84FF', label: 'Draft' },
  scheduled: { bg: 'rgba(48,209,88,0.12)', text: '#30D158', label: 'Scheduled' },
  published: { bg: 'rgba(172,142,104,0.12)', text: '#AC8E68', label: 'Published' },
};

const toneColors: Record<string, { bg: string; text: string }> = {
  'hot-take': { bg: 'rgba(255,69,58,0.12)', text: '#FF453A' },
  educational: { bg: 'rgba(48,209,88,0.12)', text: '#30D158' },
  casual: { bg: 'rgba(10,132,255,0.12)', text: '#0A84FF' },
  launch: { bg: 'rgba(191,90,242,0.12)', text: '#BF5AF2' },
  'behind-the-scenes': { bg: 'rgba(255,159,10,0.12)', text: '#FF9F0A' },
  announcement: { bg: 'rgba(100,210,255,0.12)', text: '#64D2FF' },
  thread: { bg: 'rgba(172,142,104,0.12)', text: '#AC8E68' },
  poll: { bg: 'rgba(191,90,242,0.12)', text: '#BF5AF2' },
  story: { bg: 'rgba(255,159,10,0.12)', text: '#FF9F0A' },
  'counter-argument': { bg: 'rgba(255,69,58,0.12)', text: '#FF453A' },
};

interface CalendarDraftCardProps {
  draft: CalendarDraft;
  onStatusChange?: (id: string, status: string) => void;
  onRepurpose?: (draft: CalendarDraft) => void;
  onDelete?: (id: string) => void;
  onEdit?: (draft: CalendarDraft) => void;
  compact?: boolean;
  dragAttributes?: React.HTMLAttributes<HTMLElement>;
  dragListeners?: Record<string, unknown>;
  isDragging?: boolean;
}

export default function CalendarDraftCard({
  draft,
  onStatusChange,
  onRepurpose,
  onDelete,
  onEdit,
  compact = false,
  dragAttributes,
  dragListeners,
  isDragging = false,
}: CalendarDraftCardProps) {
  const [showActions, setShowActions] = useState(false);

  const statusStyle = statusColors[draft.status] || statusColors.idea;
  const toneStyle = toneColors[draft.tone] || toneColors.casual;
  const contentTypeStyle = toneColors[draft.contentType] || toneColors.casual;

  const statusActions: Record<string, { label: string; next: string }> = {
    idea: { label: 'Start Writing', next: 'draft' },
    draft: { label: 'Schedule', next: 'scheduled' },
    scheduled: { label: 'Mark Published', next: 'published' },
  };

  const action = statusActions[draft.status];

  return (
    <div
      {...dragAttributes}
      {...dragListeners}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        background: 'var(--surface)',
        borderRadius: 10,
        padding: compact ? '8px 10px' : '10px 12px',
        border: '1px solid var(--border)',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        transition: 'box-shadow 150ms ease, border-color 150ms ease',
        boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
        position: 'relative',
      }}
    >
      {/* Content type + Status pills */}
      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: contentTypeStyle.text,
            background: contentTypeStyle.bg,
            padding: '1px 6px',
            borderRadius: 4,
          }}
        >
          {draft.contentType}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: statusStyle.text,
            background: statusStyle.bg,
            padding: '1px 6px',
            borderRadius: 4,
          }}
        >
          {statusStyle.label}
        </span>
        {draft.tone !== 'casual' && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: toneStyle.text,
              background: toneStyle.bg,
              padding: '1px 6px',
              borderRadius: 4,
            }}
          >
            {draft.tone.replace(/-/g, ' ')}
          </span>
        )}
        {draft.childrenCount > 0 && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              background: 'var(--surface-hover)',
              padding: '1px 6px',
              borderRadius: 4,
            }}
          >
            {/* GitBranch icon inline */}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', verticalAlign: '-1px', marginRight: 2 }}>
              <line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" />
            </svg>
            {draft.childrenCount}
          </span>
        )}
      </div>

      {/* Content preview */}
      <p
        style={{
          fontSize: 12,
          color: 'var(--text-primary)',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: compact ? 2 : 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          margin: 0,
        }}
      >
        {draft.content}
      </p>

      {/* Hover actions */}
      {showActions && !isDragging && (
        <div
          className="flex items-center gap-1 mt-1.5"
          style={{ flexWrap: 'wrap' }}
        >
          {action && onStatusChange && (
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange(draft.id, action.next); }}
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: '#0A84FF',
                background: 'rgba(10,132,255,0.08)',
                border: 'none',
                borderRadius: 4,
                padding: '2px 8px',
                cursor: 'pointer',
              }}
            >
              {action.label}
            </button>
          )}
          {onRepurpose && (
            <button
              onClick={(e) => { e.stopPropagation(); onRepurpose(draft); }}
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: 'var(--text-secondary)',
                background: 'var(--surface-hover)',
                border: 'none',
                borderRadius: 4,
                padding: '2px 8px',
                cursor: 'pointer',
              }}
            >
              {/* GitBranch icon */}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', verticalAlign: '-1px', marginRight: 2 }}>
                <line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" />
              </svg>
              Repurpose
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(draft); }}
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: 'var(--text-secondary)',
                background: 'var(--surface-hover)',
                border: 'none',
                borderRadius: 4,
                padding: '2px 8px',
                cursor: 'pointer',
              }}
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(draft.id); }}
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: 'var(--error, #ff3b30)',
                background: 'rgba(255,59,48,0.08)',
                border: 'none',
                borderRadius: 4,
                padding: '2px 8px',
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
