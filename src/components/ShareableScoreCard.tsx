'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// =============================================================================
// TYPES
// =============================================================================

export interface ShareCardData {
  score: number;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  topStrength: string;
  summary?: string;
  archetype?: {
    primary: string;
    emoji: string;
    tagline?: string;
  };
  keywords?: string[];
  brandColors?: {
    primary: string;
    secondary: string;
  };
  voiceProfile?: string;
  // New metrics for redesigned card
  voiceConsistency?: number;      // 0-100
  engagementScore?: number;       // 0-100
  influenceTier?: string;         // 'Nano' | 'Micro' | 'Mid' | 'Macro' | 'Mega'
}

interface ShareableScoreCardProps {
  data: ShareCardData;
  theme: string;
  onCopied?: () => void;
}

// =============================================================================
// COLOR UTILITIES
// =============================================================================

function getScoreColors(score: number): { primary: string; secondary: string; glow: string } {
  if (score >= 80) {
    return { primary: '#10B981', secondary: '#059669', glow: 'rgba(16, 185, 129, 0.4)' };
  } else if (score >= 60) {
    return { primary: '#0047FF', secondary: '#3366FF', glow: 'rgba(0, 71, 255, 0.4)' };
  } else if (score >= 40) {
    return { primary: '#F59E0B', secondary: '#D97706', glow: 'rgba(245, 158, 11, 0.4)' };
  }
  return { primary: '#EF4444', secondary: '#DC2626', glow: 'rgba(239, 68, 68, 0.4)' };
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'EXCEPTIONAL';
  if (score >= 80) return 'EXCELLENT';
  if (score >= 70) return 'STRONG';
  if (score >= 60) return 'GOOD';
  if (score >= 50) return 'DECENT';
  if (score >= 40) return 'NEEDS WORK';
  return 'CRITICAL';
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const factor = 1 - percent / 100;
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const factor = percent / 100;
  const r = Math.round(rgb.r + (255 - rgb.r) * factor);
  const g = Math.round(rgb.g + (255 - rgb.g) * factor);
  const b = Math.round(rgb.b + (255 - rgb.b) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

function getInfluenceTierWidth(tier?: string): number {
  switch (tier) {
    case 'Mega': return 100;
    case 'Macro': return 85;
    case 'Mid': return 65;
    case 'Micro': return 45;
    case 'Nano':
    default: return 25;
  }
}

// =============================================================================
// LOAD IMAGE HELPER
// =============================================================================

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    // Use a proxy or direct URL - Twitter images should work with crossOrigin
    img.src = url;
  });
}

// =============================================================================
// CANVAS IMAGE GENERATOR
// =============================================================================

