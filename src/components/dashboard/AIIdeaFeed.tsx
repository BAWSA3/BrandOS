'use client';

import { Loader2, RefreshCw, ArrowRight } from 'lucide-react';
import type { ContentIdea } from '@/app/api/dashboard/ideas/route';
import { TONE_OPTIONS } from '@/components/workflow/workflow.types';

interface AIIdeaFeedProps {
  ideas: ContentIdea[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreatePost: (topic: string, tone: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  trending: '#FFD700',
  'best-performing': '#00FF41',
  'brand-aligned': '#0047FF',
  timely: '#F472B6',
};

export default function AIIdeaFeed({
  ideas,
  isLoading,
  onRefresh,
  onCreatePost,
}: AIIdeaFeedProps) {
  return (
    <div
      className="col-span-2 rounded-2xl border p-5"
      style={{
        background: 'rgba(15, 15, 15, 0.85)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">💡</span>
          <h3 className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">
            Content Ideas
          </h3>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading && ideas.length === 0 ? (
        <div className="flex items-center gap-3 py-10 justify-center">
          <Loader2 className="w-4 h-4 text-white/20 animate-spin" />
          <span className="text-xs text-white/30">Generating ideas...</span>
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xs text-white/30">
            Set up your Brand DNA to get personalized content ideas.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          {ideas.map((idea, i) => {
            const toneOption = TONE_OPTIONS.find((t) => t.value === idea.prefillTone);
            const categoryColor = CATEGORY_COLORS[idea.category] || '#ffffff';

            return (
              <div
                key={idea.id || i}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/10 transition-all group"
              >
                {/* Category + Tone */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-medium"
                    style={{
                      backgroundColor: `${categoryColor}15`,
                      color: `${categoryColor}CC`,
                      border: `1px solid ${categoryColor}30`,
                    }}
                  >
                    {idea.category.replace('-', ' ')}
                  </span>
                  {toneOption && (
                    <span className="text-[10px] text-white/30">
                      {toneOption.emoji} {toneOption.label}
                    </span>
                  )}
                </div>

                {/* Hook */}
                <p className="text-[12px] text-white/75 leading-relaxed mb-2">
                  {idea.hook}
                </p>

                {/* Reason + CTA */}
                <div className="flex items-end justify-between gap-2">
                  <p className="text-[10px] text-white/30 flex-1">
                    {idea.reason}
                  </p>
                  <button
                    onClick={() => onCreatePost(idea.prefillTopic, idea.prefillTone)}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0047FF]/10 text-[#0047FF] text-[10px] font-medium border border-[#0047FF]/20 hover:bg-[#0047FF]/20 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Create <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
