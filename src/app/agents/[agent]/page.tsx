'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AgentChat from '@/components/agents/AgentChat';
import { AgentSelectorMini } from '@/components/agents/AgentSelector';
import { getAgentPersona, agentPersonas } from '@/lib/agents/chat.types';
import { AgentName } from '@/lib/agents/types';
import { useBrandStore } from '@/lib/store';
import Link from 'next/link';

export default function AgentChatPage() {
  const params = useParams();
  const router = useRouter();
  const agentParam = params.agent as string;
  const brand = useBrandStore((state) => state.brand);

  // Validate agent name
  const isValidAgent = agentParam in agentPersonas;
  const agentName = isValidAgent ? (agentParam as AgentName) : null;

  // Check if brand is loaded
  const hasBrand = brand && brand.name;

  // Redirect if invalid agent
  useEffect(() => {
    if (!isValidAgent) {
      router.push('/agents');
    }
  }, [isValidAgent, router]);

  if (!isValidAgent || !agentName) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-400">Redirecting...</p>
        </div>
      </div>
    );
  }

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
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Create Brand
          </Link>
        </div>
      </div>
    );
  }

  const persona = getAgentPersona(agentName);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/agents" 
              className="text-neutral-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: `${persona.accentColor}20` }}
              >
                {persona.avatar}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">{persona.displayName}</h1>
                <p className="text-sm text-neutral-400">{persona.title}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-500">
              Brand: <span className="text-neutral-300">{brand.name}</span>
            </span>
            <AgentSelectorMini
              selectedAgent={agentName}
              onSelectAgent={(agent) => router.push(`/agents/${agent}`)}
            />
          </div>
        </div>
      </header>

      {/* Chat */}
      <main className="flex-1 p-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto h-full"
        >
          <AgentChat
            persona={persona}
            brandId={brand.id}
          />
        </motion.div>
      </main>
    </div>
  );
}