export async function generateShareableImage(data: ShareCardData): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Twitter card dimensions
  canvas.width = 1200;
  canvas.height = 630;

  const scoreColors = getScoreColors(data.score);

  // Use brand colors for right panel gradient, fallback to purple/indigo
  const primaryColor = data.brandColors?.primary || '#6366f1';
  const secondaryColor = data.brandColors?.secondary || '#a855f7';

  // Load profile image if available
  let profileImage: HTMLImageElement | null = null;
  if (data.profileImageUrl) {
    const highResUrl = data.profileImageUrl.replace('_normal', '_200x200');
    profileImage = await loadImage(highResUrl);
  }

  // Panel dimensions
  const leftPanelWidth = Math.floor(canvas.width * 0.55); // 660px
  const rightPanelWidth = canvas.width - leftPanelWidth;  // 540px
  const cornerRadius = 32;

  // ==========================================================================
  // LEFT PANEL - Dark background
  // ==========================================================================

  // Draw left panel background with rounded left corners
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cornerRadius, 0);
  ctx.lineTo(leftPanelWidth, 0);
  ctx.lineTo(leftPanelWidth, canvas.height);
  ctx.lineTo(cornerRadius, canvas.height);
  ctx.arcTo(0, canvas.height, 0, canvas.height - cornerRadius, cornerRadius);
  ctx.lineTo(0, cornerRadius);
  ctx.arcTo(0, 0, cornerRadius, 0, cornerRadius);
  ctx.closePath();
  ctx.fillStyle = '#0F1115';
  ctx.fill();
  ctx.restore();

  // Subtle border on right edge of left panel
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftPanelWidth, 0);
  ctx.lineTo(leftPanelWidth, canvas.height);
  ctx.stroke();

  // ==========================================================================
  // RIGHT PANEL - Brand color gradient
  // ==========================================================================

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(leftPanelWidth, 0);
  ctx.lineTo(canvas.width - cornerRadius, 0);
  ctx.arcTo(canvas.width, 0, canvas.width, cornerRadius, cornerRadius);
  ctx.lineTo(canvas.width, canvas.height - cornerRadius);
  ctx.arcTo(canvas.width, canvas.height, canvas.width - cornerRadius, canvas.height, cornerRadius);
  ctx.lineTo(leftPanelWidth, canvas.height);
  ctx.closePath();
  ctx.clip();

  // Main gradient
  const gradient = ctx.createLinearGradient(leftPanelWidth, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, primaryColor);
  gradient.addColorStop(0.5, secondaryColor);
  gradient.addColorStop(1, darkenColor(secondaryColor, 20));
  ctx.fillStyle = gradient;
  ctx.fillRect(leftPanelWidth, 0, rightPanelWidth, canvas.height);

  // Top-right light leak effect
  const primaryRgb = hexToRgb(primaryColor);
  if (primaryRgb) {
    const lightLeak = ctx.createRadialGradient(
      canvas.width + 50, -50, 0,
      canvas.width + 50, -50, 300
    );
    lightLeak.addColorStop(0, `rgba(${Math.min(255, primaryRgb.r + 100)}, ${Math.min(255, primaryRgb.g + 100)}, ${Math.min(255, primaryRgb.b + 100)}, 0.4)`);
    lightLeak.addColorStop(1, 'transparent');
    ctx.fillStyle = lightLeak;
    ctx.fillRect(leftPanelWidth, 0, rightPanelWidth, canvas.height);
  }

  // Bottom-left depth effect
  const secondaryRgb = hexToRgb(secondaryColor);
  if (secondaryRgb) {
    const depthEffect = ctx.createRadialGradient(
      leftPanelWidth - 50, canvas.height + 50, 0,
      leftPanelWidth - 50, canvas.height + 50, 250
    );
    depthEffect.addColorStop(0, `rgba(${Math.max(0, secondaryRgb.r - 80)}, ${Math.max(0, secondaryRgb.g - 80)}, ${Math.max(0, secondaryRgb.b - 80)}, 0.4)`);
    depthEffect.addColorStop(1, 'transparent');
    ctx.fillStyle = depthEffect;
    ctx.fillRect(leftPanelWidth, 0, rightPanelWidth, canvas.height);
  }

  ctx.restore();

  // ==========================================================================
  // LEFT PANEL CONTENT
  // ==========================================================================

  const leftPadding = 60;
  let currentY = 70;

  // BrandOS Logo
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = 'bold 36px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Brand', leftPadding, currentY);

  const brandWidth = ctx.measureText('Brand').width;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillText('OS', leftPadding + brandWidth, currentY);

  // Subtitle
  currentY += 28;
  ctx.font = '600 11px "Courier New", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.letterSpacing = '0.15em';
  ctx.fillText('AI-POWERED BRAND DNA', leftPadding, currentY);

  // ==========================================================================
  // PROFILE SECTION
  // ==========================================================================
  currentY += 55;

  if (profileImage) {
    const imgSize = 52;
    const imgX = leftPadding;
    const imgY = currentY;

    // Draw circular profile image
    ctx.save();
    ctx.beginPath();
    ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(profileImage, imgX, imgY, imgSize, imgSize);
    ctx.restore();

    // Subtle border
    ctx.beginPath();
    ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2 + 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Name and handle next to image
    const textX = imgX + imgSize + 16;
    if (data.displayName) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 22px "Helvetica Neue", Arial, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(data.displayName, textX, imgY + 16);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '400 16px "Helvetica Neue", Arial, sans-serif';
      ctx.fillText(`@${data.username}`, textX, imgY + 40);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 22px "Helvetica Neue", Arial, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(`@${data.username}`, textX, imgY + imgSize / 2);
    }

    currentY += imgSize + 45;
  } else {
    // Just name/handle without image
    if (data.displayName) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 22px "Helvetica Neue", Arial, sans-serif';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(data.displayName, leftPadding, currentY);
      currentY += 24;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '400 16px "Helvetica Neue", Arial, sans-serif';
      ctx.fillText(`@${data.username}`, leftPadding, currentY);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 22px "Helvetica Neue", Arial, sans-serif';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`@${data.username}`, leftPadding, currentY);
    }
    currentY += 45;
  }

  // ==========================================================================
  // METRICS SECTION
  // ==========================================================================

  const metricBarWidth = leftPanelWidth - leftPadding * 2 - 20;
  const metricBarHeight = 10;
  const metricSpacing = 70;

  // Helper function to draw a metric
  const drawMetric = (label: string, value: string, widthPercent: number, color: string, y: number) => {
    // Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '500 14px "Helvetica Neue", Arial, sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillText(label, leftPadding, y);

    // Value
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText(value, leftPadding, y + 28);

    // Progress bar background
    const barY = y + 42;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(leftPadding, barY, metricBarWidth, metricBarHeight, metricBarHeight / 2);
    ctx.fill();

    // Progress bar fill
    const fillWidth = (widthPercent / 100) * metricBarWidth;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(leftPadding, barY, fillWidth, metricBarHeight, metricBarHeight / 2);
    ctx.fill();
  };

  // Metric 1: Voice Consistency
  const voiceConsistency = data.voiceConsistency ?? 85;
  drawMetric('Voice Consistency', `${voiceConsistency}%`, voiceConsistency, '#10B981', currentY);
  currentY += metricSpacing;

  // Metric 2: Engagement
  const engagementScore = data.engagementScore ?? 72;
  drawMetric('Engagement', `${engagementScore}%`, engagementScore, '#0047FF', currentY);
  currentY += metricSpacing;

  // Metric 3: Influence Tier
  const influenceTier = data.influenceTier || 'Micro';
  const tierWidth = getInfluenceTierWidth(influenceTier);
  drawMetric('Influence', influenceTier, tierWidth, '#9d4edd', currentY);

  // ==========================================================================
  // ANALYSIS COMPLETE INDICATOR
  // ==========================================================================

  const bottomY = canvas.height - 50;

  // Pulsing dot (static for image)
  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.arc(leftPadding + 5, bottomY, 5, 0, Math.PI * 2);
  ctx.fill();

  // Status text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '600 10px "Courier New", monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('ANALYSIS COMPLETE', leftPadding + 20, bottomY);

  // ==========================================================================
  // RIGHT PANEL - SCORE DISPLAY
  // ==========================================================================

  const rightCenterX = leftPanelWidth + rightPanelWidth / 2;
  const rightCenterY = canvas.height / 2;

  // Large score number
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 120px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  ctx.fillText(String(data.score), rightCenterX, rightCenterY - 20);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Score label badge
  const label = getScoreLabel(data.score);
  const badgeWidth = ctx.measureText(label).width + 40;
  const badgeHeight = 36;
  const badgeX = rightCenterX - badgeWidth / 2;
  const badgeY = rightCenterY + 50;

  // Badge background (glass effect)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, badgeHeight / 2);
  ctx.fill();
  ctx.stroke();

  // Badge text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rightCenterX, badgeY + badgeHeight / 2);

  // ==========================================================================
  // CTA at bottom of right panel
  // ==========================================================================

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '500 14px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('brandos.xyz', rightCenterX, canvas.height - 40);

  // Convert to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  });
}

