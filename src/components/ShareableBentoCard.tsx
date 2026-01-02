'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// =============================================================================
// TYPES
// =============================================================================

export interface BentoShareCardData {
  brandScore: number;
  voiceConsistency: number;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  tone: {
    formality: number;
    energy: number;
    confidence: number;
    style: number;
  };
  archetype: string;
  archetypeEmoji: string;
  // Personality system (Brand Guardian)
  personalityType: string;
  personalityEmoji: string;
  personalitySummary: string;
  influenceTier: 'Nano' | 'Micro' | 'Mid' | 'Macro' | 'Mega';
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  contentPillars?: {
    name: string;
    frequency: number;
    avgEngagement: number;
  }[];
}

interface ShareableBentoCardProps {
  data: BentoShareCardData;
  theme: string;
  onCopied?: () => void;
}

// =============================================================================
// CONSTANTS - Card accent colors (inspired by mockup)
// =============================================================================

const CARD_COLORS = {
  brandScore: '#10B981',    // Green
  toneProfile: '#6366F1',   // Blue/Indigo
  voiceConsistency: '#9CA3AF', // Gray
  followers: '#F97316',     // Orange
  influence: '#8B5CF6',     // Purple
  engagement: '#22C55E',    // Green
  archetype: '#EAB308',     // Yellow
};

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

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
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
    img.src = url;
  });
}

// =============================================================================
// CARD RENDERING FUNCTIONS
// =============================================================================

function renderCardBase(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  accentColor?: string
): void {
  const radius = 16;

  // Card background with subtle gradient
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);

  if (accentColor) {
    const rgb = hexToRgb(accentColor);
    if (rgb) {
      const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
      gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    }
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  }
  ctx.fill();

  // Card border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function renderToneProfileCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  tone: { formality: number; energy: number; confidence: number; style: number }
): void {
  renderCardBase(ctx, x, y, width, height, CARD_COLORS.toneProfile);

  const padding = 16;
  const barHeight = 6;
  const barGap = 32;

  // Title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '600 9px "Helvetica Neue", Arial, sans-serif';
  ctx.letterSpacing = '0.1em';
  ctx.textAlign = 'left';
  ctx.fillText('TONE PROFILE', x + padding, y + padding + 8);

  const tones = [
    { label: 'Formality', value: tone.formality },
    { label: 'Energy', value: tone.energy },
    { label: 'Confidence', value: tone.confidence },
    { label: 'Style', value: tone.style },
  ];

  let barY = y + padding + 28;
  const barMaxWidth = width - padding * 2;

  tones.forEach(({ label, value }) => {
    // Label and value
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '400 10px "Helvetica Neue", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + padding, barY - 4);

    ctx.textAlign = 'right';
    ctx.fillText(`${value}%`, x + width - padding, barY - 4);

    // Bar background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(x + padding, barY, barMaxWidth, barHeight, 3);
    ctx.fill();

    // Bar fill
    const fillWidth = (value / 100) * barMaxWidth;
    const gradient = ctx.createLinearGradient(x + padding, 0, x + padding + fillWidth, 0);
    gradient.addColorStop(0, CARD_COLORS.toneProfile);
    gradient.addColorStop(1, '#818CF8');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x + padding, barY, fillWidth, barHeight, 3);
    ctx.fill();

    barY += barGap;
  });
}

function renderVoiceConsistencyCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  consistency: number
): void {
  renderCardBase(ctx, x, y, width, height);

  const centerX = x + width / 2;
  const centerY = y + height / 2 + 8;
  const radius = 45;

  // Title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '600 9px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VOICE', centerX, y + 20);

  // Background circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Progress arc
  const progressAngle = (consistency / 100) * Math.PI * 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + progressAngle);
  ctx.strokeStyle = CARD_COLORS.voiceConsistency;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Percentage text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px "Helvetica Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${consistency}%`, centerX, centerY);

  // Label below
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '400 9px "Helvetica Neue", sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Consistency', centerX, y + height - 16);
}

function renderEngagementCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  pillars: { name: string; frequency: number; avgEngagement: number }[]
): void {
  renderCardBase(ctx, x, y, width, height, CARD_COLORS.engagement);

  const padding = 16;

  // Title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '600 9px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ENGAGEMENT', x + padding, y + padding + 8);

  // Dot matrix visualization
  const dotSize = 8;
  const dotGap = 4;
  const cols = 7;
  const rows = 5;
  const startX = x + padding;
  const startY = y + padding + 28;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const dotX = startX + col * (dotSize + dotGap);
      const dotY = startY + row * (dotSize + dotGap);

      // Random engagement based on pillars data
      const hasEngagement = Math.random() > 0.3;
      const isHighEngagement = Math.random() > 0.6;

      ctx.beginPath();
      ctx.arc(dotX + dotSize / 2, dotY + dotSize / 2, dotSize / 2, 0, Math.PI * 2);

      if (hasEngagement) {
        ctx.fillStyle = isHighEngagement ? CARD_COLORS.engagement : 'rgba(34, 197, 94, 0.5)';
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      }
      ctx.fill();
    }
  }

  // Stats at bottom
  const avgEngagement = pillars.length > 0
    ? Math.round(pillars.reduce((sum, p) => sum + p.avgEngagement, 0) / pillars.length)
    : 0;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '400 9px "Helvetica Neue", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${pillars.length} pillars`, x + padding, y + height - 16);

  ctx.textAlign = 'right';
  ctx.fillText(`~${formatNumber(avgEngagement)} avg`, x + width - padding, y + height - 16);
}

function renderInfluenceTierCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  tier: string,
  followersCount: number
): void {
  renderCardBase(ctx, x, y, width, height, CARD_COLORS.influence);

  const padding = 16;
  const centerX = x + width / 2;

  // Title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '600 9px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('INFLUENCE', centerX, y + padding + 8);

  // Tier badge
  const tiers = ['Nano', 'Micro', 'Mid', 'Macro', 'Mega'];
  const tierIndex = tiers.indexOf(tier);

  // Tier bars
  const barWidth = 24;
  const barGap = 6;
  const totalBarsWidth = (barWidth * 5) + (barGap * 4);
  const barsStartX = centerX - totalBarsWidth / 2;
  const barsY = y + 50;

  tiers.forEach((t, i) => {
    const barX = barsStartX + i * (barWidth + barGap);
    const barHeight = 8 + (i * 6); // Progressive height
    const isActive = i <= tierIndex;

    ctx.fillStyle = isActive ? CARD_COLORS.influence : 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(barX, barsY + (30 - barHeight), barWidth, barHeight, 4);
    ctx.fill();
  });

  // Tier name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px "Helvetica Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(tier, centerX, y + height - 40);

  // Follower count
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '400 10px "Helvetica Neue", sans-serif';
  ctx.fillText(`${formatNumber(followersCount)} followers`, centerX, y + height - 20);
}

function renderBrandScoreCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  score: number,
  tone: { formality: number; energy: number; confidence: number; style: number }
): void {
  renderCardBase(ctx, x, y, width, height, CARD_COLORS.brandScore);

  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const scoreColors = getScoreColors(score);

  // Title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '600 10px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BRAND SCORE', centerX, y + 24);

  // Glow effect
  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100);
  glowGradient.addColorStop(0, `${scoreColors.primary}30`);
  glowGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
  ctx.fill();

  // Concentric arcs for each tone dimension
  const arcs = [
    { value: tone.formality, radius: 85, color: scoreColors.primary },
    { value: tone.energy, radius: 70, color: '#059669' },
    { value: tone.confidence, radius: 55, color: '#34D399' },
    { value: tone.style, radius: 40, color: '#6EE7B7' },
  ];

  arcs.forEach(({ value, radius, color }) => {
    // Background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Value arc
    const angle = (value / 100) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + angle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();
  });

  // Score number
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 56px "Helvetica Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(score), centerX, centerY - 5);

  // Score label
  ctx.fillStyle = scoreColors.primary;
  ctx.font = '600 12px "Helvetica Neue", Arial, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(getScoreLabel(score), centerX, centerY + 35);

  // /100 text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '400 14px "Helvetica Neue", sans-serif';
  ctx.fillText('/100', centerX, centerY + 55);
}

function renderFollowersCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  followersCount: number
): void {
  renderCardBase(ctx, x, y, width, height, CARD_COLORS.followers);

  const centerX = x + width / 2;
  const padding = 16;

  // Title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '600 9px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FOLLOWERS', centerX, y + padding + 8);

  // Large number
  ctx.fillStyle = CARD_COLORS.followers;
  ctx.font = 'bold 36px "Helvetica Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatNumber(followersCount), centerX, y + height / 2 + 5);

  // Trend indicator (fake positive)
  ctx.fillStyle = '#22C55E';
  ctx.font = '400 11px "Helvetica Neue", sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('trending', centerX, y + height - 16);
}

function renderArchetypeCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  archetype: string,
  emoji: string
): void {
  renderCardBase(ctx, x, y, width, height, CARD_COLORS.archetype);

  const padding = 20;

  // Large emoji
  ctx.font = '48px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x + padding, y + height / 2 - 10);

  // Archetype name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px "Helvetica Neue", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(archetype, x + padding + 65, y + height / 2 - 5);

  // CTA
  ctx.fillStyle = CARD_COLORS.archetype;
  ctx.font = '600 12px "Helvetica Neue", sans-serif';
  ctx.fillText('brandos.xyz', x + padding + 65, y + height / 2 + 18);

  // Arrow
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '400 14px "Helvetica Neue", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Get yours →', x + width - padding, y + height / 2 + 5);
}

// =============================================================================
// MAIN CANVAS GENERATOR
// =============================================================================

export async function generateBentoShareImage(data: BentoShareCardData): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Twitter card dimensions
  canvas.width = 1200;
  canvas.height = 630;

  // Load profile image if available
  let profileImage: HTMLImageElement | null = null;
  if (data.profileImageUrl) {
    const highResUrl = data.profileImageUrl.replace('_normal', '_200x200');
    profileImage = await loadImage(highResUrl);
  }

  // ==========================================================================
  // BACKGROUND
  // ==========================================================================
  const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGradient.addColorStop(0, '#0a0a12');
  bgGradient.addColorStop(0.3, '#0f0f18');
  bgGradient.addColorStop(0.7, '#0a0a14');
  bgGradient.addColorStop(1, '#050508');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Brand color accent blobs
  const primaryRgb = hexToRgb(data.brandColors.primary);
  if (primaryRgb) {
    const blob1 = ctx.createRadialGradient(canvas.width - 150, 100, 0, canvas.width - 150, 100, 350);
    blob1.addColorStop(0, `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.2)`);
    blob1.addColorStop(1, 'transparent');
    ctx.fillStyle = blob1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Subtle noise texture
  ctx.fillStyle = 'rgba(255, 255, 255, 0.012)';
  for (let i = 0; i < 1500; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  // ==========================================================================
  // HEADER
  // ==========================================================================
  const headerY = 45;
  let textStartX = 40;

  if (profileImage) {
    const imgSize = 48;
    const imgX = 40;
    const imgY = headerY - imgSize / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(profileImage, imgX, imgY, imgSize, imgSize);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2 + 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    textStartX = imgX + imgSize + 14;
  }

  // Display name and username
  if (data.displayName) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 20px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.displayName, textStartX, headerY - 10);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '400 14px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText(`@${data.username}`, textStartX, headerY + 12);
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 20px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`@${data.username}`, textStartX, headerY);
  }

  // BrandOS logo (top right)
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'right';
  ctx.font = 'italic 700 24px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Brand', canvas.width - 40, 50);
  ctx.font = '700 24px "Courier New", monospace';
  ctx.fillStyle = data.brandColors.primary;
  ctx.fillText('OS', canvas.width - 40, 50);

  // ==========================================================================
  // BENTO GRID LAYOUT
  // ==========================================================================
  const gridPadding = 24;
  const cardGap = 12;
  const gridStartY = 85;

  // Card dimensions
  const smallCardWidth = 180;
  const smallCardHeight = 160;
  const largeCardWidth = 280;
  const largeCardHeight = smallCardHeight * 2 + cardGap;
  const wideCardWidth = smallCardWidth * 2 + cardGap;

  // Row 1: 4 small cards + start of large card
  const row1Y = gridStartY;
  renderToneProfileCard(ctx, gridPadding, row1Y, smallCardWidth, smallCardHeight, data.tone);
  renderVoiceConsistencyCard(ctx, gridPadding + smallCardWidth + cardGap, row1Y, smallCardWidth, smallCardHeight, data.voiceConsistency);
  renderEngagementCard(ctx, gridPadding + (smallCardWidth + cardGap) * 2, row1Y, smallCardWidth, smallCardHeight, data.contentPillars || []);
  renderInfluenceTierCard(ctx, gridPadding + (smallCardWidth + cardGap) * 3, row1Y, smallCardWidth, smallCardHeight, data.influenceTier, data.followersCount);

  // Large brand score card (right side, spans 2 rows)
  const largeCardX = gridPadding + (smallCardWidth + cardGap) * 4;
  renderBrandScoreCard(ctx, largeCardX, row1Y, largeCardWidth, largeCardHeight, data.brandScore, data.tone);

  // Row 2: 2 cards below first 4
  const row2Y = row1Y + smallCardHeight + cardGap;
  renderFollowersCard(ctx, gridPadding, row2Y, smallCardWidth, smallCardHeight, data.followersCount);
  renderArchetypeCard(ctx, gridPadding + smallCardWidth + cardGap, row2Y, wideCardWidth + smallCardWidth + cardGap, smallCardHeight, data.archetype, data.archetypeEmoji);

  // ==========================================================================
  // FOOTER
  // ==========================================================================
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '400 11px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Analyze your brand at brandos.xyz', gridPadding, canvas.height - 20);

  // Convert to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  });
}

