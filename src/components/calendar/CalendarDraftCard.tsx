'use client';

import { useState } from 'react';
import type { CalendarDraft } from '@/hooks/useCalendarDrafts';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  idea: { bg: 'color-mix(in srgb, var(--warning) 12%, transparent)', text: 'var(--warning)', label: 'Idea' },
  draft: { bg: 'color-mix(in srgb, var(--accent) 12%, transparent)', text: 'var(--accent)', label: 'Draft' },
  scheduled: { bg: 'color-mix(in srgb, var(--success) 12%, transparent)', text: 'var(--success)', label: 'Scheduled' },
  published: {
    bg: 'color-mix(in srgb, var(--text-tertiary) 12%, transparent)',
    text: 'var(--text-tertiary)',
    label: 'Published',
  },
};

const toneColors: Record<string, { bg: string; text: string }> = {
  'hot-take': { bg: 'color-mix(in srgb, var(--danger) 12%, transparent)', text: 'var(--danger)' },
  educational: { bg: 'color-mix(in srgb, var(--success) 12%, transparent)', text: 'var(--success)' },
  casual: { bg: 'color-mix(in srgb, var(--accent) 12%, transparent)', text: 'var(--accent)' },
  launch: { bg: 'color-mix(in srgb, var(--accent) 12%, transparent)', text: 'var(--accent)' },
  'behind-the-scenes': { bg: 'color-mix(in srgb, var(--warning) 12%, transparent)', text: 'var(--warning)' },
  announcement: { bg: 'color-mix(in srgb, var(--accent) 12%, transparent)', text: 'var(--accent)' },
  thread: {
    bg: 'color-mix(in srgb, var(--text-tertiary) 12%, transparent)',
    text: 'var(--text-tertiary)',
  },
  poll: { bg: 'color-mix(in srgb, var(--accent) 12%, transparent)', text: 'var(--accent)' },
  story: { bg: 'color-mix(in srgb, var(--warning) 12%, transparent)', text: 'var(--warning)' },
  'counter-argument': { bg: 'color-mix(in srgb, var(--danger) 12%, transparent)', text: 'var(--danger)' },
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
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ display: 'inline', verticalAlign: '-1px', marginRight: 2 }}
            >
              <line x1="6" y1="3" x2="6" y2="15" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <path d="M18 9a9 9 0 0 1-9 9" />
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
        <div className="flex items-center gap-1 mt-1.5" style={{ flexWrap: 'wrap' }}>
          {action && onStatusChange && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(draft.id, action.next);
              }}
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: 'var(--accent)',
                background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
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
              onClick={(e) => {
                e.stopPropagation();
                onRepurpose(draft);
              }}
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
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ display: 'inline', verticalAlign: '-1px', marginRight: 2 }}
              >
                <line x1="6" y1="3" x2="6" y2="15" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <path d="M18 9a9 9 0 0 1-9 9" />
              </svg>
              Repurpose
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(draft);
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                onDelete(draft.id);
              }}
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: 'var(--danger)',
                background: 'color-mix(in srgb, var(--danger) 8%, transparent)',
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
