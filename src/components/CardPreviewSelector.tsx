'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShareCardData,
  CardStyle,
  generateShareCard,
  copyCardToClipboard,
} from './ShareCardPrototypes';

// =============================================================================
// TYPES
// =============================================================================

interface CardPreviewSelectorProps {
  data: ShareCardData;
  theme?: 'dark' | 'light';
  onCopied?: () => void;
  onStyleChange?: (style: CardStyle) => void;
  defaultStyle?: CardStyle;
}

interface CardOption {
  id: CardStyle;
  name: string;
  description: string;
}

// =============================================================================
// CARD OPTIONS
// =============================================================================

const CARD_OPTIONS: CardOption[] = [
  {
    id: 'billboard',
    name: 'Billboard',
    description: 'Giant score, maximum impact',
  },
  {
    id: 'split',
    name: 'Split',
    description: 'Identity + Score side by side',
  },
  {
    id: 'wrapped',
    name: 'Wrapped',
    description: 'Story flow with tone bars',
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function CardPreviewSelector({
  data,
  theme = 'dark',
  onCopied,
  onStyleChange,
  defaultStyle = 'billboard',
}: CardPreviewSelectorProps) {
  const [selectedStyle, setSelectedStyle] = useState<CardStyle>(defaultStyle);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Record<CardStyle, string | null>>({
    billboard: null,
    split: null,
    wrapped: null,
  });
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [copySupported, setCopySupported] = useState(true);

  // Check clipboard support
  useEffect(() => {
    const checkSupport = async () => {
      try {
        if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
          const permission = await navigator.permissions.query({
            name: 'clipboard-write' as PermissionName,
          });
          setCopySupported(permission.state !== 'denied');
        } else {
          setCopySupported(false);
        }
      } catch {
        setCopySupported(typeof ClipboardItem !== 'undefined');
      }
    };
    checkSupport();
  }, []);

  // Generate previews for all styles on mount and data change
  useEffect(() => {
    const generatePreviews = async () => {
      const styles: CardStyle[] = ['billboard', 'split', 'wrapped'];
      const newUrls: Record<CardStyle, string | null> = {
        billboard: null,
        split: null,
        wrapped: null,
      };

      for (const style of styles) {
        const blob = await generateShareCard(data, style);
        if (blob) {
          newUrls[style] = URL.createObjectURL(blob);
        }
      }

      // Clean up old URLs
      Object.values(previewUrls).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });

      setPreviewUrls(newUrls);
      setActivePreviewUrl(newUrls[selectedStyle]);
    };

    generatePreviews();

    // Cleanup on unmount
    return () => {
      Object.values(previewUrls).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Update active preview when style changes
  useEffect(() => {
    setActivePreviewUrl(previewUrls[selectedStyle]);
  }, [selectedStyle, previewUrls]);

  const handleStyleSelect = useCallback(
    (style: CardStyle) => {
      setSelectedStyle(style);
      onStyleChange?.(style);
    },
    [onStyleChange]
  );

  const handleCopyToClipboard = useCallback(async () => {
    setIsGenerating(true);

    try {
      const blob = await generateShareCard(data, selectedStyle);
      if (!blob) throw new Error('Failed to generate image');

      const success = await copyCardToClipboard(blob);

      if (success) {
        setIsCopied(true);
        onCopied?.();
        setTimeout(() => setIsCopied(false), 3000);
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brandos-${selectedStyle}-${data.username}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating card:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [data, selectedStyle, onCopied]);

  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    try {
      const blob = await generateShareCard(data, selectedStyle);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brandos-${selectedStyle}-${data.username}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [data, selectedStyle]);

  const isDark = theme === 'dark';
  const primaryColor = data.brandColors?.primary || '#0047FF';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
        maxWidth: '800px',
      }}
    >
      {/* Style Selector Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '6px',
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          borderRadius: '16px',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        }}
      >
        {CARD_OPTIONS.map((option) => (
          <motion.button
            key={option.id}
            onClick={() => handleStyleSelect(option.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              flex: 1,
              padding: '12px 16px',
              background:
                selectedStyle === option.id
                  ? primaryColor
                  : 'transparent',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.05em',
                color:
                  selectedStyle === option.id
                    ? '#FFFFFF'
                    : isDark
                    ? 'rgba(255,255,255,0.7)'
                    : 'rgba(0,0,0,0.7)',
                marginBottom: '4px',
              }}
            >
              {option.name}
            </div>
            <div
              style={{
                fontSize: '11px',
                color:
                  selectedStyle === option.id
                    ? 'rgba(255,255,255,0.8)'
                    : isDark
                    ? 'rgba(255,255,255,0.4)'
                    : 'rgba(0,0,0,0.4)',
              }}
            >
              {option.description}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Preview Image */}
      <motion.div
        key={selectedStyle}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: `0 20px 60px ${isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)'}`,
          aspectRatio: '1200 / 630',
          background: isDark ? '#1a1a1a' : '#f5f5f5',
        }}
      >
        {activePreviewUrl ? (
          <img
            src={activePreviewUrl}
            alt={`${selectedStyle} card preview`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '14px',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '24px',
                height: '24px',
                border: `2px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                borderTopColor: primaryColor,
                borderRadius: '50%',
                marginRight: '12px',
              }}
            />
            Generating preview...
          </div>
        )}

        {/* Dimension badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            padding: '6px 12px',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            borderRadius: '8px',
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '10px',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          1200 × 630 px
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* Main CTA */}
        <motion.button
          onClick={handleCopyToClipboard}
          disabled={isGenerating}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          style={{
            flex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '16px 28px',
            background: isCopied ? '#10B981' : primaryColor,
            border: 'none',
            borderRadius: '14px',
            color: '#FFFFFF',
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            cursor: isGenerating ? 'wait' : 'pointer',
            opacity: isGenerating ? 0.7 : 1,
            boxShadow: `0 4px 20px ${isCopied ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0, 71, 255, 0.4)'}`,
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
              {copySupported ? 'COPY TO X' : 'DOWNLOAD'}
            </>
          )}
        </motion.button>

        {/* Download Button */}
        <motion.button
          onClick={handleDownload}
          disabled={isGenerating}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '16px 20px',
            background: 'transparent',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
            borderRadius: '14px',
            color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '12px',
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          DOWNLOAD
        </motion.button>
      </div>

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
              background: '#10B981',
              borderRadius: '12px',
              color: '#FFFFFF',
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Card copied! Paste in your X post
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
