'use client';

import { useDroppable, useDraggable } from '@dnd-kit/core';
import type { CalendarDraft } from '@/hooks/useCalendarDrafts';
import CalendarDraftCard from './CalendarDraftCard';

function DraggableBacklogCard({
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

interface CalendarBacklogProps {
  drafts: CalendarDraft[];
  onStatusChange: (id: string, status: string) => void;
  onRepurpose: (draft: CalendarDraft) => void;
  onDelete: (id: string) => void;
  onEdit: (draft: CalendarDraft) => void;
  isOver?: boolean;
}

export default function CalendarBacklog({
  drafts,
  onStatusChange,
  onRepurpose,
  onDelete,
  onEdit,
  isOver = false,
}: CalendarBacklogProps) {
  const { setNodeRef } = useDroppable({
    id: 'backlog',
    data: { isBacklog: true },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        width: 200,
        flexShrink: 0,
        background: isOver ? 'rgba(10,132,255,0.04)' : 'var(--surface)',
        borderRadius: 12,
        border: isOver ? '1.5px solid rgba(10,132,255,0.3)' : '1px solid var(--border)',
        padding: 12,
        transition: 'all 150ms ease',
        overflowY: 'auto',
        maxHeight: 500,
      }}
    >
      <h4 style={{
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: 8,
        letterSpacing: '-0.01em',
      }}>
        Backlog
        {drafts.length > 0 && (
          <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: 4 }}>
            ({drafts.length})
          </span>
        )}
      </h4>

      {drafts.length === 0 ? (
        <p style={{
          fontSize: 11,
          color: 'var(--text-tertiary)',
          textAlign: 'center',
          padding: '16px 0',
        }}>
          Drag drafts here to unschedule
        </p>
      ) : (
        <div className="space-y-2">
          {drafts.map((draft) => (
            <DraggableBacklogCard
              key={draft.id}
              draft={draft}
              onStatusChange={onStatusChange}
              onRepurpose={onRepurpose}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
