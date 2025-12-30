'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ConductorMessage,
  WorkflowPlan,
  WorkflowStep,
  IntentClassification,
  ConductorArtifact,
  createConductorMessage,
  conductorPersona,
  getWorkflowStatusEmoji,
  getAgentEmoji,
} from '@/lib/agents/conductor.types';
import { AgentName } from '@/lib/agents/types';
import { agentPersonas } from '@/lib/agents/chat.types';
import { BrandDNA } from '@/lib/types';

interface ConductorChatProps {
  brandDNA: BrandDNA;
  brandId: string;
}

export default function ConductorChat({ brandDNA, brandId }: ConductorChatProps) {
  const [messages, setMessages] = useState<ConductorMessage[]>([
    createConductorMessage(
      'conductor',
      `Welcome to the **Conductor**—your AI orchestration layer for **${brandDNA.name}**.\n\nI route your requests to specialized agents and manage complex workflows. Just tell me what you need:\n\n🎯 **Campaigns** — "Create a launch campaign for our new feature"\n✍️ **Content** — "Write a LinkedIn post about brand consistency"\n📊 **Analytics** — "What content performs best?"\n\nI'll analyze your intent, route to the right specialist, and orchestrate the workflow.`
    ),
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowPlan | null>(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [expandedArtifacts, setExpandedArtifacts] = useState<Set<string>>(new Set());
  const [showWorkflowPanel, setShowWorkflowPanel] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = createConductorMessage('user', input.trim());
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/conductor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          brandDNA,
          message: input.trim(),
          history: messages.slice(-10),
          currentWorkflow,
          pendingApproval,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      // Update workflow if returned
      if (data.workflow) {
        setCurrentWorkflow(data.workflow);
        setShowWorkflowPanel(true);
      }

      // Check for checkpoint
      if (data.workflow?.steps?.some((s: WorkflowStep) => s.checkpoint && s.status === 'in_progress')) {
        setPendingApproval(true);
      } else {
        setPendingApproval(false);
      }

      const conductorMessage = createConductorMessage(
        data.agentUsed ? 'agent' : 'conductor',
        data.content,
        {
          agentName: data.agentUsed,
          intentClassification: data.intent,
          workflowPlan: data.workflow,
          artifacts: data.artifacts,
          processingTime: data.processingTime,
          confidence: data.confidence,
        }
      );
      setMessages((prev) => [...prev, conductorMessage]);
    } catch (error) {
      const errorMessage = createConductorMessage(
        'conductor',
        "I'm having trouble processing that request. Could you try again?"
      );
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleArtifact = (id: string) => {
    setExpandedArtifacts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const quickActions = [
    { text: "Create a product launch campaign", icon: "🎯" },
    { text: "Write a Twitter thread about our brand", icon: "✍️" },
    { text: "Analyze our content performance", icon: "📊" },
  ];

  return (
    <div className="flex h-full bg-black rounded-2xl overflow-hidden border border-neutral-800">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-2xl border border-indigo-500/30">
                  🎼
                </div>
                <div className="absolute -bottom-1 -right-1 flex -space-x-1">
                  <span className="w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center text-[10px] border border-neutral-700">🎯</span>
                  <span className="w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center text-[10px] border border-neutral-700">✍️</span>
                  <span className="w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center text-[10px] border border-neutral-700">📊</span>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  Conductor
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-normal">
                    Orchestrator
                  </span>
                </h2>
                <p className="text-sm text-neutral-400">
                  Intelligent routing for {brandDNA.name}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowWorkflowPanel(!showWorkflowPanel)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showWorkflowPanel 
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {showWorkflowPanel ? 'Hide' : 'Show'} Workflow
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                expandedArtifacts={expandedArtifacts}
                onToggleArtifact={toggleArtifact}
              />
            ))}
          </AnimatePresence>

          {/* Loading */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-lg border border-indigo-500/30">
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  🎼
                </motion.span>
              </div>
              <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl rounded-tl-sm border border-neutral-800 px-4 py-3">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="flex gap-1"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="w-2 h-2 rounded-full bg-pink-400" />
                  </motion.div>
                  <span className="text-neutral-400 text-sm">Orchestrating...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 2 && !isLoading && (
          <div className="px-6 pb-4">
            <p className="text-xs text-neutral-500 mb-2">Quick actions:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action.text)}
                  className="text-sm px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-300 hover:border-indigo-500/50 hover:text-white transition-colors flex items-center gap-2"
                >
                  <span>{action.icon}</span>
                  {action.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-800 bg-neutral-950/50">
          {pendingApproval && (
            <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm flex items-center gap-2">
              <span>⏸️</span>
              <span>Awaiting your approval to continue. Type "yes" to proceed or "no" to pause.</span>
            </div>
          )}
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell the Conductor what you need..."
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 resize-none focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 shadow-lg shadow-indigo-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Workflow Panel */}
      <AnimatePresence>
        {showWorkflowPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-l border-neutral-800 bg-neutral-950/50 overflow-hidden"
          >
            <div className="w-80 h-full flex flex-col">
              <div className="px-4 py-3 border-b border-neutral-800">
                <h3 className="text-sm font-medium text-white">Workflow Status</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {currentWorkflow ? (
                  <WorkflowPanel workflow={currentWorkflow} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center text-2xl mb-4 border border-neutral-800">
                      🎼
                    </div>
                    <p className="text-neutral-400 text-sm mb-2">No active workflow</p>
                    <p className="text-neutral-500 text-xs">
                      Start a conversation and I'll create a workflow to track progress.
                    </p>
                  </div>
                )}
              </div>

              {/* Agent Legend */}
              <div className="p-4 border-t border-neutral-800">
                <p className="text-xs text-neutral-500 mb-2">Available Agents</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['campaign', 'content', 'analytics'] as AgentName[]).map((agent) => {
                    const persona = agentPersonas[agent];
                    return (
                      <div
                        key={agent}
                        className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-center"
                      >
                        <span className="text-lg">{persona.avatar}</span>
                        <p className="text-[10px] text-neutral-400 mt-1">{persona.displayName}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== MESSAGE BUBBLE COMPONENT =====

function MessageBubble({
  message,
  expandedArtifacts,
  onToggleArtifact,
}: {
  message: ConductorMessage;
  expandedArtifacts: Set<string>;
  onToggleArtifact: (id: string) => void;
}) {
  const isUser = message.role === 'user';
  const isConductor = message.role === 'conductor';
  const isAgent = message.role === 'agent';

  const getAvatar = () => {
    if (isUser) return null;
    if (isConductor) return '🎼';
    if (isAgent && message.metadata?.agentName) {
      return agentPersonas[message.metadata.agentName].avatar;
    }
    return '🤖';
  };

  const getAccentColor = () => {
    if (isConductor) return 'rgb(99, 102, 241)'; // indigo
    if (isAgent && message.metadata?.agentName) {
      return agentPersonas[message.metadata.agentName].accentColor;
    }
    return 'rgb(99, 102, 241)';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[85%] ${isUser ? '' : 'flex gap-3'}`}>
        {/* Avatar */}
        {!isUser && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border"
            style={{ 
              backgroundColor: `${getAccentColor()}20`,
              borderColor: `${getAccentColor()}30`,
            }}
          >
            {getAvatar()}
          </div>
        )}

        {/* Message Content */}
        <div
          className={`${
            isUser
              ? 'bg-neutral-800 rounded-2xl rounded-br-sm'
              : 'bg-neutral-900/80 backdrop-blur-sm rounded-2xl rounded-tl-sm border border-neutral-800 flex-1'
          }`}
        >
          {/* Intent badge for assistant messages */}
          {!isUser && message.metadata?.intentClassification && (
            <div className="px-4 pt-2">
              <span 
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                style={{ 
                  backgroundColor: `${getAccentColor()}15`,
                  color: getAccentColor(),
                }}
              >
                <span>Intent: {message.metadata.intentClassification.type}</span>
                <span className="opacity-60">
                  ({Math.round(message.metadata.intentClassification.confidence * 100)}%)
                </span>
              </span>
            </div>
          )}

          {/* Message text */}
          <div className="px-4 py-3">
            <div className="text-neutral-100 whitespace-pre-wrap text-sm leading-relaxed">
              {formatMessage(message.content)}
            </div>
          </div>

          {/* Artifacts */}
          {message.metadata?.artifacts && message.metadata.artifacts.length > 0 && (
            <div className="px-4 pb-3 space-y-2">
              {message.metadata.artifacts.map((artifact, idx) => (
                <ArtifactCard
                  key={`${message.id}-artifact-${idx}`}
                  artifact={artifact}
                  isExpanded={expandedArtifacts.has(`${message.id}-${idx}`)}
                  onToggle={() => onToggleArtifact(`${message.id}-${idx}`)}
                  accentColor={getAccentColor()}
                />
              ))}
            </div>
          )}

          {/* Metadata footer */}
          {!isUser && message.metadata?.processingTime && (
            <div className="px-4 pb-2 flex items-center gap-3 text-xs text-neutral-500">
              <span>{(message.metadata.processingTime / 1000).toFixed(1)}s</span>
              {message.metadata.confidence && (
                <span>
                  {Math.round(message.metadata.confidence * 100)}% confidence
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ===== WORKFLOW PANEL COMPONENT =====

function WorkflowPanel({ workflow }: { workflow: WorkflowPlan }) {
  const getStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return 'text-emerald-400';
      case 'in_progress': return 'text-amber-400';
      case 'failed': return 'text-red-400';
      case 'skipped': return 'text-neutral-500';
      default: return 'text-neutral-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Workflow header */}
      <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wide">
            {workflow.type}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            workflow.status === 'completed' 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : workflow.status === 'executing'
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-neutral-800 text-neutral-400'
          }`}>
            {workflow.status}
          </span>
        </div>
        <h4 className="text-white font-medium">{workflow.name}</h4>
        <p className="text-neutral-400 text-xs mt-1">{workflow.description}</p>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        <p className="text-xs text-neutral-500 uppercase tracking-wide">Steps</p>
        {workflow.steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-3 rounded-lg border ${
              step.status === 'in_progress'
                ? 'bg-amber-500/10 border-amber-500/30'
                : step.status === 'completed'
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-neutral-900/50 border-neutral-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`text-lg ${getStatusColor(step.status)}`}>
                {getWorkflowStatusEmoji(step.status)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {getAgentEmoji(step.agentName)}
                  </span>
                  <span className="text-xs text-neutral-400 capitalize">
                    {step.agentName}
                  </span>
                  {step.checkpoint && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                      checkpoint
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-300 mt-1">{step.action}</p>
                {step.duration && (
                  <p className="text-xs text-neutral-500 mt-1">
                    {(step.duration / 1000).toFixed(1)}s
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ===== ARTIFACT CARD COMPONENT =====

function ArtifactCard({
  artifact,
  isExpanded,
  onToggle,
  accentColor,
}: {
  artifact: ConductorArtifact;
  isExpanded: boolean;
  onToggle: () => void;
  accentColor: string;
}) {
  const getIcon = () => {
    switch (artifact.type) {
      case 'workflow-plan': return '🎼';
      case 'campaign-plan': return '🎯';
      case 'content': return '📝';
      case 'analytics-report': return '📊';
      case 'checkpoint': return '⏸️';
      case 'summary': return '📋';
      default: return '📄';
    }
  };

  return (
    <div 
      className="rounded-xl border overflow-hidden" 
      style={{ borderColor: `${accentColor}30` }}
    >
      <button
        onClick={onToggle}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-neutral-800/50 transition-colors"
        style={{ backgroundColor: `${accentColor}08` }}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-neutral-200">
          <span>{getIcon()}</span>
          {artifact.title}
        </span>
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-neutral-900/50 text-sm max-h-80 overflow-y-auto">
              <pre className="text-neutral-300 whitespace-pre-wrap overflow-x-auto font-mono text-xs">
                {typeof artifact.data === 'string'
                  ? artifact.data
                  : JSON.stringify(artifact.data, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== HELPERS =====

function formatMessage(content: string): React.ReactNode {
  // Split by ** for bold and process
  const parts = content.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => 
    i % 2 === 1 ? <strong key={i} className="font-semibold text-white">{part}</strong> : part
  );
}




