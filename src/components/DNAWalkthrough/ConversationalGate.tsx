'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConversationalGateProps {
  /** The AI's message to the user */
  message: string;
  /** Optional subtext below the message */
  subtext?: string;
  /** Button label */
  buttonLabel: string;
  /** Called when user clicks through */
  onContinue: () => void;
  /** Delay before showing the message (typewriter start) */
  delay?: number;
  /** Whether this gate is visible/active */
  isActive?: boolean;
  /** Optional: show a small data point above the message */
  dataPoint?: { label: string; value: string | number };
}

function TypewriterText({
  text,
  speed = 25,
  onComplete
}: {
  text: string;
  speed?: number;
  onComplete?: () => void;
}) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, speed, onComplete, isComplete]);

  return (
    <>
      {displayText}
      {currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.4, repeat: Infinity }}
          style={{ color: '#0047FF' }}
        >
          |
        </motion.span>
      )}
    </>
  );
}

export default function ConversationalGate({
  message,
  subtext,
  buttonLabel,
  onContinue,
  delay = 0,
  isActive = true,
  dataPoint,
}: ConversationalGateProps) {
  const [showMessage, setShowMessage] = useState(false);
  const [messageComplete, setMessageComplete] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        setShowMessage(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isActive, delay]);

  useEffect(() => {
    if (messageComplete) {
      const timer = setTimeout(() => {
        setShowButton(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [messageComplete]);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      {/* Data point chip */}
      <AnimatePresence>
        {dataPoint && showMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              marginBottom: '24px',
              padding: '8px 16px',
              background: 'rgba(0, 71, 255, 0.06)',
              border: '1px solid rgba(0, 71, 255, 0.15)',
              borderRadius: '4px',
            }}
          >
            <span
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.1em',
                color: 'rgba(0, 0, 0, 0.5)',
              }}
            >
              {dataPoint.label}:
            </span>{' '}
            <span
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '12px',
                fontWeight: 600,
                color: '#0047FF',
              }}
            >
              {dataPoint.value}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main message */}
      <div
        style={{
          maxWidth: '500px',
          marginBottom: '16px',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(22px, 4vw, 32px)',
            fontWeight: 500,
            color: '#000',
            lineHeight: 1.4,
            margin: 0,
            fontFamily: "'Helvetica Neue', sans-serif",
            minHeight: '1.4em',
          }}
        >
          {showMessage && (
            <TypewriterText
              text={message}
              speed={20}
              onComplete={() => setMessageComplete(true)}
            />
          )}
        </h2>
      </div>

      {/* Subtext */}
      <AnimatePresence>
        {subtext && messageComplete && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              fontSize: '14px',
              color: 'rgba(0, 0, 0, 0.5)',
              maxWidth: '400px',
              lineHeight: 1.6,
              margin: '0 0 32px 0',
            }}
          >
            {subtext}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Continue button */}
      <AnimatePresence>
        {showButton && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onContinue}
            style={{
              padding: '16px 32px',
              background: '#0047FF',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#0038CC'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#0047FF'}
          >
            <span
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.12em',
                color: '#fff',
              }}
            >
              {buttonLabel}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
