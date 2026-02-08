'use client';

import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

interface AnimatedBezierEdgeData {
  color?: string;
  isFlowing?: boolean;
}

export default function AnimatedBezierEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const edgeData = data as AnimatedBezierEdgeData | undefined;
  const color = edgeData?.color || '#00FF41';
  const isFlowing = edgeData?.isFlowing ?? false;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.4,
  });

  const filterId = `glow-${id}`;

  return (
    <>
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feFlood floodColor={color} floodOpacity="0.4" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glow layer */}
      <BaseEdge
        id={`${id}-glow`}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: isFlowing ? 4 : 2,
          strokeOpacity: 0.15,
          filter: `url(#${filterId})`,
          transition: 'stroke-width 0.5s ease',
        }}
      />

      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: isFlowing ? 2.5 : 1.5,
          strokeOpacity: selected ? 0.9 : 0.5,
          transition: 'stroke-width 0.5s ease, stroke-opacity 0.3s ease',
        }}
      />

      {/* Animated flowing dots */}
      {isFlowing && (
        <circle r="3" fill={color} opacity="0.8">
          <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}

      {/* Animated dash overlay */}
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={1}
        strokeOpacity={isFlowing ? 0.6 : 0.2}
        strokeDasharray={isFlowing ? '6 8' : '4 12'}
        style={{
          animation: isFlowing
            ? 'flowDash 1.5s linear infinite'
            : 'flowDash 4s linear infinite',
        }}
      />

      <style>{`
        @keyframes flowDash {
          to {
            stroke-dashoffset: -40;
          }
        }
      `}</style>
    </>
  );
}
