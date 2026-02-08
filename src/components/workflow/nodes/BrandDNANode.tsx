'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import { useCurrentBrand } from '@/lib/store';

function BrandDNANode(_props: NodeProps) {
  const brandDNA = useCurrentBrand();

  const toneLabels = [
    { key: 'minimal', label: 'Formality' },
    { key: 'playful', label: 'Energy' },
    { key: 'bold', label: 'Confidence' },
    { key: 'experimental', label: 'Style' },
  ] as const;

  return (
    <BaseNode
      nodeType="brandDNA"
      title="Brand DNA"
      subtitle={brandDNA?.name || 'No brand'}
      outputs={[{ id: 'dna-out', color: '#00FF41' }]}
      isActive={!!brandDNA?.name}
    >
      {brandDNA ? (
        <div className="space-y-3">
          {/* Tone Bars */}
          <div className="space-y-1.5">
            {toneLabels.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] text-white/40 w-16 shrink-0">
                  {label}
                </span>
                <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${brandDNA.tone[key]}%`,
                      background: `linear-gradient(90deg, #00FF41 0%, #00FF41${Math.round(brandDNA.tone[key] * 2.55).toString(16).padStart(2, '0')} 100%)`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-white/30 w-6 text-right">
                  {brandDNA.tone[key]}
                </span>
              </div>
            ))}
          </div>

          {/* Keywords */}
          {brandDNA.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {brandDNA.keywords.slice(0, 5).map((kw, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 text-[9px] rounded bg-[#00FF41]/10 text-[#00FF41]/70 border border-[#00FF41]/20"
                >
                  {kw}
                </span>
              ))}
              {brandDNA.keywords.length > 5 && (
                <span className="text-[9px] text-white/30">
                  +{brandDNA.keywords.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Do/Don't preview */}
          {(brandDNA.doPatterns.length > 0 || brandDNA.dontPatterns.length > 0) && (
            <div className="grid grid-cols-2 gap-2">
              {brandDNA.doPatterns.length > 0 && (
                <div>
                  <span className="text-[9px] text-[#00FF41]/60 uppercase tracking-wider">Do</span>
                  <p className="text-[10px] text-white/40 mt-0.5 line-clamp-2">
                    {brandDNA.doPatterns[0]}
                  </p>
                </div>
              )}
              {brandDNA.dontPatterns.length > 0 && (
                <div>
                  <span className="text-[9px] text-red-400/60 uppercase tracking-wider">Don&apos;t</span>
                  <p className="text-[10px] text-white/40 mt-0.5 line-clamp-2">
                    {brandDNA.dontPatterns[0]}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-white/30">
          Set up your Brand DNA in the Define phase first.
        </p>
      )}
    </BaseNode>
  );
}

export default memo(BrandDNANode);
