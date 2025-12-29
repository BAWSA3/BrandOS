'use client';

import { motion } from 'framer-motion';
import { AgentPersona, getAllAgentPersonas } from '@/lib/agents/chat.types';
import { AgentName } from '@/lib/agents/types';

interface AgentSelectorProps {
  selectedAgent: AgentName | null;
  onSelectAgent: (agent: AgentName) => void;
  variant?: 'cards' | 'tabs';
}

export default function AgentSelector({
  selectedAgent,
  onSelectAgent,
  variant = 'cards',
}: AgentSelectorProps) {
  const personas = getAllAgentPersonas();

  if (variant === 'tabs') {
    return (
      <div className="flex gap-2 p-1 bg-neutral-900 rounded-lg">
        {personas.map((persona) => (
          <button
            key={persona.name}
            onClick={() => onSelectAgent(persona.name)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              selectedAgent === persona.name
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-lg">{persona.avatar}</span>
            <span className="font-medium">{persona.displayName}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {personas.map((persona) => (
        <AgentCard
          key={persona.name}
          persona={persona}
          isSelected={selectedAgent === persona.name}
          onSelect={() => onSelectAgent(persona.name)}
        />
      ))}
    </div>
  );
}

function AgentCard({
  persona,
  isSelected,
  onSelect,
}: {
  persona: AgentPersona;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-6 rounded-2xl border text-left transition-all ${
        isSelected
          ? 'border-2 bg-neutral-900'
          : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
      }`}
      style={{
        borderColor: isSelected ? persona.accentColor : undefined,
        boxShadow: isSelected ? `0 0 30px ${persona.accentColor}20` : undefined,
      }}
    >
      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          layoutId="selected-indicator"
          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: persona.accentColor }}
        >
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </motion.div>
      )}

      {/* Avatar */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4"
        style={{ backgroundColor: `${persona.accentColor}20` }}
      >
        {persona.avatar}
      </div>

      {/* Info */}
      <h3 className="text-lg font-semibold text-white mb-1">{persona.displayName}</h3>
      <p
        className="text-sm font-medium mb-2"
        style={{ color: persona.accentColor }}
      >
        {persona.title}
      </p>
      <p className="text-sm text-neutral-400 mb-4">{persona.description}</p>

      {/* Capabilities preview */}
      <div className="flex flex-wrap gap-1">
        {persona.capabilities.slice(0, 3).map((cap, idx) => (
          <span
            key={idx}
            className="text-xs px-2 py-1 rounded-full bg-neutral-800 text-neutral-400"
          >
            {cap}
          </span>
        ))}
        {persona.capabilities.length > 3 && (
          <span className="text-xs px-2 py-1 rounded-full bg-neutral-800 text-neutral-500">
            +{persona.capabilities.length - 3} more
          </span>
        )}
      </div>
    </motion.button>
  );
}

// Mini version for sidebar/header
export function AgentSelectorMini({
  selectedAgent,
  onSelectAgent,
}: {
  selectedAgent: AgentName | null;
  onSelectAgent: (agent: AgentName) => void;
}) {
  const personas = getAllAgentPersonas();

  return (
    <div className="flex gap-1">
      {personas.map((persona) => (
        <button
          key={persona.name}
          onClick={() => onSelectAgent(persona.name)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
            selectedAgent === persona.name
              ? 'ring-2'
              : 'opacity-50 hover:opacity-100'
          }`}
          style={{
            backgroundColor: `${persona.accentColor}20`,
            ringColor: selectedAgent === persona.name ? persona.accentColor : undefined,
          }}
          title={`${persona.displayName} - ${persona.title}`}
        >
          {persona.avatar}
        </button>
      ))}
    </div>
  );
}

