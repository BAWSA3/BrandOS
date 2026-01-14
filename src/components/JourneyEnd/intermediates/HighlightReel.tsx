'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { JourneyEndData } from '../index';

interface HighlightReelProps {
  data: JourneyEndData;
  onContinue: () => void;
  theme: string;
}

// Score color helper
function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#0047FF';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

// Get percentile approximation
function getPercentile(score: number): string {
  if (score >= 90) return 'top 5%';
  if (score >= 80) return 'top 15%';
  if (score >= 70) return 'top 30%';
  if (score >= 60) return 'top 45%';
  return 'top 60%';
}

export default function HighlightReel({
  data,
  onContinue,
  theme,
}: HighlightReelProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const scoreColor = getScoreColor(data.score);
  const percentile = getPercentile(data.score);

  // Generate and copy shareable image
  const handleCopyImage = useCallback(async () => {
    setIsGenerating(true);
    try {
      // Create a canvas for the shareable image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 1200;
      canvas.height = 630;

      // Background
      ctx.fillStyle = '#0F1115';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Accent gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, `${scoreColor}20`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 32px "Helvetica Neue", Arial, sans-serif';
      ctx.fillText('My Brand Highlights', 60, 80);

      // Score
      ctx.fillStyle = scoreColor;
      ctx.font = 'bold 120px "Helvetica Neue", Arial, sans-serif';
      ctx.fillText(String(data.score), 60, 220);

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '24px "Helvetica Neue", Arial, sans-serif';
      ctx.fillText(`BRAND SCORE (${percentile})`, 60, 260);

      // Archetype
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px "Helvetica Neue", Arial, sans-serif';
      ctx.fillText(data.archetype, 60, 350);

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '20px "Helvetica Neue", Arial, sans-serif';
      ctx.fillText(data.personalityType, 60, 390);

      // Best phase
      if (data.bestPhase.diff > 0) {
        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 32px "Helvetica Neue", Arial, sans-serif';
        ctx.fillText(`+${data.bestPhase.diff} vs avg`, 60, 480);

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '20px "Helvetica Neue", Arial, sans-serif';
        ctx.fillText(`${data.bestPhase.name.toUpperCase()} PHASE`, 60, 520);
      }

      // Branding
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '18px "Helvetica Neue", Arial, sans-serif';
      ctx.fillText('brandos.xyz', 60, 590);

      // Convert and copy
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );

      if (blob && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      }
    } catch (error) {
      console.error('Failed to copy image:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [data, scoreColor, percentile]);

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
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{
          background: '#0F1115',
          borderRadius: '24px',
          padding: '32px',
          maxWidth: '420px',
          width: '100%',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: `
            0 0 60px ${scoreColor}20,
            0 25px 50px rgba(0,0,0,0.5)
          `,
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.2em',
            color: scoreColor,
            marginBottom: '24px',
          }}
        >
          YOUR BRAND HIGHLIGHTS
        </motion.div>

        {/* Highlight Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Score */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${scoreColor}, ${scoreColor}99)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', sans-serif",
                fontSize: '28px',
                fontWeight: 800,
                color: '#FFFFFF',
              }}
            >
              {data.score}
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                }}
              >
                Brand Score
              </div>
              <div
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: '2px',
                }}
              >
                {percentile.toUpperCase()}
              </div>
            </div>
          </motion.div>

          {/* Archetype */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #E8C49A 0%, #D4A574 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
              }}
            >
              {data.archetypeEmoji || '🧬'}
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                }}
              >
                {data.archetype}
              </div>
              <div
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: '2px',
                }}
              >
                {data.personalityType}
              </div>
            </div>
          </motion.div>

          {/* Best Phase */}
          {data.bestPhase.diff > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#10B981',
                }}
              >
                +{data.bestPhase.diff}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                  }}
                >
                  {data.bestPhase.name} Phase
                </div>
                <div
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: '2px',
                  }}
                >
                  ABOVE AVERAGE
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '32px',
          }}
        >
          {/* Copy Image Button */}
          <motion.button
            onClick={handleCopyImage}
            disabled={isGenerating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: isCopied ? '#10B981' : 'rgba(255,255,255,0.8)',
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.08em',
              cursor: isGenerating ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isGenerating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#FFFFFF',
                  borderRadius: '50%',
                }}
              />
            ) : isCopied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                COPIED!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                COPY IMAGE
              </>
            )}
          </motion.button>

          {/* Claim Button */}
          <motion.button
            onClick={onContinue}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            style={{
              flex: 1.5,
              padding: '14px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #E8C49A 0%, #D4A574 100%)',
              color: '#050505',
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(212, 165, 116, 0.4)',
              fontWeight: 600,
            }}
          >
            CLAIM YOUR BRAND DNA
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Toast notification */}
      <AnimatePresence>
        {isCopied && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{
              position: 'fixed',
              bottom: '32px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '14px 24px',
              background: '#10B981',
              borderRadius: '12px',
              color: '#FFFFFF',
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Image copied! Paste in your X post
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
