'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ConductorChat } from '@/components/conductor';
import { useBrandStore } from '@/lib/store';
import { conductorPersona } from '@/lib/agents/conductor.types';

export default function ConductorPage() {
  const brand = useBrandStore((state) => state.brand);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Check if brand is loaded
  const hasBrand = brand && brand.name;

  if (!hasBrand) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center"
        >
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-xl" />
            <div className="relative w-full h-full rounded-2xl bg-neutral-900 flex items-center justify-center text-5xl border border-neutral-800">
              🎼
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Set Up Your Brand First</h1>
          <p className="text-neutral-400 mb-6">
            The Conductor needs your brand DNA to orchestrate the AI agents effectively.
            Create your brand to get started.
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-indigo-500/25"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Brand
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4 bg-neutral-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/app" 
              className="text-neutral-400 hover:text-white transition-colors p-2 -ml-2 rounded-lg hover:bg-neutral-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center text-xl border border-indigo-500/30">
                  🎼
                </div>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white flex items-center gap-2">
                  Conductor
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-normal uppercase tracking-wider">
                    Beta
                  </span>
                </h1>
                <p className="text-sm text-neutral-400">
                  AI Orchestration for {brand.name}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick nav to agents */}
            <Link
              href="/agents"
              className="text-sm px-4 py-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors flex items-center gap-2"
            >
              <span className="flex -space-x-1">
                <span className="w-4 h-4 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px]">🎯</span>
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">✍️</span>
                <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">📊</span>
              </span>
              Direct Agents
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="h-[calc(100vh-160px)]"
          >
            {/* Info Banner */}
            <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-neutral-800">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-xl border border-indigo-500/30">
                  🎼
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">
                    {conductorPersona.displayName} — {conductorPersona.title}
                  </h3>
                  <p className="text-sm text-neutral-400 mb-3">
                    {conductorPersona.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {conductorPersona.capabilities.slice(0, 3).map((cap, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded-lg bg-neutral-800 text-neutral-400 border border-neutral-700"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Chat */}
            <div className="h-[calc(100%-120px)]">
              <ConductorChat brandDNA={brand} brandId={brand.id} />
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}



