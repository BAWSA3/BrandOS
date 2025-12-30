'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatMessage, 
  ChatArtifact,
  createChatMessage,
  getAgentPersona,
  getAllAgentPersonas,
} from '@/lib/agents/chat.types';
import { AgentName } from '@/lib/agents/types';
import { RoutingDecision } from '@/lib/agents/conductor';
import { BrandDNA } from '@/lib/types';

interface UnifiedChatProps {
  brandDNA: BrandDNA;
  brandId: string;
}

interface EnhancedMessage extends ChatMessage {
  agentName?: AgentName;
  routing?: RoutingDecision;
}

export default function UnifiedChat({ brandDNA, brandId }: UnifiedChatProps) {
  const [messages, setMessages] = useState<EnhancedMessage[]>([
    {
      ...createChatMessage(
        'assistant',
        `Hey! I'm your AI assistant for **${brandDNA.name}**. I can help you with:\n\n🎯 **Campaign Planning** — Marketing strategies, content calendars, launch plans\n✍️ **Content Creation** — Social posts, emails, headlines for any platform\n📊 **Analytics** — Performance insights and optimization recommendations\n\nJust tell me what you need, and I'll route you to the right specialist!`
      ),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AgentName | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [expandedArtifacts, setExpandedArtifacts] = useState<Set<string>>(new Set());
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
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: EnhancedMessage = {
      ...createChatMessage('user', input.trim()),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsRouting(true);

    try {
      // Call the unified chat API with auto-routing
      const response = await fetch('/api/agents/chat/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandDNA,
          brandId,
          message: input.trim(),
          history: messages.slice(-10),
          currentAgent, // Pass current agent for context continuity
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      setIsRouting(false);
      setCurrentAgent(data.agent);

      const assistantMessage: EnhancedMessage = {
        ...createChatMessage('assistant', data.content, {
          artifacts: data.artifacts,
          confidence: data.confidence,
          processingTime: data.processingTime,
        }),
        agentName: data.agent,
        routing: data.routing,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setIsRouting(false);
      const errorMessage: EnhancedMessage = {
        ...createChatMessage(
          'assistant',
          "I'm having trouble processing that right now. Could you try again?"
        ),
      };
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

  const handleExampleClick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const examplePrompts = [
    { text: "Create a launch campaign for our new feature", agent: "campaign" as AgentName },
    { text: "Write a Twitter thread about brand consistency", agent: "content" as AgentName },
    { text: "What content performs best on LinkedIn?", agent: "analytics" as AgentName },
  ];

  return (
    <div className="flex flex-col h-full bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-800 bg-gradient-to-r from-violet-500/10 via-emerald-500/10 to-amber-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {getAllAgentPersonas().map((persona) => (
                <div
                  key={persona.name}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-neutral-950 transition-all ${
                    currentAgent === persona.name 
                      ? 'ring-2 ring-offset-2 ring-offset-neutral-950 z-10' 
                      : 'opacity-60'
                  }`}
                  style={{ 
                    backgroundColor: `${persona.accentColor}30`,
                    ringColor: currentAgent === persona.name ? persona.accentColor : undefined,
                  }}
                >
                  {persona.avatar}
                </div>
              ))}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
              <p className="text-sm text-neutral-400">
                {currentAgent 
                  ? `${getAgentPersona(currentAgent).displayName} is helping`
                  : 'Auto-routes to the right specialist'}
              </p>
            </div>
          </div>

          {currentAgent && (
            <button
              onClick={() => setCurrentAgent(null)}
              className="text-xs px-3 py-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              Reset context
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${message.role === 'user' ? '' : 'flex gap-3'}`}>
                {/* Agent avatar for assistant messages */}
                {message.role === 'assistant' && message.agentName && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={{ 
                      backgroundColor: `${getAgentPersona(message.agentName).accentColor}20` 
                    }}
                  >
                    {getAgentPersona(message.agentName).avatar}
                  </div>
                )}

                <div
                  className={`${
                    message.role === 'user'
                      ? 'bg-neutral-800 rounded-2xl rounded-br-sm'
                      : 'bg-neutral-900 rounded-2xl rounded-bl-sm border border-neutral-800 flex-1'
                  }`}
                >
                  {/* Routing indicator */}
                  {message.routing && message.routing.confidence < 0.9 && (
                    <div 
                      className="px-4 pt-2 text-xs flex items-center gap-1"
                      style={{ color: getAgentPersona(message.agentName!).accentColor }}
                    >
                      <span>→</span>
                      <span>Routed to {getAgentPersona(message.agentName!).displayName}</span>
                    </div>
                  )}

                  <div className="px-4 py-3">
                    <p className="text-neutral-100 whitespace-pre-wrap">
                      {formatMessage(message.content)}
                    </p>
                  </div>

                  {/* Artifacts */}
                  {message.metadata?.artifacts && message.metadata.artifacts.length > 0 && (
                    <div className="px-4 pb-3 space-y-2">
                      {message.metadata.artifacts.map((artifact, idx) => (
                        <ArtifactCard
                          key={`${message.id}-artifact-${idx}`}
                          artifact={artifact}
                          isExpanded={expandedArtifacts.has(`${message.id}-${idx}`)}
                          onToggle={() => toggleArtifact(`${message.id}-${idx}`)}
                          accentColor={
                            message.agentName 
                              ? getAgentPersona(message.agentName).accentColor 
                              : '#8B5CF6'
                          }
                        />
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  {message.role === 'assistant' && message.metadata?.processingTime && (
                    <div className="px-4 pb-2 text-xs text-neutral-500">
                      {(message.metadata.processingTime / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading / Routing indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
                {isRouting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-neutral-600 border-t-white rounded-full"
                  />
                ) : currentAgent ? (
                  getAgentPersona(currentAgent).avatar
                ) : (
                  '🤔'
                )}
              </div>
              <div className="bg-neutral-900 rounded-2xl rounded-bl-sm border border-neutral-800 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-sm">
                    {isRouting 
                      ? 'Finding the right specialist...' 
                      : `${currentAgent ? getAgentPersona(currentAgent).displayName : 'Assistant'} is thinking...`}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Example prompts */}
      {messages.length <= 2 && (
        <div className="px-6 pb-4">
          <p className="text-xs text-neutral-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((prompt, idx) => {
              const persona = getAgentPersona(prompt.agent);
              return (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(prompt.text)}
                  className="text-sm px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:text-white transition-colors flex items-center gap-2"
                >
                  <span 
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                    style={{ backgroundColor: `${persona.accentColor}30` }}
                  >
                    {persona.avatar}
                  </span>
                  {prompt.text}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-800">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about marketing, content, or analytics..."
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 resize-none focus:outline-none focus:border-neutral-600 transition-colors"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 to-emerald-600 text-white hover:from-violet-500 hover:to-emerald-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-neutral-500 mt-2 text-center">
          I'll automatically route you to Campaign 🎯, Content ✍️, or Analytics 📊
        </p>
      </form>
    </div>
  );
}

// Format message with basic markdown
function formatMessage(content: string): React.ReactNode {
  // Split by ** for bold
  const parts = content.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => 
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  );
}

// Artifact Card Component
function ArtifactCard({
  artifact,
  isExpanded,
  onToggle,
  accentColor,
}: {
  artifact: ChatArtifact;
  isExpanded: boolean;
  onToggle: () => void;
  accentColor: string;
}) {
  const getIcon = () => {
    switch (artifact.type) {
      case 'campaign-plan': return '🎯';
      case 'content': return '📝';
      case 'analytics-report': return '📊';
      case 'content-ideas': return '💡';
      case 'quick-check': return '⚡';
      default: return '📄';
    }
  };

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: `${accentColor}30` }}>
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-neutral-800/50 transition-colors"
        style={{ backgroundColor: `${accentColor}10` }}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-neutral-200">
          <span>{getIcon()}</span>
          {artifact.title}
        </span>
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
            <div className="p-3 bg-neutral-900/50 text-sm max-h-96 overflow-y-auto">
              <pre className="text-neutral-300 whitespace-pre-wrap overflow-x-auto">
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