// =============================================================================
// COPY TO CLIPBOARD
// =============================================================================

export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to copy image to clipboard:', error);
    return false;
  }
}

// =============================================================================
// REACT COMPONENT
// =============================================================================

export default function ShareableBentoCard({ data, theme, onCopied }: ShareableBentoCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copySupported, setCopySupported] = useState(true);

  useEffect(() => {
    const checkSupport = async () => {
      try {
        if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
          const permission = await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
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

  const handleCopyToClipboard = useCallback(async () => {
    setIsGenerating(true);

    try {
      const blob = await generateBentoShareImage(data);
      if (!blob) throw new Error('Failed to generate image');

      const success = await copyImageToClipboard(blob);

      if (success) {
        setIsCopied(true);
        onCopied?.();
        setTimeout(() => setIsCopied(false), 3000);
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brandos-bento-${data.username}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating bento card:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [data, onCopied]);

  const handlePreview = useCallback(async () => {
    setIsGenerating(true);
    try {
      const blob = await generateBentoShareImage(data);
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
      const blob = await generateBentoShareImage(data);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brandos-bento-${data.username}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [data]);

  const scoreColors = getScoreColors(data.brandScore);

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
            {copySupported ? 'COPY BENTO TO X' : 'DOWNLOAD BENTO'}
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
                alt="Bento card preview"
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
                  1200 x 630 px - Bento Card
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
            Bento card copied! Paste in your X post
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// =============================================================================
// DATA MAPPING HELPER
// =============================================================================

export function mapToBentoData(
  profile: {
    username: string;
    name?: string;
    profile_image_url?: string;
    public_metrics?: {
      followers_count: number;
      following_count: number;
      tweet_count: number;
    };
  },
  brandScore: number,
  generatedDNA: {
    tone?: { minimal: number; playful: number; bold: number; experimental: number };
    archetype?: string;
    archetypeEmoji?: string;
    personalityType?: string;
    personalityEmoji?: string;
    personalitySummary?: string;
    colors?: { primary: string; secondary: string; accent: string };
    contentPillars?: { name: string; frequency: number; avgEngagement: number }[];
    performanceInsights?: { voiceConsistency?: number };
  }
): BentoShareCardData {
  const followersCount = profile.public_metrics?.followers_count || 0;

  // Calculate influence tier
  let influenceTier: 'Nano' | 'Micro' | 'Mid' | 'Macro' | 'Mega' = 'Nano';
  if (followersCount >= 1000000) influenceTier = 'Mega';
  else if (followersCount >= 100000) influenceTier = 'Macro';
  else if (followersCount >= 10000) influenceTier = 'Mid';
  else if (followersCount >= 1000) influenceTier = 'Micro';

  return {
    brandScore,
    voiceConsistency: generatedDNA.performanceInsights?.voiceConsistency || 75,
    username: profile.username,
    displayName: profile.name,
    profileImageUrl: profile.profile_image_url,
    followersCount,
    followingCount: profile.public_metrics?.following_count || 0,
    tweetCount: profile.public_metrics?.tweet_count || 0,
    tone: {
      formality: generatedDNA.tone?.minimal || 50,
      energy: generatedDNA.tone?.playful || 50,
      confidence: generatedDNA.tone?.bold || 50,
      style: generatedDNA.tone?.experimental || 50,
    },
    archetype: generatedDNA.archetype || 'Creator',
    archetypeEmoji: generatedDNA.archetypeEmoji || '✨',
    // Personality system
    personalityType: generatedDNA.personalityType || 'The Builder',
    personalityEmoji: generatedDNA.personalityEmoji || '🛠️',
    personalitySummary: generatedDNA.personalitySummary || 'You bring ideas to life with precision and purpose. Your community trusts you to deliver substance over hype. Keep building—the market rewards those who ship.',
    influenceTier,
    brandColors: generatedDNA.colors || {
      primary: '#0047FF',
      secondary: '#1a1a1a',
      accent: '#10B981',
    },
    contentPillars: generatedDNA.contentPillars,
  };
}
