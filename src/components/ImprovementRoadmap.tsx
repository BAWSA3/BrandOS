'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Zap, Target, ChevronRight, Check, Clock, Lightbulb } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface Issue {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'define' | 'check' | 'generate' | 'scale';
}

interface QuickWin {
  action: string;
  timeEstimate: string;
  template?: string;
}

interface WeeklyFocus {
  challenge: string;
  metric: string;
  tips: string[];
}

export interface ImprovementRoadmapData {
  topIssues: Issue[];
  quickWins: QuickWin[];
  weeklyFocus: WeeklyFocus;
}

interface ImprovementRoadmapProps {
  data: ImprovementRoadmapData;
  onJoinWaitlist?: () => void;
}

// =============================================================================
// Helper Components
// =============================================================================

const ImpactBadge = ({ impact }: { impact: Issue['impact'] }) => {
  const config = {
    high: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', label: 'HIGH IMPACT' },
    medium: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', label: 'MEDIUM' },
    low: { bg: 'bg-gray-500/20', border: 'border-gray-500/40', text: 'text-gray-400', label: 'LOW' },
  };
  const c = config[impact];

  return (
    <span className={`${c.bg} ${c.border} ${c.text} border px-2 py-0.5 text-[9px] font-os tracking-wider rounded`}>
      {c.label}
    </span>
  );
};

const CategoryBadge = ({ category }: { category: Issue['category'] }) => {
  const config = {
    define: { bg: 'bg-[#E8A838]/20', text: 'text-[#E8A838]' },
    check: { bg: 'bg-[#00ff88]/20', text: 'text-[#00ff88]' },
    generate: { bg: 'bg-[#9d4edd]/20', text: 'text-[#9d4edd]' },
    scale: { bg: 'bg-[#ff6b35]/20', text: 'text-[#ff6b35]' },
  };
  const c = config[category];

  return (
    <span className={`${c.bg} ${c.text} px-2 py-0.5 text-[9px] font-os tracking-wider rounded uppercase`}>
      {category}
    </span>
  );
};

// =============================================================================
// Issue Card Component
// =============================================================================

