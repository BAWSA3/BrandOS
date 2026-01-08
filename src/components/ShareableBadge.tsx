'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// =============================================================================
// TYPES
// =============================================================================

export interface BadgeData {
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  score: number;
  archetype: {
    name: string;
    emoji: string;
  };
  voiceConsistency: number;
  topKeywords?: string[];
}

interface ShareableBadgeProps {
  data: BadgeData;
  onShare?: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ARCHETYPE_COLORS: Record<string, { primary: string; secondary: string; glow: string }> = {
  'The Prophet': { primary: '#9D4EDD', secondary: '#7B2CBF', glow: 'rgba(157, 78, 221, 0.5)' },
  'The Alpha': { primary: '#FF6B35', secondary: '#E85D04', glow: 'rgba(255, 107, 53, 0.5)' },
  'The Builder': { primary: '#2E6AFF', secondary: '#1E4BC8', glow: 'rgba(46, 106, 255, 0.5)' },
  'The Educator': { primary: '#10B981', secondary: '#059669', glow: 'rgba(16, 185, 129, 0.5)' },
  'The Degen': { primary: '#F59E0B', secondary: '#D97706', glow: 'rgba(245, 158, 11, 0.5)' },
  'The Analyst': { primary: '#06B6D4', secondary: '#0891B2', glow: 'rgba(6, 182, 212, 0.5)' },
  'The Philosopher': { primary: '#8B5CF6', secondary: '#7C3AED', glow: 'rgba(139, 92, 246, 0.5)' },
  'The Networker': { primary: '#EC4899', secondary: '#DB2777', glow: 'rgba(236, 72, 153, 0.5)' },
  'The Contrarian': { primary: '#EF4444', secondary: '#DC2626', glow: 'rgba(239, 68, 68, 0.5)' },
};

const DEFAULT_COLORS = { primary: '#2E6AFF', secondary: '#1E4BC8', glow: 'rgba(46, 106, 255, 0.5)' };

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getScoreLabel(score: number): string {
  if (score >= 90) return 'LEGENDARY';
  if (score >= 80) return 'ELITE';
  if (score >= 70) return 'STRONG';
  if (score >= 60) return 'RISING';
  if (score >= 50) return 'DEVELOPING';
  return 'EMERGING';
}

function getArchetypeColors(archetype: string): { primary: string; secondary: string; glow: string } {
  return ARCHETYPE_COLORS[archetype] || DEFAULT_COLORS;
}

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// =============================================================================
// CANVAS BADGE GENERATOR
// =============================================================================

export async function generateBadgeImage(data: BadgeData): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Twitter/X optimal card dimensions
  canvas.width = 1200;
  canvas.height = 675;

  const colors = getArchetypeColors(data.archetype.name);

  // Load profile image
  let profileImage: HTMLImageElement | null = null;
  if (data.profileImageUrl) {
    const highResUrl = data.profileImageUrl.replace('_normal', '_400x400');
    profileImage = await loadImage(highResUrl);
  }

  // ==========================================================================
  // BACKGROUND - Dark with gradient accents
  // ==========================================================================

