'use client';

import { ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import { WorkflowNodeType, NODE_ACCENT_COLORS } from '../workflow.types';

interface BaseNodeProps {
  nodeType: WorkflowNodeType;
  title: string;
  subtitle?: string;
  children: ReactNode;
  inputs?: { id: string; color?: string }[];
  outputs?: { id: string; color?: string }[];
  isActive?: boolean;
  isPulsing?: boolean;
  className?: string;
  wide?: boolean;
}

export default function BaseNode({
  nodeType,
  title,
  subtitle,
  children,
  inputs = [],
  outputs = [],
  isActive = false,
  isPulsing = false,
  className = '',
  wide = false,
}: BaseNodeProps) {
  const accentColor = NODE_ACCENT_COLORS[nodeType];

  return (
    <div
      className={`relative rounded-xl border backdrop-blur-xl transition-all duration-300 ${
        wide ? 'min-w-[380px]' : 'min-w-[260px]'
      } max-w-[420px] ${className}`}
      style={{
        background: 'rgba(15, 15, 15, 0.85)',
        borderColor: isActive
          ? accentColor
          : 'rgba(255, 255, 255, 0.08)',
        boxShadow: isActive
          ? `0 0 20px ${accentColor}30, 0 0 60px ${accentColor}10`
          : '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Pulsing glow overlay */}
      {isPulsing && (
        <div
          className="absolute inset-0 rounded-xl animate-pulse pointer-events-none"
          style={{
            boxShadow: `0 0 30px ${accentColor}40, 0 0 80px ${accentColor}15`,
          }}
        />
      )}

      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
        <span className="text-xs font-medium tracking-wide text-white/80 uppercase">
          {title}
        </span>
        {subtitle && (
          <span className="text-[10px] text-white/30 ml-auto">{subtitle}</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">{children}</div>

      {/* Input Handles */}
      {inputs.map((input, i) => (
        <Handle
          key={`input-${input.id}`}
          type="target"
          position={Position.Left}
          id={input.id}
          style={{
            top: `${((i + 1) / (inputs.length + 1)) * 100}%`,
            width: 10,
            height: 10,
            background: input.color || '#00FF41',
            border: '2px solid rgba(0,0,0,0.6)',
            borderRadius: '50%',
          }}
        />
      ))}

      {/* Output Handles */}
      {outputs.map((output, i) => (
        <Handle
          key={`output-${output.id}`}
          type="source"
          position={Position.Right}
          id={output.id}
          style={{
            top: `${((i + 1) / (outputs.length + 1)) * 100}%`,
            width: 10,
            height: 10,
            background: output.color || '#00FF41',
            border: '2px solid rgba(0,0,0,0.6)',
            borderRadius: '50%',
          }}
        />
      ))}
    </div>
  );
}
