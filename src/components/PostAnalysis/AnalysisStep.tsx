'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AnalysisParameter {
  id: string;
  label: string;
  value: string | number;
  explanation: string;
  status: 'positive' | 'neutral' | 'needs-work';
  details?: string[];
}

export interface AnalysisStepData {
  phase: 'define' | 'check' | 'generate' | 'scale';
  title: string;
  subtitle: string;
  parameters: AnalysisParameter[];
  insight: string;
  actionItem?: string;
}

interface AnalysisStepProps {
  data: AnalysisStepData;
  isActive: boolean;
  isCompleted: boolean;
  onComplete: () => void;
  stepNumber: number;
  totalSteps: number;
}

const PHASE_COLORS = {
  define: '#E8A838',
  check: '#10B981',
  generate: '#9D4EDD',
  scale: '#0047FF',
};

const PHASE_ICONS = {
  define: '◈',
  check: '✓',
  generate: '⚡',
  scale: '↗',
};

function TerminalTypewriter({
  text,
  speed = 20,
  onComplete
}: {
  text: string;
  speed?: number;
  onComplete?: () => void;
}) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <>
      {displayText}
      {currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.4, repeat: Infinity }}
          style={{ color: PHASE_COLORS.scale }}
        >
          _
        </motion.span>
      )}
    </>
  );
}

function ParameterCard({ param, index }: { param: AnalysisParameter; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const statusColors = {
    positive: '#10B981',
    neutral: '#F59E0B',
    'needs-work': '#EF4444',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.15, duration: 0.4 }}
      style={{
        background: 'rgba(0, 0, 0, 0.02)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: '14px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: statusColors[param.status],
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.1em',
                color: 'rgba(0, 0, 0, 0.5)',
              }}
            >
              {param.label}
            </span>
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#000',
              fontFamily: "'Helvetica Neue', sans-serif",
            }}
          >
            {param.value}
          </div>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          style={{
            fontSize: '12px',
            color: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '0 16px 16px',
                borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                marginTop: '-1px',
                paddingTop: '14px',
              }}
            >
              <p
                style={{
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: 'rgba(0, 0, 0, 0.7)',
                  margin: '0 0 10px 0',
                }}
              >
                {param.explanation}
              </p>
              {param.details && param.details.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {param.details.map((detail, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        fontSize: '12px',
                        color: 'rgba(0, 0, 0, 0.6)',
                      }}
                    >
                      <span style={{ color: statusColors[param.status] }}>→</span>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AnalysisStep({
  data,
  isActive,
  isCompleted,
  onComplete,
  stepNumber,
  totalSteps,
}: AnalysisStepProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(isCompleted);
  const [showParameters, setShowParameters] = useState(isCompleted);
  const [showInsight, setShowInsight] = useState(isCompleted);

  const phaseColor = PHASE_COLORS[data.phase];
  const phaseIcon = PHASE_ICONS[data.phase];

  // Handle when step becomes active
  useEffect(() => {
    if (isActive && !isCompleted && !analysisComplete) {
      // Start analysis animation
      setIsAnalyzing(true);
      const timer = setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisComplete(true);
        setShowParameters(true);
      }, 1500); // Reduced from 2000ms
      return () => clearTimeout(timer);
    }
  }, [isActive, isCompleted, analysisComplete]);

  // Handle when step is completed externally
  useEffect(() => {
    if (isCompleted) {
      setAnalysisComplete(true);
      setShowParameters(true);
      setShowInsight(true);
    }
  }, [isCompleted]);

  // Show insight after parameters appear
  useEffect(() => {
    if (showParameters && !showInsight && !isCompleted) {
      const paramCount = data?.parameters?.length || 3;
      const timer = setTimeout(() => {
        setShowInsight(true);
      }, paramCount * 100 + 300);
      return () => clearTimeout(timer);
    }
  }, [showParameters, showInsight, isCompleted, data?.parameters?.length]);

  if (!isActive && !isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        style={{
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.02)',
          borderRadius: '6px',
          border: '1px dashed rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '12px',
              color: phaseColor,
            }}
          >
            {phaseIcon}
          </span>
          <span
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.1em',
              color: 'rgba(0, 0, 0, 0.4)',
            }}
          >
            {data.phase.toUpperCase()}: {data.title}
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              color: 'rgba(0, 0, 0, 0.3)',
            }}
          >
            LOCKED
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0, 0, 0, 0.12)',
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: isActive ? '0 4px 20px rgba(0, 0, 0, 0.08)' : 'none',
      }}
    >
      {/* Step header */}
      <div
        style={{
          padding: '14px 18px',
          background: `${phaseColor}08`,
          borderBottom: `1px solid ${phaseColor}20`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '4px',
            background: phaseColor,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '12px',
          }}
        >
          {isCompleted ? '✓' : stepNumber}
        </span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.12em',
              color: phaseColor,
              marginBottom: '2px',
            }}
          >
            {data.phase.toUpperCase()} PHASE
          </div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#000',
            }}
          >
            {data.title}
          </div>
        </div>
        <span
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '10px',
            color: 'rgba(0, 0, 0, 0.4)',
          }}
        >
          {stepNumber}/{totalSteps}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '18px' }}>
        {/* Subtitle */}
        <p
          style={{
            fontSize: '14px',
            lineHeight: 1.6,
            color: 'rgba(0, 0, 0, 0.6)',
            margin: '0 0 16px 0',
            fontStyle: 'italic',
          }}
        >
          {data.subtitle}
        </p>

        {/* Analyzing state */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              padding: '24px',
              background: 'rgba(0, 0, 0, 0.02)',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '11px',
                color: phaseColor,
                marginBottom: '12px',
              }}
            >
              <TerminalTypewriter text={`> Running ${data.phase}.analyze()...`} speed={30} />
            </div>
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                color: 'rgba(0, 0, 0, 0.4)',
              }}
            >
              Processing parameters...
            </motion.div>
          </motion.div>
        )}

        {/* Parameters */}
        {showParameters && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {data.parameters.map((param, i) => (
              <ParameterCard key={param.id} param={param} index={i} />
            ))}
          </div>
        )}

        {/* Insight */}
        <AnimatePresence>
          {showInsight && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                padding: '16px',
                background: `${phaseColor}08`,
                border: `1px solid ${phaseColor}20`,
                borderRadius: '4px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  color: phaseColor,
                  marginBottom: '8px',
                }}
              >
                KEY INSIGHT
              </div>
              <p
                style={{
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: '#000',
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                {data.insight}
              </p>
              {data.actionItem && (
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: `1px solid ${phaseColor}15`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <span style={{ color: '#10B981', fontSize: '12px' }}>→</span>
                  <span
                    style={{
                      fontSize: '13px',
                      color: 'rgba(0, 0, 0, 0.7)',
                    }}
                  >
                    <strong>Action:</strong> {data.actionItem}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue button */}
        {showInsight && !isCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={onComplete}
              style={{
                width: '100%',
                padding: '16px 20px',
                background: phaseColor,
                border: 'none',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <span
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  color: '#fff',
                }}
              >
                {stepNumber < totalSteps ? 'CONTINUE TO NEXT PHASE' : 'COMPLETE ANALYSIS'}
              </span>
              <span style={{ color: '#fff' }}>
                →
              </span>
            </button>
          </motion.div>
        )}

        {/* Completed state */}
        {isCompleted && (
          <div
            style={{
              padding: '12px',
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ color: '#10B981' }}>✓</span>
            <span
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.08em',
                color: '#10B981',
              }}
            >
              PHASE COMPLETE
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
