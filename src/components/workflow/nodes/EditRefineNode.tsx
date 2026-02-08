'use client';

import { memo, useCallback } from 'react';
import { type NodeProps } from '@xyflow/react';
import { RotateCcw } from 'lucide-react';
import BaseNode from './BaseNode';
import { useWorkflowStore } from '../useWorkflowStore';
import { useCurrentBrand } from '@/lib/store';
import { Variation } from '../workflow.types';

function EditRefineNode(_props: NodeProps) {
  const {
    editedContent,
    setEditedContent,
    selectedVariationIndex,
    topic,
    tone,
    setIsGenerating,
    setGenerationError,
    setVariations,
  } = useWorkflowStore();

  const brandDNA = useCurrentBrand();

  const charCount = editedContent.length;
  const isOverLimit = charCount > 280;
  const charPercent = Math.min((charCount / 280) * 100, 100);

  const handleRegenerate = useCallback(async () => {
    if (!topic.trim() || !brandDNA?.name) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const res = await fetch('/api/generate-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          tone: tone || 'casual',
          brandDNA,
          refinementNote: `The user edited a previous draft. Here's their current version for context: "${editedContent}". Generate new variations that are different but capture a similar direction.`,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        setVariations(result.variations as Variation[]);
      }
    } catch {
      // Silently fail regeneration
    } finally {
      setIsGenerating(false);
    }
  }, [topic, tone, brandDNA, editedContent, setIsGenerating, setGenerationError, setVariations]);

  const hasContent = selectedVariationIndex !== null;

  return (
    <BaseNode
      nodeType="editRefine"
      title="Edit & Refine"
      subtitle={hasContent ? `${charCount}/280` : 'Waiting...'}
      inputs={[
        { id: 'draft-in', color: '#A855F7' },
        { id: 'media-in', color: '#F472B6' },
      ]}
      outputs={[{ id: 'final-out', color: '#C0C0C0' }]}
      isActive={hasContent}
    >
      {hasContent ? (
        <div className="space-y-3">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={5}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white/90 resize-none outline-none focus:border-[#2E6AFF]/50 transition-colors"
          />

          {/* Character count ring */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white/70 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Regenerate
            </button>

            <div className="flex items-center gap-2">
              <div className="relative w-6 h-6">
                <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke={
                      isOverLimit
                        ? '#EF4444'
                        : charPercent > 90
                        ? '#FFD700'
                        : '#2E6AFF'
                    }
                    strokeWidth="2"
                    strokeDasharray={`${charPercent * 0.628} 62.8`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span
                className={`text-[10px] font-mono ${
                  isOverLimit
                    ? 'text-red-400'
                    : charPercent > 90
                    ? 'text-[#FFD700]'
                    : 'text-white/40'
                }`}
              >
                {280 - charCount}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-[11px] text-white/25">
            Select a variation to edit
          </p>
        </div>
      )}
    </BaseNode>
  );
}

export default memo(EditRefineNode);
