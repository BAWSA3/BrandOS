'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';

interface TierRankProps {
  username: string;
  score: number;
  archetype: string | null;
  profileImageUrl: string | null;
  rank: number;
  totalUsers: number;
  percentile: number;
  tierName: string;
  tierColor: string;
}

function FilmGrain() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9998]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
      }}
    />
  );
}

// ── Canvas image generation ──
async function generateTierRankImage(props: TierRankProps): Promise<Blob | null> {
  const { username, score, archetype, profileImageUrl, rank, totalUsers, percentile, tierName, tierColor } = props;

  const W = 1200;
  const H = 630;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, W, H);

  // Scanlines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  for (let y = 0; y < H; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Header
  ctx.font = '14px monospace';
  ctx.fillStyle = '#0047FF';
  ctx.textBaseline = 'top';
  ctx.fillText('BRANDOS v2.0', 56, 48);

  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillText('//', 190, 48);

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText('TIER LIST RANKING', 215, 48);

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '12px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('mybrandos.app/tier-list', W - 56, 48);
  ctx.textAlign = 'left';

  // Separator
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.font = '12px monospace';
  ctx.fillText('/* ════════════════════════════════════════════════════════════════════ */', 56, 80);

  // Profile picture
  const pfpX = 56;
  const pfpY = 120;
  const pfpSize = 90;

  if (profileImageUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = profileImageUrl;
      });

      ctx.save();
      ctx.beginPath();
      ctx.arc(pfpX + pfpSize / 2, pfpY + pfpSize / 2, pfpSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, pfpX, pfpY, pfpSize, pfpSize);
      ctx.restore();

      // Ring
      ctx.beginPath();
      ctx.arc(pfpX + pfpSize / 2, pfpY + pfpSize / 2, pfpSize / 2 + 2, 0, Math.PI * 2);
      ctx.strokeStyle = tierColor;
      ctx.lineWidth = 3;
      ctx.stroke();
    } catch {
      // Fallback circle
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(pfpX + pfpSize / 2, pfpY + pfpSize / 2, pfpSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#555';
      ctx.font = '36px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', pfpX + pfpSize / 2, pfpY + pfpSize / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
    }
  } else {
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(pfpX + pfpSize / 2, pfpY + pfpSize / 2, pfpSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#555';
    ctx.font = '36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', pfpX + pfpSize / 2, pfpY + pfpSize / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  }

  // Username + archetype
  const textX = pfpX + pfpSize + 24;
  ctx.font = '14px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(`@${username}`, textX, pfpY + 20);

  if (archetype) {
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = tierColor;
    ctx.fillText(`THE ${archetype.toUpperCase()}`, textX, pfpY + 50);
  }

  // Large score
  ctx.font = 'bold 72px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(String(score), 56, 250);

  const scoreWidth = ctx.measureText(String(score)).width;
  ctx.font = '24px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText('/ 100', 56 + scoreWidth + 16, 285);

  // Score bar
  const filled = Math.round((score / 100) * 24);
  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(24 - filled);
  ctx.font = '14px monospace';
  ctx.fillStyle = tierColor;
  ctx.fillText(bar, 56, 340);

  // Tier badge
  const badgeY = 380;
  const badgeText = `${tierName} TIER`;
  ctx.font = 'bold 14px monospace';
  const badgeWidth = ctx.measureText(badgeText).width;

  // Badge background
  ctx.fillStyle = tierColor + '20';
  ctx.strokeStyle = tierColor + '60';
  ctx.lineWidth = 1;
  const bx = 56, by = badgeY, bw = badgeWidth + 40, bh = 36;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = tierColor;
  ctx.fillText(badgeText, bx + 20, by + 11);

  // Right side — Rank box
  const boxX = 680;
  const boxY = 140;
  const boxW = 440;
  const boxH = 300;

  ctx.fillStyle = tierColor + '10';
  ctx.strokeStyle = tierColor + '30';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  // Center content vertically in box
  const boxCenterX = boxX + boxW / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // "RANKED" label
  ctx.font = '12px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText('RANKED', boxCenterX, boxY + 50);

  // Rank number
  ctx.font = 'bold 64px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`#${rank}`, boxCenterX, boxY + 120);

  // "of X creators"
  ctx.font = '14px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText(`of ${totalUsers.toLocaleString()} creators`, boxCenterX, boxY + 175);

  // Percentile badge
  const percText = `TOP ${percentile}%`;
  ctx.font = 'bold 13px monospace';
  const percWidth = ctx.measureText(percText).width;
  const percBadgeW = percWidth + 32;
  const percBadgeX = boxCenterX - percBadgeW / 2;
  const percBadgeY = boxY + 210;

  ctx.fillStyle = tierColor;
  ctx.beginPath();
  ctx.roundRect(percBadgeX, percBadgeY, percBadgeW, 32, 4);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(percText, boxCenterX, percBadgeY + 16);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Footer
  const footerY = H - 50;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(56, footerY - 16, W - 112, 1);

  ctx.font = '11px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillText('// where do you rank?', 56, footerY);

  // CTA button
  const ctaText = 'SEE THE FULL TIER LIST → mybrandos.app/tier-list';
  ctx.font = '12px monospace';
  const ctaWidth = ctx.measureText(ctaText).width;
  const ctaX = W - 56 - ctaWidth - 32;

  ctx.fillStyle = '#0047FF';
  ctx.beginPath();
  ctx.roundRect(ctaX, footerY - 8, ctaWidth + 32, 30, 4);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(ctaText, ctaX + 16, footerY);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  });
}