  // Base dark background
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Radial gradient accent in top-right
  const gradientTR = ctx.createRadialGradient(
    canvas.width - 100, 100, 0,
    canvas.width - 100, 100, 400
  );
  gradientTR.addColorStop(0, `${colors.primary}20`);
  gradientTR.addColorStop(1, 'transparent');
  ctx.fillStyle = gradientTR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Radial gradient accent in bottom-left
  const gradientBL = ctx.createRadialGradient(
    100, canvas.height - 100, 0,
    100, canvas.height - 100, 350
  );
  gradientBL.addColorStop(0, `${colors.secondary}15`);
  gradientBL.addColorStop(1, 'transparent');
  ctx.fillStyle = gradientBL;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle grid pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // ==========================================================================
  // TOP LEFT - BrandOS Logo
  // ==========================================================================

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = 'bold 28px "Inter", "Helvetica Neue", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Brand', 60, 60);

  const brandWidth = ctx.measureText('Brand').width;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillText('OS', 60 + brandWidth, 60);

  // ==========================================================================
  // CENTER - Main Badge Content
  // ==========================================================================

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2 - 20;

  // Large archetype emoji (using text for now, could be image)
  ctx.font = '120px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(data.archetype.emoji, centerX, centerY - 80);

  // Archetype name with glow effect
  ctx.font = 'bold 56px "Inter", "Helvetica Neue", sans-serif';
  ctx.shadowColor = colors.glow;
  ctx.shadowBlur = 30;
  ctx.fillStyle = colors.primary;
  ctx.fillText(data.archetype.name.toUpperCase(), centerX, centerY + 30);
  ctx.shadowBlur = 0;

  // Score display
  ctx.font = 'bold 32px "JetBrains Mono", "Courier New", monospace';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`${data.score}/100`, centerX, centerY + 90);

  // Score label badge
  const label = getScoreLabel(data.score);
  ctx.font = '600 14px "JetBrains Mono", monospace';
  const labelWidth = ctx.measureText(label).width + 32;
  const labelX = centerX - labelWidth / 2;
  const labelY = centerY + 115;

  // Badge background
  ctx.fillStyle = `${colors.primary}30`;
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(labelX, labelY, labelWidth, 28, 14);
  ctx.fill();
  ctx.stroke();

  // Badge text
  ctx.fillStyle = colors.primary;
  ctx.textAlign = 'center';
  ctx.fillText(label, centerX, labelY + 19);

  // ==========================================================================
  // LEFT SIDE - Profile Info
  // ==========================================================================

  const profileX = 60;
  const profileY = canvas.height - 140;

  if (profileImage) {
    const imgSize = 64;

    // Draw circular profile image
    ctx.save();
    ctx.beginPath();
    ctx.arc(profileX + imgSize / 2, profileY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(profileImage, profileX, profileY, imgSize, imgSize);
    ctx.restore();

    // Border
    ctx.beginPath();
    ctx.arc(profileX + imgSize / 2, profileY + imgSize / 2, imgSize / 2 + 2, 0, Math.PI * 2);
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Username
    ctx.textAlign = 'left';
    ctx.font = 'bold 20px "Inter", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(data.displayName || `@${data.username}`, profileX + imgSize + 16, profileY + 28);

    ctx.font = '400 16px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    if (data.displayName) {
      ctx.fillText(`@${data.username}`, profileX + imgSize + 16, profileY + 52);
    }
  } else {
    ctx.textAlign = 'left';
    ctx.font = 'bold 22px "Inter", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`@${data.username}`, profileX, profileY + 32);
  }

  // ==========================================================================
  // RIGHT SIDE - Voice Consistency
  // ==========================================================================

  const rightX = canvas.width - 60;
  const statY = canvas.height - 120;

  ctx.textAlign = 'right';
  ctx.font = '600 12px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText('VOICE CONSISTENCY', rightX, statY);

  ctx.font = 'bold 32px "JetBrains Mono", monospace';
  ctx.fillStyle = '#10B981';
  ctx.fillText(`${data.voiceConsistency}%`, rightX, statY + 40);

  // ==========================================================================
  // BOTTOM CENTER - CTA
  // ==========================================================================

  ctx.textAlign = 'center';
  ctx.font = '500 16px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText('Get yours → mybrandos.app', centerX, canvas.height - 35);

  // ==========================================================================
  // TOP RIGHT - Decorative element
  // ==========================================================================

  // Draw a small badge indicator
  ctx.textAlign = 'right';
  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillText('BRAND DNA ANALYSIS', canvas.width - 60, 55);

  // Convert to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  });
}

// =============================================================================
// DOWNLOAD HELPER
// =============================================================================

