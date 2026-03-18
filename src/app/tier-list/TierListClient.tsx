'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

interface TierUser {
  username: string;
  score: number;
  archetype: string | null;
  profileImageUrl: string | null;
}

interface Tiers {
  elite: TierUser[];
  strong: TierUser[];
  rising: TierUser[];
}

// ── Right-side rotating comment blocks (matches product page aesthetic) ──
const RIGHT_COMMENT_SETS = [
  [
    'TIER LIST ENGINE',
    'Status: OPERATIONAL',
    'Creators: INDEXED',
  ],
  [
    'SCORE DISTRIBUTION',
    'Elite: 80–100',
    'Strong: 60–79',
  ],
  [
    'ARCHETYPE MODULE',
    'Match: COMPUTED',
    'Confidence: HIGH',
  ],
  [
    'REPUTATION ENGINE',
    'Signal: STRONG',
    'Tier: RESOLVED',
  ],
];

// ── Right-side rotating code blocks ──
const CODE_BLOCK_SETS = [
  `type TierRank = {
  elite: Score >= 80;
  strong: Score >= 60;
  rising: Score >= 40;
  archetype: CreatorDNA;
};`,
  `interface Ranking {
  handle: string;
  score: number;
  tier: TierLevel;
  archetype: string;
};`,
  `const leaderboard = {
  sorted: "score_desc",
  unique: true,
  filtered: "no_bots",
  indexed: Date.now(),
};`,
  `type CreatorTier = {
  brand: BrandDNA;
  position: number;
  percentile: Range;
  velocity: Growth;
};`,
];

// ── Ambient terminal log lines ──
const TERMINAL_LOGS = [
  '// ═══════════════════════════════════════',
  '// BRANDOS v2.0 — TIER LIST INITIALIZED',
  '// ═══════════════════════════════════════',
  '',
  'const tierList = await scan({',
  '  mode: "all_creators",',
  '  filter: "unique_handles",',
  '  sort: "score_desc",',
  '});',
  '',
  '> STATUS: INDEXED',
  '> CREATORS: RANKED',
  '> TIERS: ASSIGNED',
];