async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export default function TierRankClient(props: TierRankProps) {
  const { username, score, archetype, rank, totalUsers, percentile, tierName, tierColor, profileImageUrl } = props;

  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySupported, setCopySupported] = useState(true);

  const filledBars = Math.round((score / 100) * 24);
  const scoreBar = '\u2588'.repeat(filledBars) + '\u2591'.repeat(24 - filledBars);

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

  const handleCopy = useCallback(async () => {
    setIsGenerating(true);
    try {
      const blob = await generateTierRankImage(props);
      if (!blob) return;

      const success = await copyImageToClipboard(blob);
      if (success) {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      } else {
        // Fallback to download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brandos-rank-${username}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [props, username]);

  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    try {
      const blob = await generateTierRankImage(props);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brandos-rank-${username}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [props, username]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative crt-scanlines-dark">
      <FilmGrain />

      <div className="max-w-lg mx-auto px-4 py-16 relative z-10">
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-lg overflow-hidden"
          style={{ border: `1px solid ${tierColor}33`, background: 'rgba(255,255,255,0.03)' }}
        >
          <div className="p-8">
            {/* Profile + Identity */}
            <div className="flex items-center gap-5 mb-8">
              <div
                className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0"
                style={{ border: `3px solid ${tierColor}` }}
              >
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={`@${username}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23222' width='100' height='100'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23555' font-size='40'%3E%3F%3C/text%3E%3C/svg%3E";
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-[#222] flex items-center justify-center text-[#555] text-2xl">
                    ?
                  </div>
                )}
              </div>
              <div>
                <p
                  className="text-white/50 text-sm mb-1"
                  style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                >
                  @{username}
                </p>
                {archetype && (
                  <p
                    className="text-lg font-bold uppercase"
                    style={{ fontFamily: "'VCR OSD Mono', monospace", color: tierColor }}
                  >
                    THE {archetype}
                  </p>
                )}
              </div>
            </div>

            {/* Score */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3 mb-3">
                <span
                  className="text-6xl font-bold text-white"
                  style={{ fontFamily: "'VCR OSD Mono', monospace", lineHeight: 1 }}
                >
                  {score}
                </span>
                <span
                  className="text-xl text-white/30"
                  style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                >
                  / 100
                </span>
              </div>
              <p
                className="text-sm tracking-wide"
                style={{ fontFamily: "'VCR OSD Mono', monospace", color: tierColor, letterSpacing: '0.05em' }}
              >
                {scoreBar}
              </p>
            </div>

            {/* Rank + Tier */}
            <div className="flex gap-3 mb-8">
              <div
                className="px-4 py-2.5 rounded text-center"
                style={{ background: `${tierColor}15`, border: `1px solid ${tierColor}40` }}
              >
                <p
                  className="text-[10px] text-white/40 mb-1"
                  style={{ fontFamily: "'VCR OSD Mono', monospace", letterSpacing: '0.15em' }}
                >
                  RANK
                </p>
                <p
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                >
                  #{rank}
                </p>
                <p
                  className="text-[10px] text-white/30 mt-0.5"
                  style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                >
                  of {totalUsers.toLocaleString()}
                </p>
              </div>

              <div
                className="px-4 py-2.5 rounded text-center"
                style={{ background: `${tierColor}15`, border: `1px solid ${tierColor}40` }}
              >
                <p
                  className="text-[10px] text-white/40 mb-1"
                  style={{ fontFamily: "'VCR OSD Mono', monospace", letterSpacing: '0.15em' }}
                >
                  TIER
                </p>
                <p
                  className="text-xl font-bold"
                  style={{ fontFamily: "'VCR OSD Mono', monospace", color: tierColor }}
                >
                  {tierName}
                </p>
              </div>

              <div
                className="px-4 py-2.5 rounded text-center"
                style={{ background: `${tierColor}15`, border: `1px solid ${tierColor}40` }}
              >
                <p
                  className="text-[10px] text-white/40 mb-1"
                  style={{ fontFamily: "'VCR OSD Mono', monospace", letterSpacing: '0.15em' }}
                >
                  PERCENTILE
                </p>
                <p
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                >
                  TOP {percentile}%
                </p>
              </div>
            </div>

            {/* Copy + Download buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                disabled={isGenerating}
                className="flex-1 text-center py-3 rounded font-bold text-[11px] tracking-[0.1em] transition-colors bg-[#0047FF] hover:bg-[#0035cc] text-white disabled:opacity-50"
                style={{ fontFamily: "'VCR OSD Mono', monospace" }}
              >
                {isGenerating ? 'GENERATING...' : isCopied ? 'COPIED TO CLIPBOARD' : copySupported ? 'COPY IMAGE' : 'DOWNLOAD IMAGE'}
              </button>
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="flex-1 text-center py-3 rounded font-bold text-[11px] tracking-[0.1em] transition-colors border border-white/15 text-white/70 hover:bg-white/5 disabled:opacity-50"
                style={{ fontFamily: "'VCR OSD Mono', monospace" }}
              >
                {isGenerating ? '...' : 'DOWNLOAD PNG'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Back to tier list */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <a
            href="/tier-list"
            className="text-white/40 text-[11px] hover:text-white/60 transition-colors"
            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
          >
            {'<'} BACK TO FULL TIER LIST
          </a>
        </motion.div>
      </div>
    </div>
  );
}