export async function downloadBadge(data: BadgeData): Promise<void> {
  const blob = await generateBadgeImage(data);
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `brandos-${data.username}-badge.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// =============================================================================
// SHARE TO X HELPER
// =============================================================================

export function shareToX(data: BadgeData): void {
  const tweetText = `Just discovered I'm "${data.archetype.name}" ${data.archetype.emoji} on @BrandOS_xyz

Brand Score: ${data.score}/100
Voice Consistency: ${data.voiceConsistency}%

What's YOUR brand archetype?
Get yours → mybrandos.app`;

  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
    '_blank',
    'noopener,noreferrer,width=600,height=400'
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ShareableBadge({ data, onShare }: ShareableBadgeProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloadComplete, setDownloadComplete] = useState(false);

  const colors = getArchetypeColors(data.archetype.name);

  const handleDownloadAndShare = useCallback(async () => {
    setIsGenerating(true);
    try {
      // Generate and download the image
      await downloadBadge(data);
      setDownloadComplete(true);

      // Small delay then open Twitter
      setTimeout(() => {
        shareToX(data);
        onShare?.();
        setDownloadComplete(false);
      }, 500);
    } finally {
      setIsGenerating(false);
    }
  }, [data, onShare]);

  const handlePreview = useCallback(async () => {
    setIsGenerating(true);
    try {
      const blob = await generateBadgeImage(data);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setShowPreview(true);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [data]);

  const handleDownloadOnly = useCallback(async () => {
    setIsGenerating(true);
    try {
      await downloadBadge(data);
    } finally {
      setIsGenerating(false);
    }
  }, [data]);

  return (
    <>
      {/* Share Badge Section */}
      <div
        style={{
          background: '#0a0a0a',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid #222',
          maxWidth: '500px',
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.2em',
              color: '#666',
              display: 'block',
              marginBottom: '8px',
            }}
          >
            SHARE YOUR BRAND DNA
          </span>
          <h3
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '24px',
              fontWeight: 800,
              color: '#FFFFFF',
              margin: 0,
            }}
          >
            You&apos;re {data.archetype.name} {data.archetype.emoji}
          </h3>
        </div>

        {/* Mini Preview */}
        <div
          style={{
            background: '#050505',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            border: `1px solid ${colors.primary}30`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              marginBottom: '8px',
            }}
          >
            {data.archetype.emoji}
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '18px',
              fontWeight: 700,
              color: colors.primary,
              marginBottom: '4px',
            }}
          >
            {data.archetype.name.toUpperCase()}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '24px',
              fontWeight: 700,
              color: '#FFFFFF',
            }}
          >
            {data.score}/100
          </div>
        </div>

        {/* Main CTA - Download & Share */}
        <motion.button
          onClick={handleDownloadAndShare}
          disabled={isGenerating}
          whileHover={{ scale: 1.02, boxShadow: `0 0 30px ${colors.glow}` }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '18px 28px',
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            border: 'none',
            borderRadius: '12px',
            color: '#FFFFFF',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            cursor: isGenerating ? 'wait' : 'pointer',
            opacity: isGenerating ? 0.7 : 1,
            boxShadow: `0 4px 20px ${colors.glow}`,
          }}
        >
          {isGenerating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#FFFFFF',
                  borderRadius: '50%',
                }}
              />
              GENERATING...
            </>
          ) : downloadComplete ? (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              OPENING X...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              SHARE MY BADGE ON X
            </>
          )}
        </motion.button>

        {/* Secondary Actions */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <motion.button
            onClick={handlePreview}
            disabled={isGenerating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.08em',
              cursor: 'pointer',
            }}
          >
            PREVIEW
          </motion.button>
          <motion.button
            onClick={handleDownloadOnly}
            disabled={isGenerating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.08em',
              cursor: 'pointer',
            }}
          >
            DOWNLOAD ONLY
          </motion.button>
        </div>

        {/* Helpful tip */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
            color: '#666',
            textAlign: 'center',
            marginTop: '16px',
            marginBottom: 0,
          }}
        >
          The badge will download, then X will open. Attach the image to your post!
        </p>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowPreview(false);
              if (previewUrl) URL.revokeObjectURL(previewUrl);
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 9999,
              cursor: 'pointer',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '95vw',
                maxHeight: '95vh',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: `0 25px 80px ${colors.glow}`,
                cursor: 'default',
              }}
            >
              <img
                src={previewUrl}
                alt="Badge preview"
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  maxHeight: '85vh',
                }}
              />
              <div
                style={{
                  padding: '16px 24px',
                  background: '#111',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  1200 × 675 px • Optimized for X
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleDownloadAndShare}
                    style={{
                      padding: '10px 20px',
                      background: colors.primary,
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    SHARE ON X
                  </button>
                  <button
                    onClick={() => {
                      setShowPreview(false);
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                    }}
                    style={{
                      padding: '10px 20px',
                      background: 'transparent',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
