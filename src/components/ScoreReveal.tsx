'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import ShareableScoreCard, { ShareCardData } from './ShareableScoreCard';

// =============================================================================
// SHARE FUNCTIONALITY
// =============================================================================

interface ShareData {
  score: number;
  username: string;
  topStrength: string;
  profileImage: string;
}

// Generate shareable image using Canvas
async function generateShareCard(data: ShareData): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Card dimensions (1200x630 for Twitter card)
  canvas.width = 1200;
  canvas.height = 630;

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#0a0a1a');
  gradient.addColorStop(0.5, '#0f1025');
  gradient.addColorStop(1, '#050510');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add subtle grid pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  const gridSize = 40;
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

  // Score circle glow
  const centerX = 300;
  const centerY = canvas.height / 2;
  const scoreColor = data.score >= 80 ? '#10B981' : data.score >= 60 ? '#0047FF' : data.score >= 40 ? '#0047FF' : '#EF4444';
  
  // Outer glow
  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 200);
  glowGradient.addColorStop(0, `${scoreColor}40`);
  glowGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Score circle background
  ctx.beginPath();
  ctx.arc(centerX, centerY, 120, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fill();

  // Score arc
  ctx.beginPath();
  ctx.arc(centerX, centerY, 120, -Math.PI / 2, -Math.PI / 2 + (data.score / 100) * Math.PI * 2);
  ctx.strokeStyle = scoreColor;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Score text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 72px Helvetica Neue, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(data.score), centerX, centerY - 10);

  // Score label
  ctx.fillStyle = scoreColor;
  ctx.font = '14px VCR OSD Mono, monospace';
  ctx.letterSpacing = '0.2em';
  ctx.fillText(data.score >= 80 ? 'EXCELLENT' : data.score >= 60 ? 'GOOD' : data.score >= 40 ? 'NEEDS WORK' : 'CRITICAL', centerX, centerY + 50);

  // Right side content
  const rightX = 550;
  
  // Username
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '24px Helvetica Neue, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`@${data.username}`, rightX, 180);

  // "Brand Score" label
  ctx.fillStyle = '#0047FF';
  ctx.font = '14px VCR OSD Mono, monospace';
  ctx.fillText('BRAND SCORE', rightX, 230);

  // Top strength
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '28px Helvetica Neue, sans-serif';
  const strengthLines = wrapText(ctx, `"${data.topStrength}"`, 550);
  let yOffset = 290;
  strengthLines.forEach(line => {
    ctx.fillText(line, rightX, yOffset);
    yOffset += 36;
  });

  // BrandOS branding
  ctx.fillStyle = '#0047FF';
  ctx.font = 'bold 32px Helvetica Neue, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Brand', canvas.width - 60, canvas.height - 60);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('OS', canvas.width - 60 + ctx.measureText('Brand').width + 4, canvas.height - 60);

  // CTA
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '16px Helvetica Neue, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Get your score at brandos.xyz', canvas.width - 60, canvas.height - 100);

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
  return lines;
}

