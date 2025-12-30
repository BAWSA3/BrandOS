'use client';

import { motion } from 'motion/react';

// =============================================================================
// BRAND DNA PREVIEW COMPONENT
// Shows auto-generated Brand DNA from X profile analysis
// =============================================================================

export interface GeneratedBrandDNA {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  tone: {
    minimal: number;
    playful: number;
    bold: number;
    experimental: number;
  };
  keywords: string[];
  doPatterns: string[];
  dontPatterns: string[];
  voiceSamples: string[];
  archetype: string;
  archetypeEmoji: string;
  voiceProfile: string;
  targetAudience: string;
  inferredMission: string;
}

interface BrandDNAPreviewProps {
  generatedDNA: GeneratedBrandDNA;
  username: string;
  onClaim: () => void;
  theme: string;
}

// Tone slider display component
function ToneSliderPreview({
  label,
  value,
  leftLabel,
  rightLabel,
  theme,
}: {
  label: string;
  value: number;
  leftLabel: string;
  rightLabel: string;
  theme: string;
}) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
        }}
      >
        <span
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "'Helvetica Neue', sans-serif",
            fontSize: '12px',
            fontWeight: 600,
            color: theme === 'dark' ? '#FFFFFF' : '#000000',
          }}
        >
          {value}%
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontFamily: "'Helvetica Neue', sans-serif",
            fontSize: '10px',
            color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
            minWidth: '60px',
          }}
        >
          {leftLabel}
        </span>
        <div
          style={{
            flex: 1,
            height: '4px',
            background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #0047FF, #3C8AFF)',
              borderRadius: '2px',
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "'Helvetica Neue', sans-serif",
            fontSize: '10px',
            color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
            minWidth: '60px',
            textAlign: 'right',
          }}
        >
          {rightLabel}
        </span>
      </div>
    </div>
  );
}

export default function BrandDNAPreview({
  generatedDNA,
  username,
  onClaim,
  theme,
}: BrandDNAPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      style={{
        width: '100%',
        maxWidth: '500px',
        background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        borderRadius: '24px',
        padding: '32px',
        marginTop: '32px',
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ textAlign: 'center', marginBottom: '24px' }}
      >
        <span
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.15em',
            color: '#0047FF',
            display: 'block',
            marginBottom: '8px',
          }}
        >
          WE'VE CAPTURED YOUR BRAND DNA
        </span>
        <p
          style={{
            fontFamily: "'Helvetica Neue', sans-serif",
            fontSize: '14px',
            color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
            margin: 0,
          }}
        >
          Based on @{username}'s profile, here's what makes your brand uniquely yours.
        </p>
      </motion.div>

      {/* Brand Name + Archetype */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          padding: '16px',
          background: theme === 'dark' ? 'rgba(0,71,255,0.1)' : 'rgba(0,71,255,0.05)',
          borderRadius: '12px',
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "'Helvetica Neue', sans-serif",
              fontSize: '18px',
              fontWeight: 600,
              color: theme === 'dark' ? '#FFFFFF' : '#000000',
              margin: 0,
            }}
          >
            {generatedDNA.name}
          </p>
          <p
            style={{
              fontFamily: "'Helvetica Neue', sans-serif",
              fontSize: '13px',
              color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
              margin: 0,
            }}
          >
            {generatedDNA.voiceProfile}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            borderRadius: '20px',
          }}
        >
          <span style={{ fontSize: '20px' }}>{generatedDNA.archetypeEmoji}</span>
          <span
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.05em',
              color: theme === 'dark' ? '#FFFFFF' : '#000000',
            }}
          >
            {generatedDNA.archetype}
          </span>
        </div>
      </motion.div>

      {/* Color Palette */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ marginBottom: '24px' }}
      >
        <span
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            display: 'block',
            marginBottom: '12px',
          }}
        >
          YOUR COLORS
        </span>
        <div style={{ display: 'flex', gap: '12px' }}>
          {Object.entries(generatedDNA.colors).map(([key, color], index) => (
            <motion.div
              key={key}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1, type: 'spring', stiffness: 200 }}
              style={{ flex: 1, textAlign: 'center' }}
            >
              <div
                style={{
                  width: '100%',
                  height: '48px',
                  background: color,
                  borderRadius: '8px',
                  marginBottom: '8px',
                  boxShadow: `0 4px 12px ${color}40`,
                }}
              />
              <span
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '9px',
                  letterSpacing: '0.05em',
                  color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  textTransform: 'uppercase',
                }}
              >
                {key}
              </span>
              <span
                style={{
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontSize: '11px',
                  color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                  display: 'block',
                }}
              >
                {color}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Tone Sliders */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ marginBottom: '24px' }}
      >
        <span
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            display: 'block',
            marginBottom: '12px',
          }}
        >
          YOUR TONE
        </span>
        <ToneSliderPreview
          label="FORMALITY"
          value={generatedDNA.tone.minimal}
          leftLabel="Casual"
          rightLabel="Formal"
          theme={theme}
        />
        <ToneSliderPreview
          label="ENERGY"
          value={generatedDNA.tone.playful}
          leftLabel="Reserved"
          rightLabel="Energetic"
          theme={theme}
        />
        <ToneSliderPreview
          label="CONFIDENCE"
          value={generatedDNA.tone.bold}
          leftLabel="Humble"
          rightLabel="Bold"
          theme={theme}
        />
        <ToneSliderPreview
          label="STYLE"
          value={generatedDNA.tone.experimental}
          leftLabel="Classic"
          rightLabel="Experimental"
          theme={theme}
        />
      </motion.div>

      {/* Keywords */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{ marginBottom: '24px' }}
      >
        <span
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            display: 'block',
            marginBottom: '12px',
          }}
        >
          YOUR KEYWORDS
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {generatedDNA.keywords.map((keyword, index) => (
            <motion.span
              key={keyword}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + index * 0.05 }}
              style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                fontSize: '12px',
                padding: '6px 12px',
                background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                borderRadius: '20px',
                color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
              }}
            >
              {keyword}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Voice Sample Preview */}
      {generatedDNA.voiceSamples.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ marginBottom: '24px' }}
        >
          <span
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
              display: 'block',
              marginBottom: '12px',
            }}
          >
            YOUR VOICE
          </span>
          <div
            style={{
              padding: '12px 16px',
              background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderRadius: '8px',
              borderLeft: '3px solid #0047FF',
            }}
          >
            <p
              style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                fontSize: '13px',
                fontStyle: 'italic',
                color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              "{generatedDNA.voiceSamples[0]}"
            </p>
          </div>
        </motion.div>
      )}

      {/* CTA Button */}
      <motion.button
        onClick={onClaim}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        whileHover={{
          scale: 1.02,
          boxShadow: '0 0 30px rgba(0, 71, 255, 0.4)',
        }}
        whileTap={{ scale: 0.98 }}
        style={{
          width: '100%',
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '13px',
          letterSpacing: '0.15em',
          color: '#FFFFFF',
          background: 'linear-gradient(135deg, #0047FF 0%, #002FA7 100%)',
          border: 'none',
          padding: '18px 32px',
          borderRadius: '12px',
          cursor: 'pointer',
          boxShadow: '0 0 20px rgba(0, 71, 255, 0.3)',
        }}
      >
        CLAIM YOUR BRAND DNA
      </motion.button>

      {/* Sub-CTA */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{
          fontFamily: "'Helvetica Neue', sans-serif",
          fontSize: '12px',
          color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
          textAlign: 'center',
          margin: 0,
          marginTop: '12px',
        }}
      >
        Start checking content instantly. No credit card required.
      </motion.p>
    </motion.div>
  );
}

