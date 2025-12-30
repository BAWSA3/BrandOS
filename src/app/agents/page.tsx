'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UnifiedChat from '@/components/agents/UnifiedChat';
import AgentChat from '@/components/agents/AgentChat';
import AgentSelector from '@/components/agents/AgentSelector';
import { getAgentPersona, getAllAgentPersonas } from '@/lib/agents/chat.types';
import { AgentName } from '@/lib/agents/types';
import { useBrandStore } from '@/lib/store';
import Link from 'next/link';

type ChatMode = 'unified' | 'specific';

export default function AgentsPage() {
  const [chatMode, setChatMode] = useState<ChatMode>('unified');
  const [selectedAgent, setSelectedAgent] = useState<AgentName | null>(null);
  const brand = useBrandStore((state) => state.brand);

  // Check if brand is loaded
  const hasBrand = brand && brand.name;

  if (!hasBrand) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-neutral-900 flex items-center justify-center text-4xl">
            🎨
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Set Up Your Brand First</h1>
          <p className="text-neutral-400 mb-6">
            The AI agents need your brand DNA to create on-brand content and strategies.
            Set up your brand to get started.
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Brand
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-neutral-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-white">AI Agents</h1>
              <p className="text-sm text-neutral-400">
                Marketing assistants for {brand.name}
              </p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-2 p-1 bg-neutral-900 rounded-lg">
            <button
              onClick={() => {
                setChatMode('unified');
                setSelectedAgent(null);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                chatMode === 'unified'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">🤖</span>
                Auto
              </span>
            </button>
            <button
              onClick={() => setChatMode('specific')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                chatMode === 'specific'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">👤</span>
                Pick Agent
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {chatMode === 'unified' ? (
            <motion.div
              key="unified"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-[calc(100vh-160px)]"
            >
              {/* Info banner */}
              <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 via-emerald-500/10 to-amber-500/10 border border-neutral-800">
                <div className="flex items-start gap-3">
                  <div className="flex -space-x-1">
                    {getAllAgentPersonas().map((p) => (
                      <span key={p.name} className="text-lg">{p.avatar}</span>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm text-neutral-300">
                      <strong>Auto-routing enabled.</strong> Just describe what you need and I'll 
                      connect you with the right specialist—Campaign, Content, or Analytics.
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-[calc(100%-80px)]">
                <UnifiedChat brandDNA={brand} brandId={brand.id} />
              </div>
            </motion.div>
          ) : selectedAgent ? (
            <motion.div
              key={`specific-${selectedAgent}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-[calc(100vh-160px)]"
            >
              {/* Back to selector */}
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-sm text-neutral-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Choose different agent
                </button>
                
                <div className="flex items-center gap-2">
                  {getAllAgentPersonas().map((persona) => (
                    <button
                      key={persona.name}
                      onClick={() => setSelectedAgent(persona.name)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                        selectedAgent === persona.name
                          ? 'ring-2 ring-offset-2 ring-offset-black'
                          : 'opacity-40 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: `${persona.accentColor}20`,
                        ringColor: selectedAgent === persona.name ? persona.accentColor : undefined,
                      }}
                    >
                      {persona.avatar}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[calc(100%-60px)]">
                <AgentChat
                  persona={getAgentPersona(selectedAgent)}
                  brandId={brand.id}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="selector"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Choose Your Specialist
                </h2>
                <p className="text-neutral-400">
                  Each agent is an expert in their domain
                </p>
              </div>

              <AgentSelector
                selectedAgent={selectedAgent}
                onSelectAgent={setSelectedAgent}
                variant="cards"
              />

              {/* Quick comparison */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                {getAllAgentPersonas().map((persona) => (
                  <div 
                    key={persona.name}
                    className="p-5 rounded-xl bg-neutral-900/50 border border-neutral-800"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${persona.accentColor}20` }}
                      >
                        {persona.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{persona.displayName}</h3>
                        <p className="text-xs" style={{ color: persona.accentColor }}>
                          {persona.title}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-neutral-400 mb-4">
                      {persona.description}
                    </p>

                    <div className="space-y-2">
                      <p className="text-xs text-neutral-500 uppercase tracking-wide">Try:</p>
                      {persona.examplePrompts.slice(0, 2).map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedAgent(persona.name)}
                          className="block w-full text-left text-xs p-2 rounded bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                        >
                          "{prompt}"
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