// Share button component
function ShareButton({ 
  score, 
  username, 
  topStrength, 
  profileImage,
  theme 
}: ShareData & { theme: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    // Pre-filled tweet text
    const tweetText = `My @BrandOS_xyz brand score: ${score}/100 🎯

✨ "${topStrength}"

Check yours → brandos.xyz`;

    // Try to use Web Share API first (mobile friendly)
    if (navigator.share) {
      try {
        setIsGenerating(true);
        const imageBlob = await generateShareCard({ score, username, topStrength, profileImage });
        
        if (imageBlob) {
          const file = new File([imageBlob], `brandos-score-${username}.png`, { type: 'image/png' });
          await navigator.share({
            text: tweetText,
            files: [file],
          });
        } else {
          await navigator.share({ text: tweetText });
        }
      } catch (err) {
        // User cancelled or share failed, fall back to Twitter intent
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
          '_blank',
          'noopener,noreferrer'
        );
      } finally {
        setIsGenerating(false);
      }
    } else {
      // Desktop fallback - open Twitter intent
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  }, [score, username, topStrength, profileImage]);

  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    try {
      const imageBlob = await generateShareCard({ score, username, topStrength, profileImage });
      if (imageBlob) {
        const url = URL.createObjectURL(imageBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brandos-score-${username}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [score, username, topStrength, profileImage]);

  const handleCopyLink = useCallback(() => {
    const shareUrl = `https://brandos.xyz?ref=${username}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [username]);

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
      {/* Share on X Button */}
      <motion.button
        onClick={handleShare}
        disabled={isGenerating}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '14px 24px',
          background: '#000000',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          color: '#FFFFFF',
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '12px',
          letterSpacing: '0.1em',
          cursor: isGenerating ? 'wait' : 'pointer',
          opacity: isGenerating ? 0.7 : 1,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        {isGenerating ? 'GENERATING...' : 'SHARE ON X'}
      </motion.button>

      {/* Download Card Button */}
      <motion.button
        onClick={handleDownload}
        disabled={isGenerating}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '14px 24px',
          background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderRadius: '12px',
          color: theme === 'dark' ? '#FFFFFF' : '#000000',
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '12px',
          letterSpacing: '0.1em',
          cursor: isGenerating ? 'wait' : 'pointer',
          opacity: isGenerating ? 0.7 : 1,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7,10 12,15 17,10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        DOWNLOAD
      </motion.button>

      {/* Copy Link Button */}
      <motion.button
        onClick={handleCopyLink}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '14px 24px',
          background: copied ? 'rgba(16, 185, 129, 0.2)' : theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.4)' : theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderRadius: '12px',
          color: copied ? '#10B981' : theme === 'dark' ? '#FFFFFF' : '#000000',
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '12px',
          letterSpacing: '0.1em',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {copied ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12" />
            </svg>
            COPIED!
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            COPY LINK
          </>
        )}
      </motion.button>
    </div>
  );
}

interface XProfileData {
  name: string;
  username: string;
  description: string;
  profile_image_url: string;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  verified: boolean;
  location?: string;
  url?: string;
}

interface CreatorArchetype {
  primary: string;
  emoji: string;
  tagline?: string;
  description?: string;
  strengths?: string[];
  growthTip?: string;
}

interface BrandScoreResult {
  overallScore: number;
  phases: {
    define: { score: number; insights: string[] };
    check: { score: number; insights: string[] };
    generate: { score: number; insights: string[] };
    scale: { score: number; insights: string[] };
  };
  topStrengths: string[];
  topImprovements: string[];
  summary: string;
  archetype?: CreatorArchetype;
  brandKeywords?: string[];
  brandColors?: {
    primary: string;
    secondary: string;
  };
}

interface ScoreRevealProps {
  profile: XProfileData;
  brandScore: BrandScoreResult;
  isVisible: boolean;
  theme: string;
}

// Confetti particle component
function Confetti({ isActive }: { isActive: boolean }) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    delay: number;
  }>>([]);

  useEffect(() => {
    if (isActive) {
      const colors = ['#0047FF', '#4477FF', '#66a3ff', '#ffffff', '#00ff88', '#FFD700'];
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
      }));
      setParticles(newParticles);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ 
            x: '50%', 
            y: '50%', 
            scale: 0,
            opacity: 1,
          }}
          animate={{ 
            x: `${particle.x}%`, 
            y: `${particle.y}%`, 
            scale: [0, 1, 0.5],
            opacity: [1, 1, 0],
          }}
          transition={{
            type: 'spring',
            bounce: 0.4,
            duration: 1.5,
            delay: particle.delay,
          }}
          style={{
            position: 'absolute',
            width: '8px',
            height: '8px',
            background: particle.color,
            borderRadius: '2px',
          }}
        />
      ))}
    </div>
  );
}

// Animated score gauge
function ScoreGauge({ score, isVisible, theme }: { score: number; isVisible: boolean; theme: string }) {
  const motionScore = useMotionValue(0);
  const [currentScore, setCurrentScore] = useState(0);
  
  useEffect(() => {
    if (isVisible) {
      // Delay the animation for dramatic effect
      const timer = setTimeout(() => {
        const controls = animate(motionScore, score, {
          type: 'spring',
          bounce: 0.25,
          duration: 1.8,
        });
        
        const unsubscribe = motionScore.on('change', (v) => {
          setCurrentScore(Math.round(v));
        });
        
        return () => {
          controls.stop();
          unsubscribe();
        };
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, score, motionScore]);

  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentScore / 100) * circumference;
  
  const getScoreColor = (s: number) => {
    if (s >= 80) return '#10B981';
    if (s >= 60) return '#0047FF';
    if (s >= 40) return '#0047FF';
    return '#EF4444';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'EXCELLENT';
    if (s >= 60) return 'GOOD';
    if (s >= 40) return 'NEEDS WORK';
    return 'CRITICAL';
  };

  return (
    <div style={{ position: 'relative', width: '240px', height: '240px' }}>
      {/* Glow effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isVisible ? { opacity: 0.3, scale: 1 } : {}}
        transition={{ duration: 1, delay: 0.3 }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
          background: `radial-gradient(circle, ${getScoreColor(currentScore)}40 0%, transparent 70%)`,
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />

      {/* Background circle */}
      <svg width="240" height="240" viewBox="0 0 240 240">
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
          strokeWidth="16"
        />
        
        {/* Animated progress circle */}
        <motion.circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke={getScoreColor(currentScore)}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 120 120)"
          style={{
            filter: `drop-shadow(0 0 20px ${getScoreColor(currentScore)}80)`,
            transition: 'stroke 0.3s ease',
          }}
        />
      </svg>
      
      {/* Score display */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={isVisible ? { scale: 1 } : {}}
          transition={{ delay: 0.5, type: 'spring', bounce: 0.35, duration: 0.6 }}
        >
          <span
            style={{
              fontFamily: "'Helvetica Neue', sans-serif",
              fontSize: '72px',
              fontWeight: 700,
              color: theme === 'dark' ? '#FFFFFF' : '#000000',
              lineHeight: 1,
            }}
          >
            {currentScore}
          </span>
        </motion.div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ delay: 1.5 }}
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '12px',
            letterSpacing: '0.2em',
            color: getScoreColor(currentScore),
            display: 'block',
            marginTop: '8px',
          }}
        >
          {getScoreLabel(currentScore)}
        </motion.span>
      </div>
    </div>
  );
}

// Phase breakdown card
function PhaseCard({ 
  phase, 
  title, 
  score, 
  insights, 
  theme, 
  delay 
}: { 
  phase: string;
  title: string;
  score: number;
  insights: string[];
  theme: string;
  delay: number;
}) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return '#10B981';
    if (s >= 60) return '#0047FF';
    if (s >= 40) return '#0047FF';
    return '#EF4444';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', bounce: 0.3, duration: 0.6, delay }}
      style={{
        background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        borderRadius: '16px',
        padding: '20px',
        flex: 1,
        minWidth: '200px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: '#0047FF',
              background: 'rgba(0, 71, 255, 0.15)',
              padding: '4px 8px',
              borderRadius: '8px',
            }}
          >
            {phase}
          </span>
          <span
            style={{
              fontFamily: "'Helvetica Neue', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              color: theme === 'dark' ? '#FFFFFF' : '#000000',
            }}
          >
            {title}
          </span>
        </div>
        <span
          style={{
            fontFamily: "'Helvetica Neue', sans-serif",
            fontSize: '24px',
            fontWeight: 700,
            color: getScoreColor(score),
          }}
        >
          {score}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: '4px',
          background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderRadius: '2px',
          marginBottom: '12px',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.8, delay: delay + 0.2 }}
          style={{
            height: '100%',
            background: getScoreColor(score),
            borderRadius: '2px',
          }}
        />
      </div>

      {/* Top insight */}
      {insights[0] && (
        <p
          style={{
            fontFamily: "'Helvetica Neue', sans-serif",
            fontSize: '12px',
            color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {insights[0]}
        </p>
      )}
    </motion.div>
  );
}

export default function ScoreReveal({ profile, brandScore, isVisible, theme }: ScoreRevealProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible && brandScore.overallScore >= 80) {
      const timer = setTimeout(() => setShowConfetti(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, brandScore.overallScore]);

  // Get brand colors for gradient glows
  const brandColors = brandScore.brandColors || {
    primary: '#0047FF',
    secondary: '#10B981',
    accent: '#8B5CF6',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '48px',
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Left gradient glow */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: '300px',
          background: `radial-gradient(ellipse at left center, ${brandColors.primary}15 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Right gradient glow */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: '300px',
          background: `radial-gradient(ellipse at right center, ${brandColors.secondary}15 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Confetti for high scores */}
      <Confetti isActive={showConfetti} />

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <img
          src={profile.profile_image_url.replace('_normal', '_200x200')}
          alt={profile.name}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: `2px solid ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
          }}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                fontSize: '20px',
                fontWeight: 600,
                color: theme === 'dark' ? '#FFFFFF' : '#000000',
              }}
            >
              {profile.name}
            </span>
            {profile.verified && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0047FF">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
          </div>
          <span
            style={{
              fontFamily: "'Helvetica Neue', sans-serif",
              fontSize: '14px',
              color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            }}
          >
            @{profile.username}
          </span>
        </div>
      </motion.div>

      {/* Main score gauge */}
      <ScoreGauge score={brandScore.overallScore} isVisible={isVisible} theme={theme} />

      {/* Summary */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : {}}
        transition={{ delay: 2 }}
        style={{
          fontFamily: "'Helvetica Neue', sans-serif",
          fontSize: '18px',
          lineHeight: 1.6,
          color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
          textAlign: 'center',
          maxWidth: '600px',
          margin: 0,
        }}
      >
        {brandScore.summary}
      </motion.p>

      {/* Phase breakdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : {}}
        transition={{ delay: 2.5 }}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          width: '100%',
        }}
      >
        <PhaseCard
          phase="01"
          title="Define"
          score={brandScore.phases.define.score}
          insights={brandScore.phases.define.insights}
          theme={theme}
          delay={2.6}
        />
        <PhaseCard
          phase="02"
          title="Check"
          score={brandScore.phases.check.score}
          insights={brandScore.phases.check.insights}
          theme={theme}
          delay={2.7}
        />
        <PhaseCard
          phase="03"
          title="Generate"
          score={brandScore.phases.generate.score}
          insights={brandScore.phases.generate.insights}
          theme={theme}
          delay={2.8}
        />
        <PhaseCard
          phase="04"
          title="Scale"
          score={brandScore.phases.scale.score}
          insights={brandScore.phases.scale.insights}
          theme={theme}
          delay={2.9}
        />
      </motion.div>

      {/* Strengths and Improvements */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 3.2 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px',
          width: '100%',
        }}
      >
        {/* Strengths */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <h4
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '12px',
              letterSpacing: '0.15em',
              color: '#10B981',
              margin: 0,
              marginBottom: '16px',
            }}
          >
            STRENGTHS
          </h4>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {brandScore.topStrengths.map((strength, i) => (
              <li
                key={i}
                style={{
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontSize: '14px',
                  color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                  marginBottom: '8px',
                  paddingLeft: '20px',
                  position: 'relative',
                }}
              >
                <span style={{ position: 'absolute', left: 0, color: '#10B981' }}>✓</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <h4
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '12px',
              letterSpacing: '0.15em',
              color: '#0047FF',
              margin: 0,
              marginBottom: '16px',
            }}
          >
            IMPROVEMENTS
          </h4>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {brandScore.topImprovements.map((improvement, i) => (
              <li
                key={i}
                style={{
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontSize: '14px',
                  color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                  marginBottom: '8px',
                  paddingLeft: '20px',
                  position: 'relative',
                }}
              >
                <span style={{ position: 'absolute', left: 0, color: '#0047FF' }}>→</span>
                {improvement}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Share Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 3.5 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          width: '100%',
          paddingTop: '32px',
          borderTop: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h4
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '14px',
              letterSpacing: '0.15em',
              color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
              margin: 0,
              marginBottom: '8px',
            }}
          >
            SHARE YOUR SCORE
          </h4>
          <p
            style={{
              fontFamily: "'Helvetica Neue', sans-serif",
              fontSize: '15px',
              color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
              margin: 0,
            }}
          >
            Copy a personalized image and paste directly into X
          </p>
        </div>
        
        {/* New Shareable Score Card */}
        <ShareableScoreCard
          data={{
            score: brandScore.overallScore,
            username: profile.username,
            topStrength: brandScore.topStrengths[0] || 'Strong brand presence',
            archetype: brandScore.archetype ? {
              primary: brandScore.archetype.primary,
              emoji: brandScore.archetype.emoji,
              tagline: brandScore.archetype.tagline,
            } : undefined,
            keywords: brandScore.brandKeywords,
            brandColors: brandScore.brandColors,
          }}
          theme={theme}
        />
        
        {/* Legacy share options */}
        <div style={{ 
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: `1px dashed ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        }}>
          <p
            style={{
              fontFamily: "'Helvetica Neue', sans-serif",
              fontSize: '13px',
              color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              margin: 0,
              marginBottom: '12px',
              textAlign: 'center',
            }}
          >
            Or share with text only
          </p>
          <ShareButton
            score={brandScore.overallScore}
            username={profile.username}
            topStrength={brandScore.topStrengths[0] || 'Strong brand presence'}
            profileImage={profile.profile_image_url}
            theme={theme}
          />
        </div>
      </motion.div>
    </div>
  );
}



