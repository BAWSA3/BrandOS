'use client';

import { useState, useMemo, useCallback } from 'react';
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent, DragOverEvent, pointerWithin } from '@dnd-kit/core';
import { useCalendarDrafts, CalendarDraft } from '@/hooks/useCalendarDrafts';
import CalendarDayColumn from './CalendarDayColumn';
import CalendarBacklog from './CalendarBacklog';
import CalendarDraftCard from './CalendarDraftCard';
import NewDraftModal from './NewDraftModal';
import RepurposePanel from './RepurposePanel';

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const start = monday.toLocaleDateString('en-US', opts);
  const end = sunday.toLocaleDateString('en-US', opts);
  return `${start} — ${end}`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

export default function ContentCalendar() {
  const {
    drafts,
    backlog,
    isLoading,
    error,
    weekStart,
    createDraft,
    updateDraft,
    deleteDraft,
    navigateWeek,
  } = useCalendarDrafts();

  const [activeDraft, setActiveDraft] = useState<CalendarDraft | null>(null);
  const [showNewDraft, setShowNewDraft] = useState(false);
  const [newDraftDate, setNewDraftDate] = useState<string | null>(null);
  const [repurposeSource, setRepurposeSource] = useState<CalendarDraft | null>(null);
  const [overDropId, setOverDropId] = useState<string | null>(null);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const today = useMemo(() => new Date(), []);

  // Group drafts by day
  const draftsByDay = useMemo(() => {
    const map: Record<string, CalendarDraft[]> = {};
    weekDays.forEach(d => {
      map[d.toISOString().split('T')[0]] = [];
    });
    drafts.forEach(d => {
      if (d.scheduledFor) {
        const key = d.scheduledFor.split('T')[0];
        if (map[key]) map[key].push(d);
      }
    });
    return map;
  }, [drafts, weekDays]);

  // Cadence indicators
  const dayStats = useMemo(() => {
    const stats: Record<string, { overloaded: boolean; gap: boolean }> = {};
    const dayKeys = weekDays.map(d => d.toISOString().split('T')[0]);

    dayKeys.forEach((key, i) => {
      const count = draftsByDay[key]?.length || 0;
      const isOverloaded = count >= 3;

      // Gap = 0 drafts and neighbors also 0 (consecutive empty days)
      let isGap = false;
      if (count === 0) {
        const prevCount = i > 0 ? (draftsByDay[dayKeys[i - 1]]?.length || 0) : 1;
        const nextCount = i < dayKeys.length - 1 ? (draftsByDay[dayKeys[i + 1]]?.length || 0) : 1;
        isGap = prevCount === 0 || nextCount === 0;
      }

      stats[key] = { overloaded: isOverloaded, gap: isGap };
    });
    return stats;
  }, [draftsByDay, weekDays]);

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const draft = event.active.data.current?.draft as CalendarDraft;
    setActiveDraft(draft);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveDraft(null);
    setOverDropId(null);

    const { active, over } = event;
    if (!over) return;

    const draft = active.data.current?.draft as CalendarDraft;
    if (!draft) return;

    const overId = over.id as string;

    if (overId === 'backlog') {
      // Unschedule
      await updateDraft(draft.id, { scheduledFor: null });
    } else if (overId.startsWith('day-')) {
      const dateStr = overId.replace('day-', '');
      // Schedule to that day (noon UTC to avoid timezone issues)
      await updateDraft(draft.id, { scheduledFor: `${dateStr}T12:00:00.000Z` });
    }
  }, [updateDraft]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverDropId(event.over?.id != null ? String(event.over.id) : null);
  }, []);

  const handleStatusChange = useCallback(async (id: string, status: string) => {
    await updateDraft(id, { status });
  }, [updateDraft]);

  const handleAddDraft = useCallback((date: string) => {
    setNewDraftDate(date);
    setShowNewDraft(true);
  }, []);

  const handleCreateDraft = useCallback(async (data: {
    content: string;
    contentType: string;
    tone: string;
    scheduledFor: string | null;
    status: string;
  }) => {
    await createDraft({
      ...data,
      scheduledFor: data.scheduledFor ? `${data.scheduledFor}T12:00:00.000Z` : null,
      sourceType: 'manual',
    });
  }, [createDraft]);

  const handleRepurpose = useCallback((draft: CalendarDraft) => {
    setRepurposeSource(draft);
  }, []);

  // Cadence summary
  const cadenceSummary = useMemo(() => {
    const scheduled = drafts.filter(d => d.status === 'scheduled').length;
    const draftCount = drafts.filter(d => d.status === 'draft').length;
    const ideaCount = [...drafts, ...backlog].filter(d => d.status === 'idea').length;
    const gapDays = Object.values(dayStats).filter(s => s.gap).length;
    const overloadedDays = Object.values(dayStats).filter(s => s.overloaded).length;

    let indicator = 'On track';
    let indicatorColor = '#30D158';
    if (gapDays >= 3) {
      indicator = `Gap ahead (${gapDays} empty days)`;
      indicatorColor = '#FF9F0A';
    }
    if (overloadedDays > 0) {
      indicator = `Heavy (${overloadedDays} day${overloadedDays > 1 ? 's' : ''} with 3+ posts)`;
      indicatorColor = '#FF9F0A';
    }

    return { scheduled, draftCount, ideaCount, indicator, indicatorColor };
  }, [drafts, backlog, dayStats]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Content Calendar
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Plan, schedule, and repurpose your content.
          </p>
        </div>
        <button
          onClick={() => { setNewDraftDate(null); setShowNewDraft(true); }}
          style={{
            fontSize: 13,
            fontWeight: 500,
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#0A84FF',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Draft
        </button>
      </div>

      {/* Cadence info bar */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 10,
          border: '1px solid var(--border)',
          padding: '10px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div className="flex items-center gap-4" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>{cadenceSummary.scheduled}</strong> scheduled
          </span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>{cadenceSummary.draftCount}</strong> drafts
          </span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>{cadenceSummary.ideaCount}</strong> ideas
          </span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 500, color: cadenceSummary.indicatorColor }}>
          {cadenceSummary.indicator}
        </span>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateWeek(-1)}
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '6px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Prev
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
          {formatWeekRange(weekStart)}
        </span>
        <button
          onClick={() => navigateWeek(1)}
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '6px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Next
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: 13, color: 'var(--error, #ff3b30)', marginBottom: 12 }}>
          {error}
        </p>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div
            className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
          />
        </div>
      ) : (
        <DndContext
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div className="flex gap-3">
            {/* Backlog panel */}
            <CalendarBacklog
              drafts={backlog}
              onStatusChange={handleStatusChange}
              onRepurpose={handleRepurpose}
              onDelete={deleteDraft}
              onEdit={(draft) => { setRepurposeSource(null); /* TODO: edit modal */ }}
              isOver={overDropId === 'backlog'}
            />

            {/* Week grid */}
            <div className="flex gap-2 flex-1 min-w-0">
              {weekDays.map((day) => {
                const dateStr = day.toISOString().split('T')[0];
                const stats = dayStats[dateStr] || { overloaded: false, gap: false };
                return (
                  <CalendarDayColumn
                    key={dateStr}
                    date={day}
                    drafts={draftsByDay[dateStr] || []}
                    isToday={isSameDay(day, today)}
                    onAddDraft={handleAddDraft}
                    onStatusChange={handleStatusChange}
                    onRepurpose={handleRepurpose}
                    onDelete={deleteDraft}
                    onEdit={(draft) => { /* TODO: edit modal */ }}
                    isOverloaded={stats.overloaded}
                    isGap={stats.gap}
                    isOver={overDropId === `day-${dateStr}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Drag overlay ghost */}
          <DragOverlay>
            {activeDraft && (
              <div style={{ width: 180, opacity: 0.85 }}>
                <CalendarDraftCard draft={activeDraft} compact isDragging />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* New Draft Modal */}
      <NewDraftModal
        isOpen={showNewDraft}
        onClose={() => setShowNewDraft(false)}
        onSubmit={handleCreateDraft}
        defaultDate={newDraftDate}
      />

      {/* Repurpose Panel */}
      {repurposeSource && (
        <RepurposePanel
          source={repurposeSource}
          onClose={() => setRepurposeSource(null)}
          onSaveDraft={async (data) => {
            await createDraft({
              ...data,
              sourceType: 'repurpose',
              sourceId: repurposeSource.id,
              parentId: repurposeSource.id,
            });
          }}
        />
      )}
    </div>
  );
}
