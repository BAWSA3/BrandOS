'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useBrandStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { HistoryItem, ContentType, CheckResult } from '@/lib/types';

interface UseHistorySyncReturn {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncError: string | null;
  saveHistoryItem: (item: {
    type: 'check' | 'generate';
    brandId: string;
    brandName: string;
    input: string;
    contentType?: ContentType;
    output: CheckResult | string;
  }) => Promise<void>;
  forceSync: () => Promise<void>;
}

export function useHistorySync(): UseHistorySyncReturn {
  const { user, isLoading: authLoading } = useAuth();
  const { history, addHistoryItem } = useBrandStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const initialSyncDone = useRef(false);
  const setStoreHistory = useBrandStore.getState;

  // Fetch history from server
  const fetchServerHistory = useCallback(async (): Promise<HistoryItem[]> => {
    try {
      const res = await fetch('/api/history?limit=50');
      if (!res.ok) {
        throw new Error('Failed to fetch history');
      }
      const data = await res.json();
      return data.history as HistoryItem[];
    } catch (error) {
      console.error('[useHistorySync] Fetch error:', error);
      throw error;
    }
  }, []);

  // Save history item to server
  const saveToServer = useCallback(async (item: {
    type: 'check' | 'generate';
    brandId: string;
    input: string;
    contentType?: ContentType;
    output: CheckResult | string;
  }): Promise<HistoryItem | null> => {
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save history');
      }

      const data = await res.json();
      return data.entry as HistoryItem;
    } catch (error) {
      console.error('[useHistorySync] Save error:', error);
      throw error;
    }
  }, []);

  // Initial sync: load server history on auth
  const performInitialSync = useCallback(async () => {
    if (!user || initialSyncDone.current) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const serverHistory = await fetchServerHistory();

      // If server has history, merge with local
      if (serverHistory.length > 0) {
        // Get local history IDs that aren't from server
        const serverIds = new Set(serverHistory.map(h => h.id));
        const localOnlyItems = history.filter(h => !serverIds.has(h.id));

        // Replace store history with server history + local-only items
        // Server items take priority for the same IDs
        const mergedHistory = [...serverHistory, ...localOnlyItems]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 50);

        // Update the store with merged history
        useBrandStore.setState({ history: mergedHistory });
      }

      initialSyncDone.current = true;
      setLastSyncedAt(new Date());
    } catch (error) {
      console.error('[useHistorySync] Initial sync error:', error);
      setSyncError('Failed to sync history. Your data is saved locally.');
    } finally {
      setIsSyncing(false);
    }
  }, [user, history, fetchServerHistory]);

  // Save history item - saves to both server and local store
  const saveHistoryItem = useCallback(async (item: {
    type: 'check' | 'generate';
    brandId: string;
    brandName: string;
    input: string;
    contentType?: ContentType;
    output: CheckResult | string;
  }) => {
    // Always save to local store immediately
    addHistoryItem(item);

    // If authenticated, also save to server
    if (user) {
      setSyncError(null);

      try {
        await saveToServer({
          type: item.type,
          brandId: item.brandId,
          input: item.input,
          contentType: item.contentType,
          output: item.output,
        });
        setLastSyncedAt(new Date());
      } catch (error) {
        console.error('[useHistorySync] Save error:', error);
        setSyncError('Failed to save to server. Data saved locally.');
      }
    }
  }, [user, addHistoryItem, saveToServer]);

  // Force sync - re-fetch from server
  const forceSync = useCallback(async () => {
    if (!user) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const serverHistory = await fetchServerHistory();
      useBrandStore.setState({ history: serverHistory });
      setLastSyncedAt(new Date());
    } catch (error) {
      console.error('[useHistorySync] Force sync error:', error);
      setSyncError('Failed to sync. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  }, [user, fetchServerHistory]);

  // Initial sync on auth
  useEffect(() => {
    if (!authLoading && user && !initialSyncDone.current) {
      performInitialSync();
    }
  }, [authLoading, user, performInitialSync]);

  return {
    isSyncing,
    lastSyncedAt,
    syncError,
    saveHistoryItem,
    forceSync,
  };
}

export default useHistorySync;