// Helper to wrap text
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number = 3): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, maxLines);
}

// =============================================================================
// COPY TO CLIPBOARD
// =============================================================================

export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  try {
    // Modern Clipboard API with image support
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      return true;
    }
    
    // Fallback: Create download link instead
    console.warn('Clipboard image support not available, falling back to download');
    return false;
  } catch (error) {
    console.error('Failed to copy image to clipboard:', error);
    return false;
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function ShareableScoreCard({ data, theme, onCopied }: ShareableScoreCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copySupported, setCopySupported] = useState(true);

  // Check clipboard support on mount
  useEffect(() => {
    const checkSupport = async () => {
      try {
        if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
          // Additional check for write permission
          const permission = await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
          setCopySupported(permission.state !== 'denied');
        } else {
          setCopySupported(false);
        }
      } catch {
        // Permission API might not be available
        setCopySupported(typeof ClipboardItem !== 'undefined');
      }
    };
    checkSupport();
  }, []);

  const handleCopyToClipboard = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      const blob = await generateShareableImage(data);
      if (!blob) {
        throw new Error('Failed to generate image');
      }

      // Try to copy to clipboard
      const success = await copyImageToClipboard(blob);
      
      if (success) {
        setIsCopied(true);
        onCopied?.();
        setTimeout(() => setIsCopied(false), 3000);
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brandos-score-${data.username}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating share card:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [data, onCopied]);

  const handlePreview = useCallback(async () => {
    setIsGenerating(true);
    try {
      const blob = await generateShareableImage(data);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setShowPreview(true);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [data]);

  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    try {
      const blob = await generateShareableImage(data);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brandos-score-${data.username}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [data]);

  const scoreColors = getScoreColors(data.score);

  return (
    <>
      {/* Main Copy Button */}
      <motion.button
        onClick={handleCopyToClipboard}
        disabled={isGenerating}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '16px 28px',
          background: isCopied 
            ? scoreColors.primary 
            : `linear-gradient(135deg, ${scoreColors.primary}, ${scoreColors.secondary})`,
          border: 'none',
          borderRadius: '14px',
          color: '#FFFFFF',
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          cursor: isGenerating ? 'wait' : 'pointer',
          opacity: isGenerating ? 0.7 : 1,
          boxShadow: `0 4px 20px ${scoreColors.glow}`,
          transition: 'all 0.2s ease',
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
        ) : isCopied ? (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            COPIED! PASTE IN X
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {copySupported ? 'COPY IMAGE TO X' : 'DOWNLOAD IMAGE'}
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
            padding: '10px 16px',
            background: 'transparent',
            border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
            borderRadius: '10px',
            color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          PREVIEW
        </motion.button>
        
        <motion.button
          onClick={handleDownload}
          disabled={isGenerating}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
            borderRadius: '10px',
            color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          DOWNLOAD
        </motion.button>
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
              background: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
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
                maxWidth: '90vw',
                maxHeight: '90vh',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5)',
                cursor: 'default',
              }}
            >
              <img 
                src={previewUrl} 
                alt="Share card preview" 
                style={{ 
                  display: 'block',
                  maxWidth: '100%', 
                  maxHeight: '80vh',
                }} 
              />
              <div style={{
                padding: '16px 24px',
                background: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '12px',
                  color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                }}>
                  1200 × 630 px • Twitter Card
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleCopyToClipboard}
                    style={{
                      padding: '8px 16px',
                      background: scoreColors.primary,
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {copySupported ? 'COPY' : 'DOWNLOAD'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPreview(false);
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                    }}
                    style={{
                      padding: '8px 16px',
                      background: 'transparent',
                      border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#FFFFFF' : '#000000',
                      fontFamily: "'VCR OSD Mono', monospace",
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
              padding: '16px 28px',
              background: scoreColors.primary,
              borderRadius: '12px',
              color: '#FFFFFF',
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              boxShadow: `0 8px 32px ${scoreColors.glow}`,
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Image copied! Paste in your X post
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


