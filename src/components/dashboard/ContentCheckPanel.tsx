'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBrandStore, useCurrentBrand } from '@/lib/store';
import { brandHasContent } from '@/hooks/useBrandHydration';
import { CheckResult } from '@/lib/types';
import { MONO, asciiBar, TerminalButton, terminalInputStyle } from './terminal-ui';

// Content Check — the core loop (consolidation step 4): paste a draft, score
// it against the workspace brand DNA via /api/check, persist the run to
// HistoryEntry. Terminal aesthetic on world CSS variables, like its siblings.

const MAX_CONTENT_CHARS = 10_000;

interface HistoryRow {
  id: string;
  input: string;
  output: { score?: number };
  timestamp: string;
}

function scoreColor(score: number) {
  return score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--danger)';
}

function ResultList({
  title,
  items,
  marker,
  markerColor,
}: {
  title: string;
  items: string[];
  marker: string;
  markerColor: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p
        className="mb-1.5"
        style={{
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: '0.15em',
          color: 'var(--text-tertiary)',
        }}
      >
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span style={{ fontFamily: MONO, color: markerColor, flexShrink: 0 }}>{marker}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ContentCheckPanel() {
  const { brands } = useBrandStore();
  const brandDNA = useCurrentBrand();
  const [draft, setDraft] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  const hasBrand = brands.some(brandHasContent);

  const loadHistory = useCallback(async () => {
    if (!brandDNA) return;
    try {
      const res = await fetch(`/api/history?brandId=${encodeURIComponent(brandDNA.id)}&limit=5`);
      if (!res.ok) return;
      const data = await res.json();
      setHistory((data.history as HistoryRow[]).filter((h) => typeof h.output?.score === 'number'));
    } catch {
      // History is decoration — never block the check flow on it.
    }
  }, [brandDNA]);

  useEffect(() => {
    if (hasBrand) void loadHistory();
  }, [hasBrand, loadHistory]);

  async function runCheck() {
    if (!brandDNA || !draft.trim() || checking) return;
    setChecking(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandDNA, content: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.code === 'USAGE_LIMIT'
            ? 'Usage limit reached — upgrade to keep checking.'
            : data.error || 'Check failed'
        );
      }
      setResult(data as CheckResult);

      // Persist the run; the id is the server cuid once hydration has synced.
      void fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'check',
          brandId: brandDNA.id,
          input: draft.trim(),
          output: data,
        }),
      })
        .then((r) => {
          if (r.ok) void loadHistory();
        })
        .catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setChecking(false);
    }
  }

  async function copyRevised() {
    if (!result?.revisedVersion) return;
    try {
      await navigator.clipboard.writeText(result.revisedVersion);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — nothing to do.
    }
  }

  if (!hasBrand) return null;

  return (
    <section
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.15em',
            color: 'var(--text-tertiary)',
          }}
        >
          {'// CONTENT CHECK'}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--text-tertiary)' }}>
          {draft.length > 0 && `${draft.length}/${MAX_CONTENT_CHARS}`}
        </span>
      </div>

      <div className="px-5 sm:px-6 py-6">
        <p
          className="mb-3"
          style={{ fontFamily: MONO, fontSize: 13, color: 'var(--text-primary)' }}
        >
          <span style={{ color: 'var(--accent)' }}>$</span> brand.check(draft)
        </p>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_CONTENT_CHARS))}
          placeholder="paste a draft — a tweet, a thread, an email, anything..."
          rows={4}
          className="w-full px-4 py-3 text-sm resize-y placeholder:opacity-40 mb-3"
          style={terminalInputStyle}
        />

        <div className="flex items-center gap-4">
          <TerminalButton primary onClick={runCheck} disabled={!draft.trim() || checking}>
            {checking ? '[ ANALYZING... ]' : '[ RUN CHECK ]'}
          </TerminalButton>
          {checking && (
            <motion.span
              animate={{ opacity: [1, 0.3] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{ fontFamily: MONO, fontSize: 11, color: 'var(--text-tertiary)' }}
            >
              {'> scoring against brand DNA...'}
            </motion.span>
          )}
        </div>

        {error && (
          <p className="mt-3" style={{ fontFamily: MONO, fontSize: 11, color: 'var(--danger)' }}>
            ✗ {error}
          </p>
        )}

        {/* ── Result ── */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-5"
            >
              {/* score */}
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      letterSpacing: '0.15em',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    ALIGNMENT SCORE
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 22, color: scoreColor(result.score) }}>
                    {result.score}
                  </span>
                </div>
                <span
                  className="block whitespace-pre text-base"
                  style={{ fontFamily: MONO, color: scoreColor(result.score) }}
                >
                  {asciiBar(result.score, 32)}
                </span>
              </div>

              <ResultList
                title="// strengths"
                items={result.strengths}
                marker="✓"
                markerColor="var(--success)"
              />
              <ResultList
                title="// issues"
                items={result.issues}
                marker="✗"
                markerColor="var(--danger)"
              />
              <ResultList
                title="// suggestions"
                items={result.suggestions}
                marker=">"
                markerColor="var(--accent)"
              />

              {result.revisedVersion && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 10,
                        letterSpacing: '0.15em',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      {'// revised draft'}
                    </span>
                    <button
                      onClick={copyRevised}
                      className="hover:opacity-70 transition-opacity"
                      style={{ fontFamily: MONO, fontSize: 10, color: 'var(--accent)' }}
                    >
                      {copied ? '[ copied ✓ ]' : '[ copy ]'}
                    </button>
                  </div>
                  <div
                    className="p-4 text-sm whitespace-pre-wrap"
                    style={{
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 2,
                      backgroundColor: 'var(--surface-tertiary)',
                    }}
                  >
                    {result.revisedVersion}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Recent checks ── */}
        {history.length > 0 && (
          <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <p
              className="mb-2"
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: '0.15em',
                color: 'var(--text-tertiary)',
              }}
            >
              {'// recent checks'}
            </p>
            <div className="space-y-1">
              {history.map((h) => {
                const s = h.output.score ?? 0;
                return (
                  <div key={h.id} className="flex items-center gap-3">
                    <span
                      className="whitespace-pre"
                      style={{ fontFamily: MONO, fontSize: 11, color: scoreColor(s) }}
                    >
                      {String(s).padStart(3, ' ')} {asciiBar(s, 10)}
                    </span>
                    <span
                      className="truncate text-xs"
                      style={{ color: 'var(--text-tertiary)' }}
                      title={h.input}
                    >
                      {h.input}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
