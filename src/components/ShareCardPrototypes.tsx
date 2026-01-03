'use client';

// =============================================================================
// SHARE CARD PROTOTYPES
// Three distinct shareable card designs for BrandOS
// =============================================================================

export interface ShareCardData {
  brandScore: number;
  voiceConsistency: number;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  followersCount: number;
  influenceTier: 'Nano' | 'Micro' | 'Mid' | 'Macro' | 'Mega';
  archetype: string;
  archetypeEmoji: string;
  personalityType: string;
  personalitySummary: string;
  tone: {
    formality: number;
    energy: number;
    confidence: number;
    style: number;
  };
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export type CardStyle = 'billboard' | 'split' | 'wrapped';

// =============================================================================
// UTILITIES
// =============================================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 71, b: 255 };
}

// Check if a color is too light (for gradients - light colors wash out)
function isColorTooLight(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.75; // If luminance > 75%, it's too light for a vibrant gradient
}

// Check if a color is too dark (makes gradients look dull)
function isColorTooDark(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.25; // If luminance < 25%, it's too dark
}

// Boost a dark color to make it more vibrant
function boostDarkColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  // Increase saturation and brightness while preserving hue
  const boost = 1.8;
  const minValue = 60;
  const newR = Math.min(255, Math.max(minValue, Math.round(r * boost)));
  const newG = Math.min(255, Math.max(minValue, Math.round(g * boost)));
  const newB = Math.min(255, Math.max(minValue, Math.round(b * boost)));
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// Get the best gradient colors from brand colors
function getGradientColors(brandColors: ShareCardData['brandColors']): { color1: string; color2: string } {
  let primary = brandColors?.primary || '#0047FF';
  const secondary = brandColors?.secondary || '#9d4edd';
  const accent = brandColors?.accent || '#10B981';

  // If primary is too dark, boost it for better visibility
  if (isColorTooDark(primary)) {
    primary = boostDarkColor(primary);
  }

  // If secondary is too light (like white/cream backgrounds), use accent instead
  // If secondary is too dark, boost it
  let gradientSecondary = secondary;
  if (isColorTooLight(secondary)) {
    gradientSecondary = accent;
  } else if (isColorTooDark(secondary)) {
    gradientSecondary = boostDarkColor(secondary);
  }

  return {
    color1: primary,
    color2: gradientSecondary,
  };
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

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
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
// DESIGN A: THE BILLBOARD
// Giant score, minimal data, maximum impact
// =============================================================================

export async function generateBillboardCard(data: ShareCardData): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  canvas.width = 1200;
  canvas.height = 630;

  const { color1: primary, color2: secondary } = getGradientColors(data.brandColors);
  const { r: r2, g: g2, b: b2 } = hexToRgb(secondary);

  // Background gradient (user's brand colors)
  const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGradient.addColorStop(0, primary);
  bgGradient.addColorStop(0.5, secondary);
  bgGradient.addColorStop(1, `rgb(${Math.max(0, r2 - 40)}, ${Math.max(0, g2 - 40)}, ${Math.max(0, b2 - 40)})`);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Noise texture overlay
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  for (let i = 0; i < 3000; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  // Light leak effect top-right
  const lightLeak = ctx.createRadialGradient(canvas.width - 100, 100, 0, canvas.width - 100, 100, 400);
  lightLeak.addColorStop(0, 'rgba(255,255,255,0.25)');
  lightLeak.addColorStop(1, 'transparent');
  ctx.fillStyle = lightLeak;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Profile image if available
  let profileImage: HTMLImageElement | null = null;
  if (data.profileImageUrl) {
    const highResUrl = data.profileImageUrl.replace('_normal', '_200x200');
    profileImage = await loadImage(highResUrl);
  }

  // Username with optional profile image
  if (profileImage) {
    const imgSize = 40;
    const imgX = canvas.width / 2 - 80;
    ctx.save();
    ctx.beginPath();
    ctx.arc(imgX + imgSize / 2, 80, imgSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(profileImage, imgX, 80 - imgSize / 2, imgSize, imgSize);
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '600 24px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`@${data.username}`, imgX + imgSize + 12, 80);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '600 24px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`@${data.username}`, canvas.width / 2, 80);
  }

  // GIANT Score
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 220px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 8;
  ctx.fillText(String(data.brandScore), canvas.width / 2, canvas.height / 2 - 20);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Score label badge
  const label = getScoreLabel(data.brandScore);
  ctx.font = '700 16px "Helvetica Neue", Arial, sans-serif';
  const labelWidth = ctx.measureText(label).width + 48;
  const badgeX = canvas.width / 2 - labelWidth / 2;
  const badgeY = canvas.height / 2 + 100;

  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, labelWidth, 44, 22);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText(label, canvas.width / 2, badgeY + 24);

  // Bottom pills (Voice + Influence)
  const pillY = canvas.height - 80;

  // Voice pill
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 180, pillY, 170, 40, 20);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 14px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText(`Voice ${data.voiceConsistency}%`, canvas.width / 2 - 95, pillY + 22);

  // Influence pill
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 + 10, pillY, 170, 40, 20);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`${data.influenceTier} Tier`, canvas.width / 2 + 95, pillY + 22);

  // BrandOS logo bottom center
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '500 14px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('brandos.xyz', canvas.width / 2, canvas.height - 24);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  });
}

