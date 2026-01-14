'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Issue {
  title: string;
  impact: number; // Potential score increase
  severity: 'high' | 'medium' | 'low';
}

interface ActionFirstProps {
  children: ReactNode;
  topOpportunity?: Issue;
  totalPotentialGain?: number;
  onViewFull?: () => void;
}

export default function ActionFirst({
  children,
  topOpportunity = {
    title: 'Add a clear call-to-action in bio',
    impact: 12,
    severity: 'high',
  },
  totalPotentialGain = 18,
  onViewFull,
}: ActionFirstProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  const handleExpand = () => {
    setShowBanner(false);
    setIsExpanded(true);
    onViewFull?.();
  };

  const getSeverityColor = (severity: Issue['severity']) => {
    switch (severity) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Top Opportunity Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 100,
              background: 'linear-gradient(135deg, #0F1115 0%, #1a1a1a 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              padding: '16px 24px',
            }}
          >
            <div
              style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              {/* Left side - Opportunity info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Severity indicator */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `${getSeverityColor(topOpportunity.severity)}20`,
                    border: `1px solid ${getSeverityColor(topOpportunity.severity)}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={getSeverityColor(topOpportunity.severity)}
                    strokeWidth="2"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>

                <div>
                  <div
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      color: getSeverityColor(topOpportunity.severity),
                      marginBottom: '4px',
                    }}
                  >
                    YOUR TOP OPPORTUNITY
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#FFFFFF',
                    }}
                  >
                    {topOpportunity.title}
                  </div>
                </div>
              </div>

              {/* Center - Potential gain */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#10B981',
                  }}
                >
                  +{topOpportunity.impact}
                </span>
                <span
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  POTENTIAL POINTS
                </span>
              </div>

              {/* Right side - Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <motion.button
                  onClick={handleExpand}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.8)',
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                  }}
                >
                  VIEW FULL DASHBOARD
                </motion.button>
                <motion.button
                  onClick={() => setShowBanner(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#10B981',
                    color: '#FFFFFF',
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  FIX THIS NOW
                </motion.button>
              </div>
            </div>

            {/* Total potential indicator */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: `${(totalPotentialGain / 30) * 100}%` }}
              transition={{ delay: 0.5, duration: 0.8 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '2px',
                background: 'linear-gradient(90deg, #10B981, #059669)',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard content with padding for banner */}
      <motion.div
        animate={{
          paddingTop: showBanner ? '100px' : '0px',
        }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>

      {/* Floating action button when banner is hidden */}
      <AnimatePresence>
        {!showBanner && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowBanner(true)}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 100,
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              border: 'none',
              background: '#10B981',
              color: '#FFFFFF',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
