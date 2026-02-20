'use client';

import { useDroppable } from '@dnd-kit/core';
import type { CalendarDraft } from '@/hooks/useCalendarDrafts';
import CalendarDraftCard from './CalendarDraftCard';
import { useDraggable } from '@dnd-kit/core';

function DraggableDraftCard({
  draft,
  onStatusChange,
  onRepurpose,
  onDelete,
  onEdit,
}: {
  draft: CalendarDraft;
  onStatusChange?: (id: string, status: string) => void;
  onRepurpose?: (draft: CalendarDraft) => void;
  onDelete?: (id: string) => void;
  onEdit?: (draft: CalendarDraft) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: draft.id,
    data: { draft },
  });

  return (
    <div ref={setNodeRef}>
      <CalendarDraftCard
        draft={draft}
        onStatusChange={onStatusChange}
        onRepurpose={onRepurpose}
        onDelete={onDelete}
        onEdit={onEdit}
        compact
        dragAttributes={attributes}
        dragListeners={listeners}
        isDragging={isDragging}
      />
    </div>
  );
}

interface CalendarDayColumnProps {
  date: Date;
  drafts: CalendarDraft[];
  isToday: boolean;
  onAddDraft: (date: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onRepurpose: (draft: CalendarDraft) => void;
  onDelete: (id: string) => void;
  onEdit: (draft: CalendarDraft) => void;
  isOverloaded?: boolean;
  isGap?: boolean;
  isOver?: boolean;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarDayColumn({
  date,
  drafts,
  isToday,
  onAddDraft,
  onStatusChange,
  onRepurpose,
  onDelete,
  onEdit,
  isOverloaded = false,
  isGap = false,
  isOver = false,
}: CalendarDayColumnProps) {
  const dateStr = date.toISOString().split('T')[0];

  const { setNodeRef } = useDroppable({
    id: `day-${dateStr}`,
    data: { date: dateStr },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        background: isOver ? 'rgba(10,132,255,0.04)' : 'transparent',
        borderRadius: 12,
        border: isOver
          ? '1.5px solid rgba(10,132,255,0.3)'
          : isOverloaded
            ? '1.5px solid rgba(255,159,10,0.4)'
            : isGap
              ? '1.5px dashed var(--border)'
              : '1px solid var(--border)',
        padding: 8,
        transition: 'all 150ms ease',
        minHeight: 160,
        position: 'relative',
      }}
    >
      {/* Day header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span style={{
            fontSize: 11,
            fontWeight: 500,
            color: isToday ? '#0A84FF' : 'var(--text-tertiary)',
          }}>
            {dayNames[date.getDay()]}
          </span>
          <span style={{
            fontSize: 13,
            fontWeight: isToday ? 600 : 500,
            color: isToday ? '#0A84FF' : 'var(--text-primary)',
            background: isToday ? 'rgba(10,132,255,0.12)' : 'transparent',
            borderRadius: 6,
            padding: isToday ? '1px 6px' : '0',
          }}>
            {date.getDate()}
          </span>
        </div>
        <button
          onClick={() => onAddDraft(dateStr)}
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>

      {/* Indicators */}
      {isGap && drafts.length === 0 && (
        <div style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          textAlign: 'center',
          padding: '8px 0',
          opacity: 0.7,
        }}>
          gap
        </div>
      )}

      {isOverloaded && (
        <div style={{
          fontSize: 10,
          color: '#FF9F0A',
          textAlign: 'center',
          marginBottom: 4,
        }}>
          {drafts.length} posts
        </div>
      )}

      {/* Draft cards */}
      <div className="space-y-1.5 flex-1">
        {drafts.map((draft) => (
          <DraggableDraftCard
            key={draft.id}
            draft={draft}
            onStatusChange={onStatusChange}
            onRepurpose={onRepurpose}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}
