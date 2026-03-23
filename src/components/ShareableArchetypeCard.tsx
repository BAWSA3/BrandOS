/**
 * ShareableArchetypeCard — Canvas-based 1200x630 shareable image
 *
 * Layout matches user's template design:
 * Light gray bg, 3D voxel icon on left (~40%), text info on right,
 * mybrandos.app top-left, BrandOS logo bottom-right.
 * Universal template — works for all 8 archetypes.
 */

export interface ArchetypeCardData {
  username: string;
  displayName: string;
  profileImageUrl?: string;
  archetype: string;
  emoji: string;
  tagline: string;
  description?: string;
  tier: number;
  tierLabel: string;
  color: string;
  rarity: number;
  traits?: string[];
  strengths?: string[];
}

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = 3
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines) break;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine && lines.length < maxLines) lines.push(currentLine);
  return lines;
}

export async function generateArchetypeImage(data: ArchetypeCardData): Promise<Blob | null> {
  try {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const W = 1200;
  const H = 630;
  canvas.width = W;
  canvas.height = H;

  // Load assets
  const archetypeIcon = await loadImage(
    `${window.location.origin}/archetypes/${data.archetype}.png`
  );
  let profileImage: HTMLImageElement | null = null;
  if (data.profileImageUrl) {
    profileImage = await loadImage(data.profileImageUrl.replace('_normal', '_200x200'));
  }

  // =====================================================================
  // BACKGROUND — Light gray, clean
  // =====================================================================
  ctx.fillStyle = '#E8E8E8';
  ctx.fillRect(0, 0, W, H);

  // =====================================================================
  // TOP LEFT — mybrandos.app
  // =====================================================================
  ctx.font = '500 14px "Courier New", monospace';
  ctx.fillStyle = '#555';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('MYBRANDOS.APP', 40, 48);

  // =====================================================================
  // LEFT SIDE — 3D Voxel Icon (~40% of card)
  // =====================================================================
  if (archetypeIcon) {
    const iconSize = 360;
    const iconX = 40;
    const iconY = H / 2 - iconSize / 2 + 10;

    // Draw the icon — white bg blends with light gray naturally
    ctx.drawImage(archetypeIcon, iconX, iconY, iconSize, iconSize);
  }

  // =====================================================================
  // RIGHT SIDE — Text info
  // =====================================================================
  const textX = 460;
  const textMaxW = W - textX - 50;
  let y = 140;

  // Archetype name — large bold
  ctx.font = '900 italic 72px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#111';
  ctx.textAlign = 'left';
  ctx.fillText(data.archetype, textX, y);

  // User PFP + handle — right of archetype name, top area
  const nameWidth = ctx.measureText(data.archetype).width;
  const pfpAreaX = textX + nameWidth + 20;

  if (profileImage && pfpAreaX + 40 < W - 50) {
    const pfpSize = 32;
    const pfpY = y - 42;

    // Circular PFP
    ctx.save();
    ctx.beginPath();
    ctx.arc(pfpAreaX + pfpSize / 2, pfpY + pfpSize / 2, pfpSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(profileImage, pfpAreaX, pfpY, pfpSize, pfpSize);
    ctx.restore();

    // Handle below PFP
    ctx.font = '600 13px "Courier New", monospace';
    ctx.fillStyle = '#666';
    ctx.fillText(`@${data.username}`, pfpAreaX, pfpY + pfpSize + 16);
  } else {
    // Handle next to archetype name if no room for PFP
    ctx.font = '600 14px "Courier New", monospace';
    ctx.fillStyle = '#666';
    y += 28;
    ctx.fillText(`@${data.username}`, textX, y);
  }

  // =====================================================================
  // DESCRIPTION
  // =====================================================================
  y = 210;
  ctx.font = '400 16px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#444';

  const descText = data.description || data.tagline;
  const descLines = wrapText(ctx, descText, textMaxW, 4);
  descLines.forEach((line) => {
    ctx.fillText(line, textX, y);
    y += 24;
  });

  // =====================================================================
  // TRAITS · RARITY · STRENGTHS — bottom row
  // =====================================================================
  y = H - 140;

  const traits = data.traits || [];
  const strengths = data.strengths || [];

  // Build info pills
  const pills: string[] = [];

  // Add traits (first 2)
  traits.slice(0, 2).forEach((t) => pills.push(t));

  // Add rarity
  pills.push(`Top ${data.rarity}%`);

  // Add strengths (first 1)
  if (strengths.length > 0) pills.push(strengths[0]);

  ctx.font = '600 13px "Courier New", monospace';
  let pillX = textX;

  pills.forEach((pill) => {
    const pillW = ctx.measureText(pill.toUpperCase()).width + 24;
    const pillH = 30;

    // Pill bg
    ctx.fillStyle = '#D5D5D5';
    drawRoundRect(ctx, pillX, y, pillW, pillH, pillH / 2);
    ctx.fill();

    // Pill text
    ctx.fillStyle = '#444';
    ctx.textBaseline = 'middle';
    ctx.fillText(pill.toUpperCase(), pillX + 12, y + pillH / 2);
    ctx.textBaseline = 'alphabetic';

    pillX += pillW + 8;

    // Wrap to next row if needed
    if (pillX + 100 > W - 50) {
      pillX = textX;
      y += 38;
    }
  });

  // =====================================================================
  // BOTTOM RIGHT — BrandOS logo
  // =====================================================================
  ctx.textAlign = 'right';
  ctx.font = '800 italic 32px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#111';
  ctx.fillText('Brand', W - 95, H - 40);

  const brandW = ctx.measureText('Brand').width;
  ctx.fillStyle = '#0047FF';
  ctx.fillText('OS', W - 40, H - 40);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  });
  } catch (err) {
    console.error('[ShareableArchetypeCard] Error generating image:', err);
    return null;
  }
}
