'use client';

import { useState, useEffect, useRef } from 'react';
import { useDriftAlerts, DriftAlert } from '@/hooks/useDriftAlerts';
import { useToast } from '@/components/ToastProvider';

const COLLAPSE_THRESHOLD = 3;

function severityColor(severity: string) {
  if (severity === 'critical') {
    return {
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.25)',
      accent: '#ef4444',
      iconBg: 'rgba(239, 68, 68, 0.15)',
    };
  }
  return {
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.25)',
    accent: '#f59e0b',
    iconBg: 'rgba(245, 158, 11, 0.15)',
  };
}

function AlertIcon({ severity }: { severity: string }) {
  const color = severity === 'critical' ? '#ef4444' : '#f59e0b';
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function AlertItem({ alert, onDismiss }: { alert: DriftAlert; onDismiss: (id: string) => void }) {
  const colors = severityColor(alert.severity);

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div
        className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
        style={{ background: colors.iconBg }}
      >
        <AlertIcon severity={alert.severity} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90 font-medium truncate">
          {alert.message}
        </p>
        <p className="text-[11px] text-white/40 mt-0.5 uppercase tracking-wide">
          {alert.severity} &middot; {alert.type.replace(/_/g, ' ')}
        </p>
      </div>

      <button
        onClick={() => onDismiss(alert.id)}
        className="flex-shrink-0 p-1.5 rounded-md hover:bg-white/10 transition-colors"
        aria-label="Dismiss alert"
        title="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.4">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export default function DriftAlertsBar() {
  const { alerts, isLoading, dismiss } = useDriftAlerts();
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);
  const prevCountRef = useRef(0);

  // Toast on new alerts arriving
  useEffect(() => {
    if (alerts.length > prevCountRef.current && prevCountRef.current >= 0) {
      const newAlerts = alerts.slice(0, alerts.length - prevCountRef.current);
      for (const alert of newAlerts) {
        toast.warning(
          'Brand Drift Detected',
          alert.message,
        );
      }
    }
    prevCountRef.current = alerts.length;
  }, [alerts, toast]);

  if (isLoading || alerts.length === 0) return null;

  const shouldCollapse = alerts.length > COLLAPSE_THRESHOLD && !expanded;
  const visibleAlerts = shouldCollapse ? alerts.slice(0, COLLAPSE_THRESHOLD) : alerts;
  const hiddenCount = alerts.length - COLLAPSE_THRESHOLD;

  const hasCritical = alerts.some(a => a.severity === 'critical');
  const headerColor = hasCritical ? '#ef4444' : '#f59e0b';

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(15, 15, 15, 0.6)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${hasCritical ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={headerColor} strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: headerColor }}>
          Brand Drift Alerts
        </span>
        <span
          className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{
            background: `${headerColor}20`,
            color: headerColor,
          }}
        >
          {alerts.length}
        </span>
      </div>

      {/* Alert list */}
      <div className="p-2 space-y-1.5">
        {visibleAlerts.map(alert => (
          <AlertItem key={alert.id} alert={alert} onDismiss={dismiss} />
        ))}

        {shouldCollapse && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full text-center text-xs text-white/50 hover:text-white/70 py-1.5 transition-colors"
          >
            +{hiddenCount} more alert{hiddenCount > 1 ? 's' : ''}
          </button>
        )}

        {expanded && alerts.length > COLLAPSE_THRESHOLD && (
          <button
            onClick={() => setExpanded(false)}
            className="w-full text-center text-xs text-white/50 hover:text-white/70 py-1.5 transition-colors"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
}