// =============================================================================
// DESIGN B: THE SPLIT
// Identity on left, score on right with gradient
// =============================================================================

export async function generateSplitCard(data: ShareCardData): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  canvas.width = 1200;
  canvas.height = 630;

  const { color1: primary, color2: secondary } = getGradientColors(data.brandColors);
  const { r: r2, g: g2, b: b2 } = hexToRgb(secondary);

  const splitX = Math.floor(canvas.width * 0.45);

  // LEFT PANEL - Dark
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.roundRect(0, 0, splitX, canvas.height, [24, 0, 0, 24]);
  ctx.fill();

  // Subtle left panel texture
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for (let i = 0; i < 500; i++) {
    ctx.fillRect(Math.random() * splitX, Math.random() * canvas.height, 1, 1);
  }

  // RIGHT PANEL - Gradient
  const rightGradient = ctx.createLinearGradient(splitX, 0, canvas.width, canvas.height);
  rightGradient.addColorStop(0, primary);
  rightGradient.addColorStop(0.6, secondary);
  rightGradient.addColorStop(1, `rgb(${Math.max(0, r2 - 50)}, ${Math.max(0, g2 - 50)}, ${Math.max(0, b2 - 50)})`);
  ctx.fillStyle = rightGradient;
  ctx.beginPath();
  ctx.roundRect(splitX, 0, canvas.width - splitX, canvas.height, [0, 24, 24, 0]);
  ctx.fill();

  // Light leak on right panel
  const lightLeak = ctx.createRadialGradient(canvas.width, 0, 0, canvas.width, 0, 350);
  lightLeak.addColorStop(0, 'rgba(255,255,255,0.3)');
  lightLeak.addColorStop(1, 'transparent');
  ctx.fillStyle = lightLeak;
  ctx.fillRect(splitX, 0, canvas.width - splitX, canvas.height);

  // Load profile image
  let profileImage: HTMLImageElement | null = null;
  if (data.profileImageUrl) {
    const highResUrl = data.profileImageUrl.replace('_normal', '_200x200');
    profileImage = await loadImage(highResUrl);
  }

  // LEFT PANEL CONTENT
  const leftPadding = 50;

  // BrandOS Logo
  ctx.font = '700 italic 28px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Brand', leftPadding, 60);
  const brandWidth = ctx.measureText('Brand').width;
  ctx.fillStyle = primary;
  ctx.font = '700 28px monospace';
  ctx.fillText('OS', leftPadding + brandWidth, 60);

  // Profile image + Username
  let textStartY = 110;
  if (profileImage) {
    const imgSize = 48;
    ctx.save();
    ctx.beginPath();
    ctx.arc(leftPadding + imgSize / 2, 120, imgSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(profileImage, leftPadding, 120 - imgSize / 2, imgSize, imgSize);
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(leftPadding + imgSize / 2, 120, imgSize / 2 + 1, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '500 16px "Helvetica Neue", Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(`@${data.username}`, leftPadding + imgSize + 14, 120);
    textStartY = 180;
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '500 16px "Helvetica Neue", Arial, sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`@${data.username}`, leftPadding, textStartY);
    textStartY = 160;
  }

  // Archetype with emoji
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 32px "Helvetica Neue", Arial, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${data.archetypeEmoji} ${data.archetype}`, leftPadding, textStartY + 35);

  // Personality summary (word wrapped, limited to 4 lines max)
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '400 15px "Helvetica Neue", Arial, sans-serif';
  // Truncate summary to ~180 chars to prevent overflow
  const fullSummary = data.personalitySummary || 'You bring ideas to life with precision and purpose. Your community trusts you to deliver.';
  const summary = fullSummary.length > 180 ? fullSummary.substring(0, 180) + '...' : fullSummary;
  const words = summary.split(' ');
  let line = '';
  let lineY = textStartY + 90;
  const maxWidth = splitX - leftPadding * 2;
  const maxLines = 4;
  let lineCount = 0;

  for (const word of words) {
    const testLine = line + word + ' ';
    if (ctx.measureText(testLine).width > maxWidth) {
      lineCount++;
      if (lineCount > maxLines) break;
      ctx.fillText(line.trim(), leftPadding, lineY);
      line = word + ' ';
      lineY += 24;
    } else {
      line = testLine;
    }
  }
  if (lineCount <= maxLines && line.trim()) {
    ctx.fillText(line.trim(), leftPadding, lineY);
  }

  // Divider line - positioned after summary with proper spacing
  const dividerY = 360;
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftPadding, dividerY);
  ctx.lineTo(splitX - leftPadding, dividerY);
  ctx.stroke();

  // Metrics on left - start below divider
  const engagement = Math.round((data.tone.formality + data.tone.energy + data.tone.confidence + data.tone.style) / 4);
  const metrics = [
    { label: 'Voice Consistency', value: `${data.voiceConsistency}%` },
    { label: 'Influence Tier', value: data.influenceTier },
    { label: 'Engagement', value: `${engagement}%` },
  ];

  let metricY = dividerY + 35;
  metrics.forEach((m) => {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '400 13px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(m.label, leftPadding, metricY);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 20px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText(m.value, leftPadding, metricY + 24);
    metricY += 65;
  });

  // brandos.xyz at bottom left
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '500 12px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText('brandos.xyz', leftPadding, canvas.height - 30);

  // RIGHT PANEL CONTENT
  const rightCenterX = splitX + (canvas.width - splitX) / 2;

  // SCORE
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 160px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 30;
  ctx.fillText(String(data.brandScore), rightCenterX, canvas.height / 2 - 40);
  ctx.shadowBlur = 0;

  // Score label
  const label = getScoreLabel(data.brandScore);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  const labelWidth = 140;
  ctx.beginPath();
  ctx.roundRect(rightCenterX - labelWidth / 2, canvas.height / 2 + 40, labelWidth, 40, 20);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 14px "Helvetica Neue", Arial, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rightCenterX, canvas.height / 2 + 60);

  // "Brand Score" label at bottom of right panel
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '500 14px "Helvetica Neue", Arial, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('BRAND SCORE', rightCenterX, canvas.height - 50);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  });
}

// =============================================================================
// DESIGN C: THE WRAPPED
// Spotify Wrapped-inspired vertical flow
// =============================================================================

export async function generateWrappedCard(data: ShareCardData): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  canvas.width = 1200;
  canvas.height = 630;

  const { color1: primary, color2: secondary } = getGradientColors(data.brandColors);
  const { r, g, b } = hexToRgb(primary);
  const { r: r2, g: g2, b: b2 } = hexToRgb(secondary);

  // Background - dark base
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Gradient blob behind score area
  const blobGradient = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2 - 50,
    0,
    canvas.width / 2,
    canvas.height / 2 - 50,
    400
  );
  blobGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.5)`);
  blobGradient.addColorStop(0.5, `rgba(${r2}, ${g2}, ${b2}, 0.3)`);
  blobGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = blobGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Noise
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  for (let i = 0; i < 2000; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  // TOP HEADER BAR
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(0, 0, canvas.width, 70);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 70);
  ctx.lineTo(canvas.width, 70);
  ctx.stroke();

  // BrandOS logo left
  ctx.font = '700 italic 22px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Brand', 40, 35);
  const brandWidth = ctx.measureText('Brand').width;
  ctx.fillStyle = primary;
  ctx.font = '700 22px monospace';
  ctx.fillText('OS', 40 + brandWidth, 35);

  // Load profile image
  let profileImage: HTMLImageElement | null = null;
  if (data.profileImageUrl) {
    const highResUrl = data.profileImageUrl.replace('_normal', '_200x200');
    profileImage = await loadImage(highResUrl);
  }

  // Username + tier right (with optional profile image)
  if (profileImage) {
    const imgSize = 32;
    const imgX = canvas.width - 250;
    ctx.save();
    ctx.beginPath();
    ctx.arc(imgX + imgSize / 2, 35, imgSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(profileImage, imgX, 35 - imgSize / 2, imgSize, imgSize);
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '500 16px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`@${data.username} • ${data.influenceTier}`, imgX + imgSize + 10, 35);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '500 16px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`@${data.username} • ${data.influenceTier} Tier`, canvas.width - 40, 35);
  }

  // SCORE CENTER
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 180px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
  ctx.shadowBlur = 60;
  ctx.fillText(String(data.brandScore), canvas.width / 2, 220);
  ctx.shadowBlur = 0;

  // Score label
  const label = getScoreLabel(data.brandScore);
  ctx.font = '700 14px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = primary;
  ctx.fillText(label, canvas.width / 2, 320);

  // ARCHETYPE
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 36px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText(`${data.archetypeEmoji} ${data.archetype.toUpperCase()}`, canvas.width / 2, 390);

  // Summary text
  const shortSummary = data.personalitySummary
    ? `"${data.personalitySummary.substring(0, 60)}${data.personalitySummary.length > 60 ? '...' : ''}"`
    : '"You bring ideas to life with precision and purpose."';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '400 16px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText(shortSummary, canvas.width / 2, 440);

  // BOTTOM TONE STRIP
  const stripY = canvas.height - 100;
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(0, stripY, canvas.width, 100);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.moveTo(0, stripY);
  ctx.lineTo(canvas.width, stripY);
  ctx.stroke();

  // Tone bars
  const tones = [
    { label: 'Voice', value: data.voiceConsistency, color: '#10B981' },
    { label: 'Energy', value: data.tone.energy, color: primary },
    { label: 'Confidence', value: data.tone.confidence, color: '#F59E0B' },
    { label: 'Style', value: data.tone.style, color: secondary },
  ];

  const barWidth = 200;
  const barGap = 60;
  const totalWidth = barWidth * 4 + barGap * 3;
  let barX = (canvas.width - totalWidth) / 2;

  tones.forEach((tone) => {
    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '500 11px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(tone.label, barX, stripY + 30);

    // Value
    ctx.textAlign = 'right';
    ctx.fillText(`${tone.value}%`, barX + barWidth, stripY + 30);

    // Bar background
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.roundRect(barX, stripY + 45, barWidth, 8, 4);
    ctx.fill();

    // Bar fill
    ctx.fillStyle = tone.color;
    ctx.beginPath();
    ctx.roundRect(barX, stripY + 45, barWidth * (tone.value / 100), 8, 4);
    ctx.fill();

    barX += barWidth + barGap;
  });

  // brandos.xyz footer
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '500 12px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('brandos.xyz', canvas.width / 2, stripY + 85);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  });
}

