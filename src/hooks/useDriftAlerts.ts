'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCurrentBrand } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';

export interface DriftAlert {
  id: string;
  type: 'dimension_drop' | 'low_alignment' | 'overall_drop';
  severity: 'critical' | 'warning';
  metric: string;
  previousScore: number;
  currentScore: number;
  delta: number;
  message: string;
  status: 'new' | 'dismissed';
  createdAt: string;
}

interface DriftAlertsState {
  alerts: DriftAlert[];
  newCount: number;
  isLoading: boolean;
  dismiss: (id: string) => Promise<void>;
  detectDrift: () => Promise<DriftAlert[]>;
  refresh: () => Promise<void>;
}

export function useDriftAlerts(): DriftAlertsState {
  const brand = useCurrentBrand();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<DriftAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false);

  const brandId = brand?.id;

  const fetchAlerts = useCallback(async () => {
    if (!brandId || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/drift-alerts?brandId=${brandId}`);
      if (!res.ok) throw new Error('Failed to fetch alerts');
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Failed to fetch drift alerts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [brandId, user]);

  const dismiss = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/drift-alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: id }),
      });
      if (res.ok) {
        setAlerts(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  }, []);

  const detectDrift = useCallback(async (): Promise<DriftAlert[]> => {
    if (!brandId) return [];
    try {
      const res = await fetch('/api/drift-alerts/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      if (data.newCount > 0) {
        // Refresh the full list to get updated state
        await fetchAlerts();
      }
      return data.alerts || [];
    } catch (err) {
      console.error('Failed to detect drift:', err);
      return [];
    }
  }, [brandId, fetchAlerts]);

  // Initial fetch
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchAlerts();
  }, [fetchAlerts]);

  // Reset when brand changes
  useEffect(() => {
    hasFetched.current = false;
    setAlerts([]);
    fetchAlerts();
  }, [brandId, fetchAlerts]);

  return {
    alerts,
    newCount: alerts.length,
    isLoading,
    dismiss,
    detectDrift,
    refresh: fetchAlerts,
  };
}