const IssueCard = ({ issue, index }: { issue: Issue; index: number }) => {
  const [isExpanded, setIsExpanded] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-[#0a0a0a] border border-[#222] rounded-lg overflow-hidden cursor-pointer group"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <ImpactBadge impact={issue.impact} />
              <CategoryBadge category={issue.category} />
            </div>
            <h4 className="font-brand font-bold text-white text-sm leading-tight">
              {issue.title}
            </h4>
          </div>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
        />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0">
              <p className="text-gray-400 text-xs leading-relaxed ml-9">
                {issue.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// =============================================================================
// Quick Win Card Component
// =============================================================================

const QuickWinCard = ({ win, index }: { win: QuickWin; index: number }) => {
  const [isDone, setIsDone] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      className={`bg-[#0a0a0a] border rounded-lg p-4 transition-all ${
        isDone ? 'border-[#10B981]/50 bg-[#10B981]/5' : 'border-[#222]'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => setIsDone(!isDone)}
          className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
            isDone
              ? 'bg-[#10B981] border-[#10B981]'
              : 'border-[#333] hover:border-[#10B981]/50'
          }`}
        >
          {isDone && <Check className="w-3 h-3 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] text-gray-500 font-os">{win.timeEstimate}</span>
          </div>
          <p className={`text-sm font-medium leading-tight ${isDone ? 'text-gray-500 line-through' : 'text-white'}`}>
            {win.action}
          </p>

          {win.template && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTemplate(!showTemplate);
                }}
                className="text-[10px] text-[#2E6AFF] font-os mt-2 hover:underline flex items-center gap-1"
              >
                <Lightbulb className="w-3 h-3" />
                {showTemplate ? 'Hide template' : 'Show template'}
              </button>

              <AnimatePresence>
                {showTemplate && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 p-3 bg-[#111] rounded border border-[#222] text-xs text-gray-400 font-os leading-relaxed whitespace-pre-wrap">
                      {win.template}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// =============================================================================
// Weekly Focus Card Component
// =============================================================================

const WeeklyFocusCard = ({ focus }: { focus: WeeklyFocus }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-gradient-to-br from-[#2E6AFF]/10 to-[#2E6AFF]/5 border border-[#2E6AFF]/30 rounded-xl p-6 relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#2E6AFF]/20 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#2E6AFF] flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] text-[#2E6AFF] font-os tracking-widest">THIS WEEK'S FOCUS</span>
        </div>

        <h3 className="text-xl font-brand font-bold text-white mb-2 leading-tight">
          {focus.challenge}
        </h3>

        <div className="bg-[#0a0a0a]/50 rounded-lg p-3 mb-4 border border-[#2E6AFF]/20">
          <span className="text-[9px] text-[#2E6AFF] font-os tracking-wider block mb-1">SUCCESS METRIC</span>
          <p className="text-sm text-white">{focus.metric}</p>
        </div>

        <div className="space-y-2">
          <span className="text-[9px] text-gray-500 font-os tracking-wider">HOW TO DO IT</span>
          {focus.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2E6AFF] mt-1.5 flex-shrink-0" />
              <p className="text-xs text-gray-400 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

const ImprovementRoadmap: React.FC<ImprovementRoadmapProps> = ({ data, onJoinWaitlist }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@400;700&display=swap');
        .font-brand { font-family: 'Inter', sans-serif; }
        .font-os { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <span className="inline-block px-3 py-1 bg-[#D4A574]/10 border border-[#D4A574]/30 rounded-full text-[10px] text-[#D4A574] font-os tracking-widest mb-4">
          YOUR IMPROVEMENT ROADMAP
        </span>
        <h2 className="text-2xl md:text-3xl font-brand font-bold text-white mb-2">
          What's holding you back
        </h2>
        <p className="text-sm text-gray-500">
          Personalized recommendations based on your Brand DNA analysis
        </p>
      </motion.div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Left Column - Issues & Quick Wins */}
        <div className="space-y-6">
          {/* Top Issues */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-[11px] text-gray-500 font-os tracking-wider">TOP ISSUES TO FIX</span>
            </div>
            <div className="space-y-3">
              {data.topIssues.map((issue, i) => (
                <IssueCard key={i} issue={issue} index={i} />
              ))}
            </div>
          </div>

          {/* Quick Wins */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-[#FFD700]" />
              <span className="text-[11px] text-gray-500 font-os tracking-wider">QUICK WINS (5 MIN EACH)</span>
            </div>
            <div className="space-y-3">
              {data.quickWins.map((win, i) => (
                <QuickWinCard key={i} win={win} index={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Weekly Focus & CTA */}
        <div className="space-y-6">
          {/* Weekly Focus */}
          <WeeklyFocusCard focus={data.weeklyFocus} />

          {/* CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-[#D4A574]/10 to-[#D4A574]/5 border border-[#D4A574]/30 rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🚀</span>
              <span className="text-[10px] text-[#D4A574] font-os tracking-widest">COMING SOON</span>
            </div>

            <h3 className="text-lg font-brand font-bold text-white mb-2">
              Want ongoing guidance?
            </h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              BrandOS Pro will give you weekly check-ins, content suggestions that match your voice, and track your brand improvement over time.
            </p>

            <motion.button
              onClick={onJoinWaitlist}
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(212, 165, 116, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 bg-[#D4A574] rounded-lg text-white font-os text-[11px] tracking-wider font-bold cursor-pointer border-none"
            >
              JOIN THE WAITLIST
            </motion.button>

            <p className="text-[10px] text-gray-600 text-center mt-3">
              Be first to access when we launch
            </p>
          </motion.div>

          {/* Framework reminder */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="border border-[#222] rounded-lg p-4 bg-[#0a0a0a]"
          >
            <span className="text-[9px] text-gray-600 font-os tracking-wider block mb-2">THE BRANDOS FRAMEWORK</span>
            <div className="flex justify-between text-[10px] font-os">
              <span className="text-[#E8A838]">DEFINE</span>
              <span className="text-gray-600">→</span>
              <span className="text-[#00ff88]">CHECK</span>
              <span className="text-gray-600">→</span>
              <span className="text-[#9d4edd]">GENERATE</span>
              <span className="text-gray-600">→</span>
              <span className="text-[#ff6b35]">SCALE</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ImprovementRoadmap;
