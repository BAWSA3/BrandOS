'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// =============================================================================
// TYPES
// =============================================================================

export interface ShareCardData {
  score: number;
  username: string;
  topStrength: string;
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
  const primaryColor = data.brandColors?.primary || scoreColors.primary;
  const secondaryColor = data.brandColors?.secondary || scoreColors.secondary;

  // ==========================================================================
  // BACKGROUND - Gradient with user's brand colors
  // ==========================================================================
  
  // Main gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGradient.addColorStop(0, '#0a0a12');
  bgGradient.addColorStop(0.3, '#0f0f1a');
  bgGradient.addColorStop(0.7, '#0a0a14');
  bgGradient.addColorStop(1, '#050508');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Color accent blobs (using brand colors)
  const primaryRgb = hexToRgb(primaryColor);
  const secondaryRgb = hexToRgb(secondaryColor);
  
  if (primaryRgb) {
    // Top right accent blob
    const blob1 = ctx.createRadialGradient(canvas.width - 100, 80, 0, canvas.width - 100, 80, 400);
    blob1.addColorStop(0, `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.3)`);
    blob1.addColorStop(0.5, `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`);
    blob1.addColorStop(1, 'transparent');
    ctx.fillStyle = blob1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  if (secondaryRgb) {
    // Bottom left accent blob
    const blob2 = ctx.createRadialGradient(100, canvas.height - 100, 0, 100, canvas.height - 100, 350);
    blob2.addColorStop(0, `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.25)`);
    blob2.addColorStop(0.5, `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.08)`);
    blob2.addColorStop(1, 'transparent');
    ctx.fillStyle = blob2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Subtle grid pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  const gridSize = 50;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Noise texture simulation (dots)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.fillRect(x, y, 1, 1);
  }

  // ==========================================================================
  // USERNAME - Top left
  // ==========================================================================
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '600 28px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`@${data.username}`, 60, 70);

  // ==========================================================================
  // BRANDOS LOGO - Top right
  // ==========================================================================
  ctx.textAlign = 'right';
  ctx.font = 'italic 700 32px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Brand', canvas.width - 60, 70);
  
  const brandWidth = ctx.measureText('Brand').width;
  ctx.font = '700 32px "VCR OSD Mono", "Courier New", monospace';
  ctx.fillStyle = primaryColor;
  ctx.fillText('OS', canvas.width - 60, 70);

  // ==========================================================================
  // SCORE SECTION - Center left
  // ==========================================================================
  const scoreX = 280;
  const scoreY = canvas.height / 2 - 20;

  // Score circle glow
  const glowGradient = ctx.createRadialGradient(scoreX, scoreY, 0, scoreX, scoreY, 180);
  glowGradient.addColorStop(0, scoreColors.glow);
  glowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  glowGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Score circle background
  ctx.beginPath();
  ctx.arc(scoreX, scoreY, 130, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.fill();
  
  // Inner ring
  ctx.beginPath();
  ctx.arc(scoreX, scoreY, 115, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Score progress arc
  const progressAngle = (data.score / 100) * Math.PI * 2;
  ctx.beginPath();
  ctx.arc(scoreX, scoreY, 130, -Math.PI / 2, -Math.PI / 2 + progressAngle);
  ctx.strokeStyle = scoreColors.primary;
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Score number
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 84px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(data.score), scoreX, scoreY - 8);

  // /100 text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '24px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText('/100', scoreX, scoreY + 45);

  // Score label (EXCELLENT, etc.)
  ctx.fillStyle = scoreColors.primary;
  ctx.font = '600 16px "VCR OSD Mono", "Courier New", monospace';
  ctx.letterSpacing = '0.15em';
  ctx.fillText(getScoreLabel(data.score), scoreX, scoreY + 85);

  // ==========================================================================
  // ARCHETYPE SECTION - Right side
  // ==========================================================================
  const rightX = 580;
  const rightStartY = 180;

  if (data.archetype) {
    // Archetype emoji (large)
    ctx.font = '72px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(data.archetype.emoji, rightX, rightStartY + 10);

    // Archetype name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText(data.archetype.primary, rightX + 90, rightStartY);

    // Archetype tagline
    if (data.archetype.tagline) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '20px "Helvetica Neue", Arial, sans-serif';
      const taglineLines = wrapText(ctx, data.archetype.tagline, 480);
      taglineLines.forEach((line, i) => {
        ctx.fillText(line, rightX, rightStartY + 45 + (i * 28));
      });
    }
  }

  // ==========================================================================
  // TOP STRENGTH - Right side, below archetype
  // ==========================================================================
  const strengthY = data.archetype ? rightStartY + 130 : rightStartY;

  // Label
  ctx.fillStyle = scoreColors.primary;
  ctx.font = '600 14px "VCR OSD Mono", "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('TOP STRENGTH', rightX, strengthY);

  // Strength text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '24px "Helvetica Neue", Arial, sans-serif';
  const strengthLines = wrapText(ctx, `"${data.topStrength}"`, 520);
  strengthLines.forEach((line, i) => {
    ctx.fillText(line, rightX, strengthY + 35 + (i * 32));
  });

  // ==========================================================================
  // KEYWORDS - Bottom section
  // ==========================================================================
  if (data.keywords && data.keywords.length > 0) {
    const keywordsY = canvas.height - 100;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '18px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'left';
    
    const keywordText = data.keywords.slice(0, 5).map(k => `#${k}`).join('  ');
    ctx.fillText(keywordText, 60, keywordsY);
  }

  // ==========================================================================
  // CTA - Bottom right
  // ==========================================================================
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '20px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Get your brand score →', canvas.width - 60, canvas.height - 100);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText('brandos.xyz', canvas.width - 60, canvas.height - 65);

  // ==========================================================================
  // DECORATIVE ELEMENTS
  // ==========================================================================
  
  // Small accent dots
  ctx.fillStyle = scoreColors.primary;
  ctx.beginPath();
  ctx.arc(60, canvas.height - 60, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = secondaryColor;
  ctx.beginPath();
  ctx.arc(80, canvas.height - 60, 3, 0, Math.PI * 2);
  ctx.fill();

  // Convert to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  });
}

// Helper to wrap text
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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
  return lines.slice(0, 2); // Max 2 lines
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