function TerminalLogs() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines((prev) => {
        if (prev >= TERMINAL_LOGS.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:block fixed top-8 left-8 z-0 pointer-events-none select-none">
      <div className="flex flex-col gap-0.5 opacity-[0.12]">
        {TERMINAL_LOGS.slice(0, visibleLines).map((line, i) => (
          <span
            key={i}
            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
            className="text-[11px] text-white whitespace-pre"
          >
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}


// ── Cycling comment block (top-right) ──
function TypedCommentBlock() {
  const [setIndex, setSetIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'holding' | 'clearing'>('typing');
  const lines = RIGHT_COMMENT_SETS[setIndex];

  useEffect(() => {
    if (phase === 'typing') {
      if (visibleLines < lines.length) {
        const timer = setTimeout(() => setVisibleLines((v) => v + 1), 180);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setPhase('clearing'), 6000);
        return () => clearTimeout(timer);
      }
    }

    if (phase === 'clearing') {
      if (visibleLines > 0) {
        const timer = setTimeout(() => setVisibleLines((v) => v - 1), 80);
        return () => clearTimeout(timer);
      } else {
        setSetIndex((prev) => (prev + 1) % RIGHT_COMMENT_SETS.length);
        setPhase('typing');
      }
    }
  }, [visibleLines, phase, setIndex, lines.length]);

  return (
    <div className="hidden lg:block fixed top-8 right-8 z-0 pointer-events-none select-none">
      <div className="flex flex-col gap-0.5">
        {lines.slice(0, visibleLines).map((line, i) => (
          <motion.span
            key={`${setIndex}-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ duration: 0.2 }}
            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
            className="text-[11px] text-white whitespace-pre"
          >
            {line}
          </motion.span>
        ))}
        {phase === 'typing' && visibleLines < lines.length && (
          <motion.span
            animate={{ opacity: [0.3, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="text-[#0047FF] text-[11px]"
          >
            █
          </motion.span>
        )}
      </div>
    </div>
  );
}

// ── Cycling code block (below comment block, right side) ──
function TypedCodeBlock() {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState<'typing' | 'holding' | 'deleting'>('typing');

  useEffect(() => {
    const text = CODE_BLOCK_SETS[index];

    if (phase === 'typing') {
      if (displayed.length < text.length) {
        const timer = setTimeout(
          () => setDisplayed(text.slice(0, displayed.length + 1)),
          25
        );
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setPhase('deleting'), 8000);
        return () => clearTimeout(timer);
      }
    }

    if (phase === 'deleting') {
      if (displayed.length > 0) {
        const timer = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 15);
        return () => clearTimeout(timer);
      } else {
        setIndex((prev) => (prev + 1) % CODE_BLOCK_SETS.length);
        setPhase('typing');
      }
    }
  }, [displayed, phase, index]);

  return (
    <div className="hidden lg:block fixed top-36 right-8 z-0 pointer-events-none select-none">
      <pre
        className="text-[11px] text-white/20 whitespace-pre"
        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", lineHeight: 1.7, background: 'none', padding: 0, borderRadius: 0 }}
      >
        {displayed}
        <motion.span
          animate={{ opacity: [0.3, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
          className="text-[#0047FF]"
        >
          █
        </motion.span>
      </pre>
    </div>
  );
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

function UserCard({
  user,
  isHighlighted,
  cardRef,
  tierColor,
}: {
  user: TierUser;
  isHighlighted: boolean;
  cardRef?: ((node: HTMLDivElement | null) => void);
  tierColor: string;
}) {
  const borderColor = isHighlighted
    ? 'border-[#0047FF] shadow-[0_0_20px_rgba(0,71,255,0.6)] ring-2 ring-[#0047FF]'
    : tierColor === 'blue'
      ? 'border-[#0047FF44]'
      : tierColor === 'green'
        ? 'border-[#00ff8844]'
        : 'border-[#ffaa0044]';

  return (
    <div ref={cardRef}>
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isHighlighted ? 1.2 : 1,
      }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center w-[72px] md:w-[80px] gap-1 relative ${isHighlighted ? 'z-10' : ''}`}
    >
      <div
        className={`w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 transition-all duration-500 ${borderColor}`}
      >
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt={`@${user.username}`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23222' width='100' height='100'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23555' font-size='40'%3E%3F%3C/text%3E%3C/svg%3E";
            }}
          />
        ) : (
          <div className="w-full h-full bg-[#222] flex items-center justify-center text-[#666] text-lg">
            ?
          </div>
        )}
      </div>
      <span
        className={`text-[8px] md:text-[9px] text-center overflow-hidden text-ellipsis whitespace-nowrap w-full transition-colors ${isHighlighted ? 'text-[#0047FF] font-bold' : 'text-white/60'}`}
        style={{ fontFamily: "'VCR OSD Mono', monospace" }}
      >
        @{user.username}
      </span>
      <span
        className={`text-[10px] md:text-[11px] font-bold transition-colors ${isHighlighted ? 'text-[#0047FF]' : 'text-white/90'}`}
        style={{ fontFamily: "'VCR OSD Mono', monospace" }}
      >
        {user.score}
      </span>
      {user.archetype && (
        <span
          className="text-[7px] md:text-[8px] text-white/35 uppercase"
          style={{ fontFamily: "'VCR OSD Mono', monospace" }}
        >
          {user.archetype}
        </span>
      )}
    </motion.div>
    </div>
  );
}

function TierSection({
  label,
  scoreRange,
  users,
  color,
  searchResult,
  highlightedRef,
  index,
}: {
  label: string;
  scoreRange: string;
  users: TierUser[];
  color: string;
  searchResult: string | null;
  highlightedRef: ((node: HTMLDivElement | null) => void);
  index: number;
}) {
  const headerColors: Record<string, string> = {
    blue: 'text-[#0047FF]',
    green: 'text-[#10B981]',
    orange: 'text-[#F59E0B]',
  };

  const borderColors: Record<string, string> = {
    blue: 'border-[#0047FF33]',
    green: 'border-[#10B98133]',
    orange: 'border-[#F59E0B33]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className={`border ${borderColors[color]} bg-white/[0.04] backdrop-blur-sm rounded-lg overflow-hidden`}
    >
      {/* Tier header */}
      <div className="px-5 py-3 border-b border-white/8 flex items-center gap-3">
        <span
          className={`text-[11px] md:text-[13px] tracking-[0.15em] ${headerColors[color]}`}
          style={{ fontFamily: "'VCR OSD Mono', monospace" }}
        >
          {'>'} {scoreRange} // {label}
        </span>
        <span
          className="text-[10px] md:text-[11px] text-white/50"
          style={{ fontFamily: "'VCR OSD Mono', monospace" }}
        >
          [{users.length} creators]
        </span>
      </div>

      {/* User grid */}
      <div className="flex flex-wrap gap-2 md:gap-3 p-4 md:p-5">
        {users.length > 0 ? (
          users.map((user) => {
            const isHighlighted =
              searchResult === user.username.toLowerCase();
            return (
              <UserCard
                key={user.username}
                user={user}
                isHighlighted={isHighlighted}
                cardRef={isHighlighted ? highlightedRef : undefined}
                tierColor={color}
              />
            );
          })
        ) : (
          <span
            className="text-white/50 text-[11px]"
            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
          >
            // no creators in this tier
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function TierListClient({ tiers }: { tiers: Tiers }) {
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const highlightedRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setTimeout(() => {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [searchResult]);
  const totalCreators =
    tiers.elite.length + tiers.strong.length + tiers.rising.length;

  const allUsers = [...tiers.elite, ...tiers.strong, ...tiers.rising];

  const suggestions = (() => {
    const query = search.trim().toLowerCase().replace('@', '');
    if (query.length < 1) return [];
    return allUsers
      .filter((u) => u.username.toLowerCase().includes(query))
      .slice(0, 6);
  })();

  const handleSearch = useCallback(() => {
    const query = search.trim().toLowerCase().replace('@', '');
    if (!query) {
      setSearchResult(null);
      setNotFound(false);
      return;
    }

    const found = allUsers.find(
      (u) => u.username.toLowerCase() === query
    );

    if (found) {
      setSearchResult(found.username.toLowerCase());
      setNotFound(false);
    } else {
      setSearchResult(null);
      setNotFound(true);
    }
  }, [search, allUsers]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative crt-scanlines-dark">
      {/* Ambient background elements */}
      <TerminalLogs />
      <TypedCommentBlock />
      <TypedCodeBlock />
      <FilmGrain />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <Image
            src="/brandos-keycap.png"
            alt="BrandOS"
            width={100}
            height={100}
            className="mx-auto mb-5"
          />
          <h1
            className="text-2xl md:text-3xl font-bold tracking-[0.08em] text-white mb-2"
            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
          >
            TIER LIST
          </h1>
          <p
            className="text-[11px] md:text-[12px] text-white/60 tracking-wide"
            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
          >
            {totalCreators.toLocaleString()} creators ranked by Brand DNA Score
          </p>
        </motion.div>

        {/* Top CTA banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mb-8"
        >
          <p
            className="text-[11px] text-white/40"
            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
          >
            can&apos;t find your username?{' '}
            <a
              href="/"
              className="text-[#0047FF] hover:underline"
            >
              scan now → mybrandos.app
            </a>
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-md mx-auto mb-10"
        >
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setNotFound(false);
                  setSearchResult(null);
                  setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setShowSuggestions(false);
                    handleSearch();
                  }
                }}
                onFocus={() => search.trim().length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="enter handle"
                className="terminal-input w-full bg-white/8 border border-white/15 rounded px-4 py-3 text-white text-sm placeholder:text-white/60 focus:outline-none focus:border-[#0047FF] transition-colors"
                style={{ fontFamily: "'VCR OSD Mono', monospace" }}
              />
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-[#151515] border border-white/10 rounded overflow-hidden z-50"
                  >
                    {suggestions.map((user) => (
                      <button
                        key={user.username}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSearch(user.username);
                          setShowSuggestions(false);
                          setSearchResult(user.username.toLowerCase());
                          setNotFound(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/8 transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                          {user.profileImageUrl ? (
                            <img
                              src={user.profileImageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#222] flex items-center justify-center text-[#555] text-xs">?</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span
                            className="text-white/70 text-[11px] block truncate"
                            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                          >
                            @{user.username}
                          </span>
                        </div>
                        <span
                          className="text-white/50 text-[10px] flex-shrink-0"
                          style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                        >
                          {user.score}
                        </span>
                        {user.archetype && (
                          <span
                            className="text-white/25 text-[9px] flex-shrink-0 uppercase"
                            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                          >
                            {user.archetype}
                          </span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => {
                setShowSuggestions(false);
                handleSearch();
              }}
              className="bg-[#0047FF] hover:bg-[#0035cc] text-white font-bold px-5 py-3 rounded text-[11px] tracking-[0.1em] transition-colors"
              style={{ fontFamily: "'VCR OSD Mono', monospace" }}
            >
              FIND_ME
            </button>
          </div>

          <AnimatePresence mode="wait">
            {notFound && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-center"
              >
                <p
                  className="text-[#F59E0B] text-[11px] mb-1"
                  style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                >
                  {'>'} ERROR: handle not found in index
                </p>
                <a
                  href="/"
                  className="text-[#0047FF] text-[11px] hover:underline"
                  style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                >
                  {'>'} SCAN YOUR BRAND →
                </a>
              </motion.div>
            )}
            {searchResult && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-center"
              >
                <p
                  className="text-[#10B981] text-[11px]"
                  style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                >
                  {'>'} MATCH FOUND — scrolling to position...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tiers */}
        <div className="space-y-6">
          <TierSection
            label="ELITE"
            scoreRange="80–100"
            users={tiers.elite}
            color="blue"
            searchResult={searchResult}
            highlightedRef={highlightedRef}
            index={0}
          />
          <TierSection
            label="STRONG"
            scoreRange="60–79"
            users={tiers.strong}
            color="green"
            searchResult={searchResult}
            highlightedRef={highlightedRef}
            index={1}
          />
          <TierSection
            label="RISING"
            scoreRange="40–59"
            users={tiers.rising}
            color="orange"
            searchResult={searchResult}
            highlightedRef={highlightedRef}
            index={2}
          />
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-16 mb-8"
        >
          <p
            className="text-white/50 text-[11px] mb-4"
            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
          >
            // not on the list? get your Brand DNA Score in 60 seconds.
          </p>
          <a
            href="/"
            className="inline-block bg-[#0047FF] hover:bg-[#0035cc] text-white font-bold px-8 py-3 rounded text-[11px] tracking-[0.1em] transition-colors"
            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
          >
            {'>'} SCAN_YOUR_BRAND
          </a>
        </motion.div>

        {/* Bottom decorative element */}
        <div className="flex justify-center mt-8 opacity-[0.15]">
          <pre
            className="text-[9px] text-white text-center"
            style={{ fontFamily: "'VCR OSD Mono', monospace", background: 'none', padding: 0, borderRadius: 0 }}
          >
            {`┌──────────────────────────────────┐
│  BRANDOS TIER LIST v1.0          │
│  mybrandos.app                   │
└──────────────────────────────────┘`}
          </pre>
        </div>
      </div>
    </div>
  );
}
