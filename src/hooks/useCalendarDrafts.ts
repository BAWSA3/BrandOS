'use client';

import { useState, useCallback, useEffect } from 'react';
import { useCurrentBrand } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';

export interface CalendarDraft {
  id: string;
  content: string;
  contentType: string;
  tone: string;
  status: string;
  scheduledFor: string | null;
  sourceType: string | null;
  sourceId: string | null;
  authenticity: number | null;
  parentId: string | null;
  parent: { id: string; content: string; contentType: string } | null;
  childrenCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateDraftInput {
  content: string;
  contentType?: string;
  tone?: string;
  status?: string;
  scheduledFor?: string | null;
  sourceType?: string;
  sourceId?: string;
  parentId?: string;
  authenticity?: number;
}

interface UpdateDraftInput {
  content?: string;
  contentType?: string;
  tone?: string;
  status?: string;
  scheduledFor?: string | null;
  authenticity?: number;
}

interface CalendarDraftsState {
  drafts: CalendarDraft[];
  backlog: CalendarDraft[];
  isLoading: boolean;
  error: string | null;
  weekStart: Date;
  setWeekStart: (date: Date) => void;
  createDraft: (input: CreateDraftInput) => Promise<CalendarDraft | null>;
  updateDraft: (id: string, input: UpdateDraftInput) => Promise<CalendarDraft | null>;
  deleteDraft: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  navigateWeek: (direction: -1 | 1) => void;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getSunday(monday: Date): Date {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

export function useCalendarDrafts(): CalendarDraftsState {
  const brand = useCurrentBrand();
  const { user } = useAuth();

  const [drafts, setDrafts] = useState<CalendarDraft[]>([]);
  const [backlog, setBacklog] = useState<CalendarDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));

  const brandId = brand?.id;

  const fetchDrafts = useCallback(async () => {
    if (!brandId || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const from = weekStart.toISOString();
      const to = getSunday(weekStart).toISOString();

      // Fetch scheduled drafts for the week and unscheduled backlog in parallel
      const [scheduledRes, backlogRes] = await Promise.all([
        fetch(`/api/calendar/drafts?brandId=${brandId}&from=${from}&to=${to}`),
        fetch(`/api/calendar/drafts?brandId=${brandId}&unscheduled=true`),
      ]);

      if (!scheduledRes.ok) throw new Error('Failed to fetch drafts');
      if (!backlogRes.ok) throw new Error('Failed to fetch backlog');

      const scheduledData = await scheduledRes.json();
      const backlogData = await backlogRes.json();

      setDrafts(scheduledData.drafts || []);
      setBacklog(backlogData.drafts || []);
    } catch (err) {
      console.error('Failed to fetch calendar drafts:', err);
      setError('Failed to load calendar');
    } finally {
      setIsLoading(false);
    }
  }, [brandId, user, weekStart]);

  const createDraft = useCallback(async (input: CreateDraftInput): Promise<CalendarDraft | null> => {
    if (!brandId) return null;

    try {
      const res = await fetch('/api/calendar/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, ...input }),
      });

      if (!res.ok) throw new Error('Failed to create draft');

      const data = await res.json();
      // Refresh to get updated lists
      await fetchDrafts();
      return data.draft;
    } catch (err) {
      console.error('Failed to create draft:', err);
      setError('Failed to create draft');
      return null;
    }
  }, [brandId, fetchDrafts]);

  const updateDraft = useCallback(async (id: string, input: UpdateDraftInput): Promise<CalendarDraft | null> => {
    try {
      const res = await fetch(`/api/calendar/drafts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error('Failed to update draft');

      const data = await res.json();
      // Refresh to get updated lists
      await fetchDrafts();
      return data.draft;
    } catch (err) {
      console.error('Failed to update draft:', err);
      setError('Failed to update draft');
      return null;
    }
  }, [fetchDrafts]);

  const deleteDraft = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/calendar/drafts/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete draft');

      await fetchDrafts();
      return true;
    } catch (err) {
      console.error('Failed to delete draft:', err);
      setError('Failed to delete draft');
      return false;
    }
  }, [fetchDrafts]);

  const navigateWeek = useCallback((direction: -1 | 1) => {
    setWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + direction * 7);
      return next;
    });
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  return {
    drafts,
    backlog,
    isLoading,
    error,
    weekStart,
    setWeekStart,
    createDraft,
    updateDraft,
    deleteDraft,
    refresh: fetchDrafts,
    navigateWeek,
  };
}
