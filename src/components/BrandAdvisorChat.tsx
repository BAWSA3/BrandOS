'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GeneratedBrandDNA } from './BrandDNAPreview';
import {
  getWelcomeMessage,
  SUGGESTED_PROMPTS,
  WAITLIST_GATE_MESSAGE
} from '@/prompts/brand-advisor';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface BrandAdvisorChatProps {
  brandDNA: GeneratedBrandDNA;
  isOpen: boolean;
  onClose: () => void;
  onJoinWaitlist: () => void;
}

const FREE_MESSAGE_LIMIT = 3;

export default function BrandAdvisorChat({
  brandDNA,
  isOpen,
  onClose,
  onJoinWaitlist,
}: BrandAdvisorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [showWaitlistGate, setShowWaitlistGate] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize with welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: getWelcomeMessage(brandDNA),
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, brandDNA, messages.length]);

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

    // Check message limit
    if (messageCount >= FREE_MESSAGE_LIMIT) {
      setShowWaitlistGate(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/brand-advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandDNA,
          message: input.trim(),
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setMessageCount((prev) => prev + 1);

      // Check if limit reached after this message
      if (messageCount + 1 >= FREE_MESSAGE_LIMIT) {
        setTimeout(() => setShowWaitlistGate(true), 1500);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble processing that right now. Could you try again?",
        timestamp: Date.now(),
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

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="w-full max-w-2xl h-[80vh] max-h-[700px] bg-[#0a0a0a] rounded-2xl border border-neutral-800 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg">
                {brandDNA.archetypeEmoji || '🎯'}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Brand Advisor</h2>
                <p className="text-sm text-neutral-400">Personalized for your brand</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-violet-600 rounded-2xl rounded-br-sm'
                      : 'bg-neutral-900 rounded-2xl rounded-bl-sm border border-neutral-800'
                  }`}
                >
                  <div className="px-4 py-3">
                    <div
                      className="text-neutral-100 whitespace-pre-wrap prose prose-invert prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: formatMarkdown(message.content)
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}

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
                          className="w-2 h-2 rounded-full bg-violet-500"
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
                      Thinking...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Waitlist Gate */}
            {showWaitlistGate && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-violet-900/30 to-purple-900/30 rounded-2xl border border-violet-500/30 p-6 text-center"
              >
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {WAITLIST_GATE_MESSAGE.title}
                </h3>
                <p className="text-neutral-400 text-sm mb-4">
                  {WAITLIST_GATE_MESSAGE.subtitle}
                </p>
                <p className="text-neutral-300 text-sm mb-6">
                  {WAITLIST_GATE_MESSAGE.cta}
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={onJoinWaitlist}
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium text-white transition-colors"
                  >
                    Join Waitlist
                  </button>
                  <button
                    onClick={() => setShowWaitlistGate(false)}
                    className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-medium text-neutral-300 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts (show initially) */}
          {messages.length === 1 && !showWaitlistGate && (
            <div className="px-6 pb-4">
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedPrompt(item.prompt)}
                    className="text-sm px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-300 hover:border-violet-500/50 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
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
                  placeholder={showWaitlistGate ? "Join the waitlist to continue..." : "Ask your Brand Advisor..."}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 resize-none focus:outline-none focus:border-violet-500/50 transition-colors disabled:opacity-50"
                  rows={1}
                  disabled={isLoading || showWaitlistGate}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading || showWaitlistGate}
                className="px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-violet-600 hover:bg-violet-500 text-white"
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
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-neutral-500">
                Press Enter to send, Shift+Enter for new line
              </p>
              {messageCount > 0 && !showWaitlistGate && (
                <p className="text-xs text-neutral-500">
                  {FREE_MESSAGE_LIMIT - messageCount} message{FREE_MESSAGE_LIMIT - messageCount !== 1 ? 's' : ''} remaining
                </p>
              )}
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Simple markdown formatter for bold and bullet points
function formatMarkdown(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Bullet points
    .replace(/^• /gm, '<span class="text-violet-400 mr-1">•</span>')
    // Line breaks
    .replace(/\n/g, '<br />');
}
