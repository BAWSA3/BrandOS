'use client';

import { useState } from 'react';
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

export default function TierRankClient({
  username,
  score,
  archetype,
  profileImageUrl,
  rank,
  totalUsers,
  percentile,
  tierName,
  tierColor,
}: TierRankProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `https://mybrandos.app/tier-list/${username}`;

  const tweetText = `i'm ranked #${rank} on the @mybrandos tier list.\n\nscore: ${score}/100 | tier: ${tierName}${archetype ? ` | archetype: THE ${archetype.toUpperCase()}` : ''}\n\ntop ${percentile}% of ${totalUsers.toLocaleString()} creators. where do you rank?`;

  const tweetIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filledBars = Math.round((score / 100) * 24);
  const scoreBar = '\u2588'.repeat(filledBars) + '\u2591'.repeat(24 - filledBars);

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

            {/* Share buttons */}
            <div className="flex gap-3">
              <a
                href={tweetIntentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-3 rounded font-bold text-[11px] tracking-[0.1em] transition-colors bg-[#0047FF] hover:bg-[#0035cc] text-white"
                style={{ fontFamily: "'VCR OSD Mono', monospace" }}
              >
                SHARE ON X
              </a>
              <button
                onClick={handleCopy}
                className="flex-1 text-center py-3 rounded font-bold text-[11px] tracking-[0.1em] transition-colors border border-white/15 text-white/70 hover:bg-white/5"
                style={{ fontFamily: "'VCR OSD Mono', monospace" }}
              >
                {copied ? 'LINK COPIED' : 'COPY LINK'}
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
