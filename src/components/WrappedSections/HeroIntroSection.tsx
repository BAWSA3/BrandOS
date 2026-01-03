'use client';

import { motion } from 'motion/react';

interface HeroIntroSectionProps {
  username: string;
  displayName?: string;
  profileImageUrl?: string;
}

export default function HeroIntroSection({
  username,
  displayName,
  profileImageUrl,
}: HeroIntroSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(40px, 8vw, 60px) clamp(16px, 4vw, 24px)',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Profile Picture */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
        style={{
          width: 'clamp(80px, 15vw, 120px)',
          height: 'clamp(80px, 15vw, 120px)',
          borderRadius: '50%',
          overflow: 'hidden',
          marginBottom: 'clamp(16px, 3vw, 24px)',
          border: '3px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        }}
      >
        {profileImageUrl ? (
          <img
            src={profileImageUrl.replace('_normal', '_400x400')}
            alt={displayName || username}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #0047FF, #9d4edd)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              fontWeight: 700,
              color: '#FFFFFF',
            }}
          >
            {(displayName || username)[0].toUpperCase()}
          </div>
        )}
      </motion.div>

      {/* Display Name */}
      {displayName && (
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          style={{
            fontSize: '28px',
            fontWeight: 600,
            color: '#FFFFFF',
            marginBottom: '8px',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            letterSpacing: '-0.02em',
          }}
        >
          {displayName}
        </motion.h2>
      )}

      {/* Username */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        style={{
          fontSize: '16px',
          color: 'rgba(255, 255, 255, 0.5)',
          marginBottom: '48px',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
        }}
      >
        @{username}
      </motion.p>

      {/* Main Message */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        style={{
          fontSize: 'clamp(32px, 6vw, 48px)',
          fontWeight: 300,
          color: '#FFFFFF',
          textAlign: 'center',
          marginBottom: '16px',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}
      >
        Your Brand DNA is ready.
      </motion.h1>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.5 }}
        style={{
          position: 'absolute',
          bottom: '60px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontFamily: "'VCR OSD Mono', monospace",
            letterSpacing: '0.15em',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
          }}
        >
          Scroll to reveal
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: '24px',
            height: '40px',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '8px',
          }}
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: '4px',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '2px',
            }}
          />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
