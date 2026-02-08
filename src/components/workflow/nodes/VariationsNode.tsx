'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Check } from 'lucide-react';
import BaseNode from './BaseNode';
import { useWorkflowStore } from '../useWorkflowStore';

function VariationsNode(_props: NodeProps) {
  const { variations, selectedVariationIndex, selectVariation } =
    useWorkflowStore();

  const hasVariations = variations.length > 0;

  return (
    <BaseNode
      nodeType="variations"
      title="Variations"
      subtitle={
        hasVariations
          ? selectedVariationIndex !== null
            ? `Option ${selectedVariationIndex + 1} selected`
            : `${variations.length} options`
          : 'Waiting...'
      }
      inputs={[{ id: 'variations-in', color: '#A855F7' }]}
      outputs={[{ id: 'selected-out', color: '#A855F7' }]}
      isActive={selectedVariationIndex !== null}
      wide
    >
      {hasVariations ? (
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
          {variations.map((variation, i) => {
            const isSelected = selectedVariationIndex === i;
            const isOverLimit = variation.characterCount > 280;

            return (
              <button
                key={i}
                onClick={() => selectVariation(i)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-[#A855F7]/10 border-[#A855F7]/40'
                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">
                    Option {i + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] ${
                        isOverLimit ? 'text-red-400' : 'text-white/30'
                      }`}
                    >
                      {variation.characterCount}/280
                    </span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-[#A855F7] flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed line-clamp-3">
                  {variation.content}
                </p>
                {variation.brandAlignmentScore > 0 && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${variation.brandAlignmentScore}%`,
                          background:
                            variation.brandAlignmentScore >= 80
                              ? '#00FF41'
                              : variation.brandAlignmentScore >= 60
                              ? '#FFD700'
                              : '#EF4444',
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-white/30">
                      {variation.brandAlignmentScore}%
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-2">
            <span className="text-white/20 text-sm">1</span>
          </div>
          <p className="text-[11px] text-white/25">
            Generate content to see variations
          </p>
        </div>
      )}
    </BaseNode>
  );
}

export default memo(VariationsNode);
