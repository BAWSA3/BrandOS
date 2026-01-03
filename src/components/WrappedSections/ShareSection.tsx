'use client';

import { motion } from 'motion/react';
import CardPreviewSelector from '../CardPreviewSelector';
import { ShareCardData } from '../ShareCardPrototypes';

interface ShareSectionProps {
  data: ShareCardData;
  onAnalyzeAnother: () => void;
  onClaim: () => void;
}

export default function ShareSection({ data, onAnalyzeAnother, onClaim }: ShareSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(40px, 8vw, 60px) clamp(16px, 4vw, 24px) clamp(60px, 12vw, 100px)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Section Label */}
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{
          fontSize: '12px',
          fontFamily: "'VCR OSD Mono', monospace",
          letterSpacing: '0.15em',
          color: 'rgba(255, 255, 255, 0.4)',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}
      >
        Share Your Results
      </motion.span>

      {/* Section Title */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          fontSize: '32px',
          fontWeight: 300,
          color: '#FFFFFF',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          marginBottom: '12px',
          textAlign: 'center',
        }}
      >
        Share your Brand DNA
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{
          fontSize: '16px',
          color: 'rgba(255, 255, 255, 0.5)',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          marginBottom: '48px',
          textAlign: 'center',
        }}
      >
        Pick your favorite style and flex on the timeline
      </motion.p>

      {/* Card Preview Selector */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{
          width: '100%',
          maxWidth: '800px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <CardPreviewSelector data={data} theme="dark" defaultStyle="billboard" />
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.6 }}
        style={{
          display: 'flex',
          gap: '16px',
          marginTop: '48px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAnalyzeAnother}
          style={{
            padding: '14px 28px',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          Analyze Another
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClaim}
          style={{
            padding: '14px 28px',
            background: 'linear-gradient(135deg, #0047FF, #0038CC)',
            border: 'none',
            borderRadius: '12px',
            color: '#FFFFFF',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0, 71, 255, 0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          Claim Your Brand
        </motion.button>
      </motion.div>
    </motion.section>
  );
}
