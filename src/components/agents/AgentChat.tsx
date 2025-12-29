'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatMessage, 
  AgentPersona, 
  ChatArtifact,
  createChatMessage 
} from '@/lib/agents/chat.types';
import { AgentName } from '@/lib/agents/types';

interface AgentChatProps {
  persona: AgentPersona;
  brandId: string;
  initialMessages?: ChatMessage[];
  onSendMessage?: (message: string) => Promise<{
    content: string;
    artifacts?: ChatArtifact[];
  }>;
}

export default function AgentChat({
  persona,
  brandId,
  initialMessages = [],
  onSendMessage,
}: AgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.length > 0
      ? initialMessages
      : [
          createChatMessage(
            'assistant',
            `Hey! I'm ${persona.displayName}, your ${persona.title}. ${persona.description}\n\nHow can I help you today?`
          ),
        ]
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedArtifacts, setExpandedArtifacts] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
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

    const userMessage = createChatMessage('user', input.trim());
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (onSendMessage) {
        const response = await onSendMessage(input.trim());
        const assistantMessage = createChatMessage('assistant', response.content, {
          artifacts: response.artifacts,
        });
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Default API call
        const response = await fetch('/api/agents/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentName: persona.name,
            brandId,
            message: input.trim(),
            history: messages.slice(-10), // Last 10 messages for context
          }),
        });

        if (!response.ok) throw new Error('Failed to get response');

        const data = await response.json();
        const assistantMessage = createChatMessage('assistant', data.content, {
          artifacts: data.artifacts,
          confidence: data.confidence,
          processingTime: data.processingTime,
        });
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMessage = createChatMessage(
        'assistant',
        "I'm having trouble processing that right now. Could you try again?"
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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExampleClick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800">
      {/* Header */}
      <div 
        className="px-6 py-4 border-b border-neutral-800 flex items-center gap-4"
        style={{ backgroundColor: `${persona.accentColor}10` }}
      >
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${persona.accentColor}20` }}
        >
          {persona.avatar}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            {persona.displayName}
            <span 
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ 
                backgroundColor: `${persona.accentColor}20`,
                color: persona.accentColor 
              }}
            >
              {persona.title}
            </span>
          </h2>
          <p className="text-sm text-neutral-400">{persona.description}</p>
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
              <div
                className={`max-w-[85%] ${
                  message.role === 'user'
                    ? 'bg-neutral-800 rounded-2xl rounded-br-sm'
                    : 'bg-neutral-900 rounded-2xl rounded-bl-sm border border-neutral-800'
                }`}
              >
                <div className="px-4 py-3">
                  <p className="text-neutral-100 whitespace-pre-wrap">{message.content}</p>
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
                        accentColor={persona.accentColor}
                      />
                    ))}
                  </div>
                )}

                {/* Metadata */}
                {message.role === 'assistant' && message.metadata?.processingTime && (
                  <div className="px-4 pb-2 text-xs text-neutral-500">
                    {(message.metadata.processingTime / 1000).toFixed(1)}s
                    {message.metadata.confidence && (
                      <span className="ml-2">
                        • {Math.round(message.metadata.confidence * 100)}% confidence
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-neutral-900 rounded-2xl rounded-bl-sm border border-neutral-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: persona.accentColor }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
                <span className="text-neutral-400 text-sm">
                  {persona.displayName} is thinking...
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Example prompts (show when few messages) */}
      {messages.length <= 2 && (
        <div className="px-6 pb-4">
          <p className="text-xs text-neutral-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {persona.examplePrompts.slice(0, 3).map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(prompt)}
                className="text-sm px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:text-white transition-colors"
              >
                {prompt}
              </button>
            ))}
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
              placeholder={`Message ${persona.displayName}...`}
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 resize-none focus:outline-none focus:border-neutral-600 transition-colors"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: input.trim() ? persona.accentColor : 'rgb(38 38 38)',
              color: input.trim() ? 'white' : 'rgb(115 115 115)',
            }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <p className="text-xs text-neutral-500 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
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
      case 'campaign-plan':
        return '🎯';
      case 'content':
        return '📝';
      case 'analytics-report':
        return '📊';
      case 'content-ideas':
        return '💡';
      case 'quick-check':
        return '⚡';
      default:
        return '📄';
    }
  };

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: `${accentColor}30` }}
    >
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
          className={`w-4 h-4 text-neutral-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
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
            <div className="p-3 bg-neutral-900/50 text-sm">
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

