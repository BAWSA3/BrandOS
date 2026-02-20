'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useBrandHealthScore, type HealthHistoryPoint } from '@/hooks/useBrandHealthScore';

const DIMENSIONS = [
  { key: 'score' as const, label: 'Overall', color: '#0A84FF' },
  { key: 'completeness' as const, label: 'Completeness', color: '#5E5CE6' },
  { key: 'consistency' as const, label: 'Consistency', color: '#30D158' },
  { key: 'voiceMatch' as const, label: 'Voice Match', color: '#BF5AF2' },
  { key: 'engagement' as const, label: 'Engagement', color: '#FF9F0A' },
  { key: 'activity' as const, label: 'Activity', color: '#64D2FF' },
] as const;

type DimensionKey = (typeof DIMENSIONS)[number]['key'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function getValue(point: HealthHistoryPoint, key: DimensionKey): number {
  return point[key];
}

// Pure SVG line chart
function Chart({
  data,
  activeDimensions,
}: {
  data: HealthHistoryPoint[];
  activeDimensions: Set<DimensionKey>;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    point: HealthHistoryPoint;
  } | null>(null);

  const width = 600;
  const height = 200;
  const padLeft = 36;
  const padRight = 12;
  const padTop = 12;
  const padBottom = 28;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const xScale = useCallback(
    (i: number) => padLeft + (data.length <= 1 ? chartW / 2 : (i / (data.length - 1)) * chartW),
    [data.length, chartW]
  );
  const yScale = useCallback(
    (v: number) => padTop + (1 - v / 100) * chartH,
    [chartH]
  );

  // Y-axis gridlines
  const yTicks = [0, 25, 50, 75, 100];

  // X-axis labels — show at most 6 evenly spaced
  const xLabels = useMemo(() => {
    if (data.length <= 1) return data.map((d, i) => ({ i, label: formatDate(d.date) }));
    const count = Math.min(6, data.length);
    const step = (data.length - 1) / (count - 1);
    return Array.from({ length: count }, (_, j) => {
      const i = Math.round(j * step);
      return { i, label: formatDate(data[i].date) };
    });
  }, [data]);

  // Build polyline paths per dimension
  const paths = useMemo(() => {
    return DIMENSIONS.filter(d => activeDimensions.has(d.key)).map(dim => {
      const points = data
        .map((p, i) => `${xScale(i)},${yScale(getValue(p, dim.key))}`)
        .join(' ');
      return { key: dim.key, color: dim.color, points };
    });
  }, [data, activeDimensions, xScale, yScale]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (data.length === 0) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * width;

      // Find closest data point
      let closest = 0;
      let closestDist = Infinity;
      for (let i = 0; i < data.length; i++) {
        const dist = Math.abs(xScale(i) - mouseX);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      }
      setTooltip({ x: xScale(closest), y: yScale(data[closest].score), point: data[closest] });
    },
    [data, xScale, yScale, width]
  );

  if (data.length === 0) return null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxHeight: 220 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Gridlines */}
        {yTicks.map(v => (
          <g key={v}>
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={yScale(v)}
              y2={yScale(v)}
              stroke="rgba(0,0,0,0.06)"
              strokeWidth="1"
            />
            <text
              x={padLeft - 6}
              y={yScale(v) + 3.5}
              textAnchor="end"
              fill="var(--text-tertiary)"
              fontSize="9"
              fontFamily="var(--font-sans, system-ui)"
            >
              {v}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map(({ i, label }) => (
          <text
            key={i}
            x={xScale(i)}
            y={height - 4}
            textAnchor="middle"
            fill="var(--text-tertiary)"
            fontSize="9"
            fontFamily="var(--font-sans, system-ui)"
          >
            {label}
          </text>
        ))}

        {/* Lines */}
        {paths.map(({ key, color, points }) => (
          <polyline
            key={key}
            points={points}
            fill="none"
            stroke={color}
            strokeWidth={key === 'score' ? 2.5 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={key === 'score' ? 1 : 0.7}
          />
        ))}

        {/* Area fill under overall score line */}
        {activeDimensions.has('score') && data.length > 1 && (
          <polygon
            points={`${xScale(0)},${yScale(0)} ${data.map((p, i) => `${xScale(i)},${yScale(p.score)}`).join(' ')} ${xScale(data.length - 1)},${yScale(0)}`}
            fill="url(#areaGrad)"
            opacity="0.12"
          />
        )}

        {/* Tooltip crosshair */}
        {tooltip && (
          <>
            <line
              x1={tooltip.x}
              x2={tooltip.x}
              y1={padTop}
              y2={height - padBottom}
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            {DIMENSIONS.filter(d => activeDimensions.has(d.key)).map(dim => (
              <circle
                key={dim.key}
                cx={tooltip.x}
                cy={yScale(getValue(tooltip.point, dim.key))}
                r={dim.key === 'score' ? 4 : 3}
                fill={dim.color}
                stroke="white"
                strokeWidth="1.5"
              />
            ))}
          </>
        )}

        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0A84FF" />
            <stop offset="100%" stopColor="#0A84FF" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${(tooltip.x / width) * 100}%`,
            top: 0,
            transform: 'translateX(-50%)',
            zIndex: 10,
          }}
        >
          <div
            style={{
              background: 'var(--surface, #fff)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '8px 12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              fontSize: 11,
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
              {formatDateTime(tooltip.point.date)}
            </div>
            {DIMENSIONS.filter(d => activeDimensions.has(d.key)).map(dim => (
              <div key={dim.key} className="flex items-center gap-2" style={{ marginBottom: 1 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: dim.color, display: 'inline-block' }} />
                <span style={{ color: 'var(--text-secondary)' }}>{dim.label}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginLeft: 'auto', paddingLeft: 8 }}>
                  {getValue(tooltip.point, dim.key)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BrandConsistencyChart() {
  const health = useBrandHealthScore();
  const [activeDimensions, setActiveDimensions] = useState<Set<DimensionKey>>(
    new Set(['score'])
  );

  const toggleDimension = (key: DimensionKey) => {
    setActiveDimensions(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        // Don't allow deselecting everything
        if (next.size <= 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (health.isLoading) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex items-center justify-center py-12">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
          />
        </div>
      </div>
    );
  }

  const hasData = health.history.length >= 2;

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 16,
        padding: 24,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              letterSpacing: '-0.01em',
            }}
          >
            Brand Consistency Over Time
          </h3>
          {hasData && (
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
              {health.history.length} snapshots
            </p>
          )}
        </div>

        {health.hasSnapshot && (
          <button
            onClick={health.refresh}
            disabled={health.isComputing}
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: '5px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: health.isComputing ? 'var(--surface-hover)' : 'var(--surface)',
              color: health.isComputing ? 'var(--text-tertiary)' : 'var(--text-secondary)',
              cursor: health.isComputing ? 'not-allowed' : 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            {health.isComputing ? 'Computing...' : 'New Snapshot'}
          </button>
        )}
      </div>

      {/* Dimension toggles */}
      {hasData && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {DIMENSIONS.map(dim => {
            const isActive = activeDimensions.has(dim.key);
            return (
              <button
                key={dim.key}
                onClick={() => toggleDimension(dim.key)}
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  padding: '3px 10px',
                  borderRadius: 20,
                  border: `1px solid ${isActive ? dim.color : 'var(--border)'}`,
                  background: isActive ? `${dim.color}14` : 'transparent',
                  color: isActive ? dim.color : 'var(--text-tertiary)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isActive ? dim.color : 'var(--border)',
                    transition: 'background 150ms ease',
                  }}
                />
                {dim.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Chart or empty state */}
      {hasData ? (
        <Chart data={health.history} activeDimensions={activeDimensions} />
      ) : (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 8 }}>
            Not enough data yet.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
            Compute at least 2 health snapshots to see your brand consistency trend.
          </p>
          {!health.hasSnapshot && (
            <button
              onClick={health.refresh}
              disabled={health.isComputing}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                background: 'linear-gradient(135deg, #0A84FF, #30D158)',
                border: 'none',
                padding: '8px 20px',
                borderRadius: 8,
                cursor: health.isComputing ? 'not-allowed' : 'pointer',
              }}
            >
              {health.isComputing ? 'Computing...' : 'Compute First Snapshot'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
