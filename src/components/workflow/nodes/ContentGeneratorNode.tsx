'use client';

import { memo, useCallback } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Loader2, Zap } from 'lucide-react';
import BaseNode from './BaseNode';
import { useWorkflowStore } from '../useWorkflowStore';
import { useCurrentBrand, useBrandStore } from '@/lib/store';
import { Variation } from '../workflow.types';
import analytics from '@/lib/analytics';

function ContentGeneratorNode(_props: NodeProps) {
  const {
    topic,
    tone,
    isGenerating,
    variations,
    setIsGenerating,
    setGenerationError,
    setVariations,
  } = useWorkflowStore();

  const brandDNA = useCurrentBrand();
  const { markFirstGeneration, phaseProgress } = useBrandStore();

  const handleGenerate = useCallback(async () => {
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
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setGenerationError(result.error || 'Generation failed');
        return;
      }

      setVariations(result.variations as Variation[]);

      // Track generation in analytics and mark first generation
      analytics.contentGenerated('social-twitter');
      if (!phaseProgress.hasCompletedFirstGeneration) {
        markFirstGeneration();
      }
    } catch {
      setGenerationError('Network error. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [topic, tone, brandDNA, setIsGenerating, setGenerationError, setVariations, markFirstGeneration, phaseProgress.hasCompletedFirstGeneration]);

  const canGenerate = topic.trim().length > 0 && brandDNA?.name;
  const hasOutput = variations.length > 0;

  return (
    <BaseNode
      nodeType="contentGenerator"
      title="Content Generator"
      subtitle={isGenerating ? 'Processing...' : hasOutput ? 'Done' : 'Ready'}
      inputs={[
        { id: 'topic-tone-in', color: '#FFD700' },
        { id: 'dna-in', color: '#00FF41' },
      ]}
      outputs={[{ id: 'variations-out', color: '#A855F7' }]}
      isActive={isGenerating || hasOutput}
      isPulsing={isGenerating}
    >
      <div className="space-y-3">
        {/* Status indicators */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                topic.trim() ? 'bg-[#00FF41]' : 'bg-white/20'
              }`}
            />
            <span className="text-[10px] text-white/40">Topic</span>
            {topic.trim() && (
              <span className="text-[10px] text-white/20 truncate max-w-[140px]">
                {topic.slice(0, 40)}...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                tone ? 'bg-[#FFD700]' : 'bg-white/20'
              }`}
            />
            <span className="text-[10px] text-white/40">Tone</span>
            {tone && (
              <span className="text-[10px] text-[#FFD700]/60">{tone}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                brandDNA?.name ? 'bg-[#00FF41]' : 'bg-white/20'
              }`}
            />
            <span className="text-[10px] text-white/40">Brand DNA</span>
            {brandDNA?.name && (
              <span className="text-[10px] text-[#00FF41]/60">
                {brandDNA.name}
              </span>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
            isGenerating
              ? 'bg-[#00FF41]/10 text-[#00FF41]/60 border border-[#00FF41]/20'
              : canGenerate
              ? 'bg-[#00FF41]/15 text-[#00FF41] border border-[#00FF41]/30 hover:bg-[#00FF41]/25 hover:shadow-[0_0_20px_rgba(0,255,65,0.15)]'
              : 'bg-white/[0.03] text-white/20 border border-white/[0.06] cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              Generate
            </>
          )}
        </button>
      </div>
    </BaseNode>
  );
}

export default memo(ContentGeneratorNode);
