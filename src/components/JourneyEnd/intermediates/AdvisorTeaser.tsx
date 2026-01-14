'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import type { JourneyEndData } from '../index';

interface AdvisorTeaserProps {
  data: JourneyEndData;
  onContinue: () => void;
  onAskMore: () => void;
  theme: string;
}

// Generate a personalized insight based on the data
function generateInsight(data: JourneyEndData): string {
  const insights = [
    `Your ${data.archetype.toLowerCase()} energy combined with a ${data.score}+ brand score suggests you're ready to scale. But here's what most people miss...`,
    `As a ${data.personalityType}, your natural communication style is ${data.score >= 70 ? 'already resonating' : 'showing potential'}. The key to amplification? Your unique blend of ${data.keywords.slice(0, 2).join(' and ')}...`,
    `Your ${data.bestPhase.name} phase score is ${data.bestPhase.diff > 0 ? 'significantly above average' : 'solid'}. This tells me something interesting about your positioning that most ${data.archetype.toLowerCase()}s overlook...`,
    `With keywords like "${data.keywords[0]}" defining your voice, you have an unusual opportunity. Most brands in your space sound identical. You don't.`,
    `Your voice profile suggests a ${data.score >= 75 ? 'highly consistent' : 'developing'} brand identity. Here's the insight: ${data.archetype}s who leverage this pattern typically see 3x engagement...`,
  ];

  // Pick one based on a hash of username for consistency
  const index = data.username.length % insights.length;
  return insights[index];
}

export default function AdvisorTeaser({
  data,
  onContinue,
  onAskMore,
  theme,
}: AdvisorTeaserProps) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [cursorVisible, setCursorVisible] = useState(true);

  const insight = generateInsight(data);

  // Typewriter effect
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < insight.length) {
        setDisplayText(insight.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [insight]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          background: '#0F1115',
          borderRadius: '24px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header with avatar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          {/* Advisor avatar */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            🧠
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                color: '#FFFFFF',
              }}
            >
              Brand Advisor
            </div>
            <div
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                color: '#8B5CF6',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10B981',
                  animation: 'pulse 2s infinite',
                }}
              />
              ANALYZING YOUR BRAND
            </div>
          </div>
        </motion.div>

        {/* Insight text with typewriter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.9)',
              margin: 0,
            }}
          >
            {displayText}
            {isTyping && (
              <span
                style={{
                  opacity: cursorVisible ? 1 : 0,
                  color: '#8B5CF6',
                  fontWeight: 600,
                }}
              >
                |
              </span>
            )}
          </p>
        </motion.div>

        {/* Prompt */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: isTyping ? 0 : 1 }}
          transition={{ delay: 0.2 }}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '13px',
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          Want to explore this insight further?
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isTyping ? 0 : 1, y: isTyping ? 10 : 0 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'flex',
            gap: '12px',
          }}
        >
          {/* Ask More Button */}
          <motion.button
            onClick={onAskMore}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
              color: '#FFFFFF',
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            ASK MORE
          </motion.button>

          {/* Continue Button */}
          <motion.button
            onClick={onContinue}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.8)',
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.08em',
              cursor: 'pointer',
            }}
          >
            VIEW DASHBOARD
          </motion.button>
        </motion.div>

        {/* Decorative dots */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '24px',
          }}
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: isTyping ? [1, 1.2, 1] : 1,
                opacity: isTyping ? [0.5, 1, 0.5] : 0.3,
              }}
              transition={{
                duration: 1,
                repeat: isTyping ? Infinity : 0,
                delay: i * 0.2,
              }}
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: '#8B5CF6',
              }}
            />
          ))}
        </div>
      </motion.div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