// =============================================================================
// UNIFIED GENERATOR
// =============================================================================

export async function generateShareCard(
  data: ShareCardData,
  style: CardStyle
): Promise<Blob | null> {
  switch (style) {
    case 'billboard':
      return generateBillboardCard(data);
    case 'split':
      return generateSplitCard(data);
    case 'wrapped':
      return generateWrappedCard(data);
    default:
      return generateBillboardCard(data);
  }
}

// =============================================================================
// CLIPBOARD COPY
// =============================================================================

export async function copyCardToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to copy image to clipboard:', error);
    return false;
  }
}

// =============================================================================
// DATA MAPPER (from existing BentoShareCardData)
// =============================================================================

export function mapToShareCardData(bentoData: {
  brandScore: number;
  voiceConsistency: number;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  followersCount: number;
  influenceTier: 'Nano' | 'Micro' | 'Mid' | 'Macro' | 'Mega';
  archetype: string;
  archetypeEmoji: string;
  personalityType: string;
  personalitySummary: string;
  tone: {
    formality: number;
    energy: number;
    confidence: number;
    style: number;
  };
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}): ShareCardData {
  return {
    brandScore: bentoData.brandScore,
    voiceConsistency: bentoData.voiceConsistency,
    username: bentoData.username,
    displayName: bentoData.displayName,
    profileImageUrl: bentoData.profileImageUrl,
    followersCount: bentoData.followersCount,
    influenceTier: bentoData.influenceTier,
    archetype: bentoData.archetype,
    archetypeEmoji: bentoData.archetypeEmoji,
    personalityType: bentoData.personalityType,
    personalitySummary: bentoData.personalitySummary,
    tone: bentoData.tone,
    brandColors: bentoData.brandColors,
  };
}
