'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDemoCapture } from '@/hooks/useDemoCapture';
import { getMomentById } from '@/lib/screenshot/moments';
import {
  generateExportManifest,
  downloadManifest,
  downloadAllScreenshots,
  copyRemotionDataToClipboard,
  getExportStats,
} from '@/lib/screenshot/export';
import { clearAllDemoData } from '@/lib/screenshot/storage';

interface DemoModeControlsProps {
  theme?: string;
}

export default function DemoModeControls({ theme = 'dark' }: DemoModeControlsProps) {
  const {
    isActive,
    sessionId,
    currentMoment,
    captureCount,
    startSession,
    endSession,
    capture,
  } = useDemoCapture();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Keyboard shortcut to toggle demo mode (Ctrl/Cmd + Shift + D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        if (isActive) {
          endSession();
        } else {
          startSession();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, startSession, endSession]);

  const handleManualCapture = useCallback(async () => {
    if (!currentMoment) {
      // If no moment is set, use a generic one
      await capture('score:dashboard');
    } else {
      await capture(currentMoment);
    }
  }, [capture, currentMoment]);

  const handleExportManifest = useCallback(async () => {
    if (!sessionId) return;

    setIsExporting(true);
    setExportMessage('Generating manifest...');

    try {
      const manifest = await generateExportManifest(sessionId);
      downloadManifest(manifest);
      const stats = getExportStats(manifest);
      setExportMessage(`Exported ${stats.totalScreenshots} screenshots (${stats.totalDuration})`);
    } catch (error) {
      console.error('Export failed:', error);
      setExportMessage('Export failed');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(null), 3000);
    }
  }, [sessionId]);

  const handleDownloadScreenshots = useCallback(async () => {
    if (!sessionId) return;

    setIsExporting(true);
    setExportMessage('Downloading screenshots...');

    try {
      await downloadAllScreenshots(sessionId);
      setExportMessage('Downloads complete!');
    } catch (error) {
      console.error('Download failed:', error);
      setExportMessage('Download failed');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(null), 3000);
    }
  }, [sessionId]);

  const handleCopyRemotionData = useCallback(async () => {
    if (!sessionId) return;

    setIsExporting(true);
    setExportMessage('Copying to clipboard...');

    try {
      await copyRemotionDataToClipboard(sessionId);
      setExportMessage('Copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
      setExportMessage('Copy failed');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(null), 3000);
    }
  }, [sessionId]);

  const handleClearData = useCallback(async () => {
    if (confirm('Clear all demo capture data? This cannot be undone.')) {
      await clearAllDemoData();
      endSession();
      setExportMessage('Data cleared');
      setTimeout(() => setExportMessage(null), 2000);
    }
  }, [endSession]);

  // Don't render if demo mode is not active
  if (!isActive) return null;

  const currentMomentData = currentMoment ? getMomentById(currentMoment) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        fontFamily: "'VCR OSD Mono', monospace",
      }}
    >
      {/* Main Control Panel */}
      <div
        style={{
          background: theme === 'dark' ? 'rgba(10, 10, 10, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'}`,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          minWidth: '280px',
        }}
      >
        {/* Header */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #E8A838 0%, #D4A574 100%)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#EF4444',
                boxShadow: '0 0 10px #EF4444',
              }}
            />
            <span
              style={{
                fontSize: '12px',
                letterSpacing: '0.1em',
                color: '#050505',
                fontWeight: 600,
              }}
            >
              DEMO CAPTURE
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#050505',
              }}
            >
              {captureCount}
            </span>
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              style={{ color: '#050505', fontSize: '14px' }}
            >
              ▼
            </motion.span>
          </div>
        </div>

        {/* Current Moment Indicator */}
        <div
          style={{
            padding: '10px 16px',
            borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          }}
        >
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
              marginBottom: '4px',
            }}
          >
            CURRENT MOMENT
          </div>
          <div
            style={{
              fontSize: '13px',
              color: currentMomentData
                ? '#D4A574'
                : theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.3)'
                  : 'rgba(0, 0, 0, 0.3)',
            }}
          >
            {currentMomentData?.label || 'Waiting...'}
          </div>
        </div>

        {/* Expanded Controls */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              {/* Action Buttons */}
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Manual Capture */}
                <button
                  onClick={handleManualCapture}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
                    borderRadius: '8px',
                    color: theme === 'dark' ? '#FFFFFF' : '#000000',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  📸 MANUAL CAPTURE
                </button>

                {/* Export Manifest */}
                <button
                  onClick={handleExportManifest}
                  disabled={isExporting || captureCount === 0}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
                    borderRadius: '8px',
                    color: theme === 'dark' ? '#FFFFFF' : '#000000',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    cursor: captureCount > 0 ? 'pointer' : 'not-allowed',
                    opacity: captureCount > 0 ? 1 : 0.5,
                    transition: 'all 0.2s ease',
                  }}
                >
                  📋 EXPORT MANIFEST
                </button>

                {/* Download Screenshots */}
                <button
                  onClick={handleDownloadScreenshots}
                  disabled={isExporting || captureCount === 0}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
                    borderRadius: '8px',
                    color: theme === 'dark' ? '#FFFFFF' : '#000000',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    cursor: captureCount > 0 ? 'pointer' : 'not-allowed',
                    opacity: captureCount > 0 ? 1 : 0.5,
                    transition: 'all 0.2s ease',
                  }}
                >
                  💾 DOWNLOAD ALL
                </button>

                {/* Copy Remotion Data */}
                <button
                  onClick={handleCopyRemotionData}
                  disabled={isExporting || captureCount === 0}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.2) 0%, rgba(232, 168, 56, 0.2) 100%)',
                    border: '1px solid rgba(212, 165, 116, 0.4)',
                    borderRadius: '8px',
                    color: '#D4A574',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    cursor: captureCount > 0 ? 'pointer' : 'not-allowed',
                    opacity: captureCount > 0 ? 1 : 0.5,
                    transition: 'all 0.2s ease',
                  }}
                >
                  🎬 COPY FOR REMOTION
                </button>

                {/* End Session */}
                <button
                  onClick={endSession}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#EF4444',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  ⏹ END SESSION
                </button>

                {/* Clear Data */}
                <button
                  onClick={handleClearData}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    background: 'transparent',
                    border: 'none',
                    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  🗑 CLEAR ALL DATA
                </button>
              </div>

              {/* Session Info */}
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  fontSize: '9px',
                  letterSpacing: '0.05em',
                  color: theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                }}
              >
                SESSION: {sessionId?.substring(0, 20)}...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export Message Toast */}
        <AnimatePresence>
          {exportMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                position: 'absolute',
                top: '-50px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '8px 16px',
                background: theme === 'dark' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(16, 185, 129, 0.95)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '11px',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
            >
              {exportMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Keyboard Shortcut Hint */}
      <div
        style={{
          marginTop: '8px',
          textAlign: 'center',
          fontSize: '9px',
          letterSpacing: '0.1em',
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
        }}
      >
        ⌘⇧D TO TOGGLE
      </div>
    </motion.div>
  );
}
