'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBrandStore, useCurrentBrand } from '@/lib/store';
import { brandHasContent } from '@/hooks/useBrandHydration';
import { MONO, TerminalButton, ToneSlider, TONE_SLIDERS, terminalInputStyle } from './terminal-ui';

// Brand DNA editor for /dashboard (consolidation step 3b). View mode prints
// the brand as a TS const; edit mode opens the fields the wizard captures
// plus do/don't patterns, which only the editor exposes. All writes go
// through setBrandDNA — useBrandHydration (mounted by DashboardClient)
// pushes them to the workspace brand on its debounce.

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncError: string | null;
}

interface BrandDNAPanelProps {
  sync: SyncStatus;
  onReinit: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-2"
      style={{
        fontFamily: MONO,
        fontSize: 10,
        letterSpacing: '0.15em',
        color: 'var(--text-tertiary)',
      }}
    >
      {children}
    </p>
  );
}

/* Editable string list (keywords / patterns / samples) as terminal chips. */
function ListEditor({
  items,
  onAdd,
  onRemove,
  placeholder,
  marker,
  markerColor,
  multiline,
}: {
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  marker?: string;
  markerColor?: string;
  multiline?: boolean;
}) {
  const [input, setInput] = useState('');

  const submit = () => {
    if (input.trim()) {
      onAdd(input.trim());
      setInput('');
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {multiline ? (
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="flex-1 px-3 py-2 text-sm resize-none placeholder:opacity-40"
            style={terminalInputStyle}
          />
        ) : (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 text-sm placeholder:opacity-40"
            style={terminalInputStyle}
          />
        )}
        <TerminalButton onClick={submit} disabled={!input.trim()}>
          [+]
        </TerminalButton>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <button
            key={`${item}-${i}`}
            onClick={() => onRemove(i)}
            title="remove"
            className="block w-full text-left px-3 py-1.5 hover:opacity-70 transition-opacity"
            style={{
              fontFamily: MONO,
              fontSize: 11,
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 2,
              backgroundColor: 'var(--surface-tertiary)',
            }}
          >
            <span style={{ color: markerColor ?? 'var(--text-tertiary)' }}>{marker ?? '·'}</span>{' '}
            {item} <span style={{ color: 'var(--text-tertiary)', float: 'right' }}>×</span>
          </button>
        ))}
        {items.length === 0 && (
          <p style={{ fontFamily: MONO, fontSize: 10, color: 'var(--text-tertiary)' }}>
            {'// empty'}
          </p>
        )}
      </div>
    </div>
  );
}

export default function BrandDNAPanel({ sync, onReinit }: BrandDNAPanelProps) {
  const { brands, currentBrandId, switchBrand, setBrandDNA } = useBrandStore();
  const brandDNA = useCurrentBrand();
  const [editing, setEditing] = useState(false);

  const hasAnyContent = brands.some(brandHasContent);

  const syncLabel = sync.syncError
    ? '⚠ sync failed — saved locally'
    : sync.isSyncing
      ? '● syncing...'
      : sync.lastSyncedAt
        ? `✓ synced ${sync.lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : '';
  const syncColor = sync.syncError
    ? 'var(--danger)'
    : sync.isSyncing
      ? 'var(--accent)'
      : 'var(--success)';

  return (
    <section
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-3 border-b"
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
          {'// BRAND DNA'}
        </span>
        <div className="flex items-center gap-3">
          {syncLabel && (
            <span style={{ fontFamily: MONO, fontSize: 10, color: syncColor }}>{syncLabel}</span>
          )}
          {brands.length > 1 && (
            <select
              value={currentBrandId ?? undefined}
              onChange={(e) => switchBrand(e.target.value)}
              className="px-2 py-1 text-xs"
              style={terminalInputStyle}
              aria-label="active brand"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name || 'unnamed'}
                </option>
              ))}
            </select>
          )}
          {hasAnyContent && (
            <button
              onClick={() => setEditing((e) => !e)}
              className="hover:opacity-70 transition-opacity"
              style={{ fontFamily: MONO, fontSize: 10, color: 'var(--accent)' }}
            >
              {editing ? '[ done ]' : '[ edit ]'}
            </button>
          )}
        </div>
      </div>

      <div className="px-5 sm:px-6 py-6">
        {/* ── Empty state: onboarding was skipped ── */}
        {!hasAnyContent && (
          <div>
            <p
              className="mb-5"
              style={{ fontFamily: MONO, fontSize: 13, color: 'var(--text-secondary)' }}
            >
              &gt; no brand DNA found in this workspace
            </p>
            <TerminalButton primary onClick={onReinit}>
              [ RUN brand.init() ]
            </TerminalButton>
          </div>
        )}

        {/* ── View mode: cat brand.dna ── */}
        {hasAnyContent && !editing && brandDNA && (
          <div>
            <p
              className="mb-3"
              style={{ fontFamily: MONO, fontSize: 13, color: 'var(--text-primary)' }}
            >
              <span style={{ color: 'var(--accent)' }}>$</span> cat brand.dna
            </p>
            <pre
              className="p-4 overflow-x-auto"
              style={{
                fontFamily: MONO,
                fontSize: 12,
                lineHeight: 1.7,
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 2,
                backgroundColor: 'var(--surface-tertiary)',
              }}
            >
              {[
                'const brand: BrandDNA = {',
                `  name: "${brandDNA.name}",`,
                `  colors: ["${brandDNA.colors.primary}", "${brandDNA.colors.secondary}", "${brandDNA.colors.accent}"],`,
                `  tone: { formality: ${brandDNA.tone.minimal}, energy: ${brandDNA.tone.playful}, confidence: ${brandDNA.tone.bold}, style: ${brandDNA.tone.experimental} },`,
                `  keywords: [${brandDNA.keywords
                  .slice(0, 5)
                  .map((k) => `"${k}"`)
                  .join(
                    ', '
                  )}${brandDNA.keywords.length > 5 ? ` /* +${brandDNA.keywords.length - 5} more */` : ''}],`,
                `  do_patterns: ${brandDNA.doPatterns.length} rules,`,
                `  dont_patterns: ${brandDNA.dontPatterns.length} rules,`,
                `  voice_samples: ${brandDNA.voiceSamples.length},`,
                '};',
              ].join('\n')}
            </pre>
            <div className="flex gap-2 mt-3">
              {(['primary', 'secondary', 'accent'] as const).map((key) => (
                <div
                  key={key}
                  className="w-6 h-6"
                  title={`${key}: ${brandDNA.colors[key]}`}
                  style={{
                    backgroundColor: brandDNA.colors[key],
                    border: '1px solid var(--border)',
                    borderRadius: 2,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Edit mode ── */}
        <AnimatePresence>
          {hasAnyContent && editing && brandDNA && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* name */}
              <div>
                <SectionLabel>{'// name'}</SectionLabel>
                <input
                  type="text"
                  value={brandDNA.name}
                  onChange={(e) => setBrandDNA({ name: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm"
                  style={terminalInputStyle}
                />
              </div>

              {/* colors */}
              <div>
                <SectionLabel>{'// colors'}</SectionLabel>
                <div className="flex gap-4">
                  {(
                    [
                      { key: 'primary', label: 'PRIMARY' },
                      { key: 'secondary', label: 'SECONDARY' },
                      { key: 'accent', label: 'ACCENT' },
                    ] as const
                  ).map(({ key, label }) => (
                    <label key={key} className="cursor-pointer text-center group">
                      <div
                        className="w-14 h-14 mb-1.5 transition-transform group-hover:scale-105"
                        style={{
                          backgroundColor: brandDNA.colors[key],
                          border: '1px solid var(--border)',
                          borderRadius: 2,
                        }}
                      />
                      <input
                        type="color"
                        value={brandDNA.colors[key]}
                        onChange={(e) =>
                          setBrandDNA({ colors: { ...brandDNA.colors, [key]: e.target.value } })
                        }
                        className="sr-only"
                      />
                      <span
                        className="block"
                        style={{
                          fontFamily: MONO,
                          fontSize: 8,
                          letterSpacing: '0.1em',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{ fontFamily: MONO, fontSize: 9, color: 'var(--text-secondary)' }}
                      >
                        {brandDNA.colors[key]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* tone */}
              <div>
                <SectionLabel>{'// tone'}</SectionLabel>
                <div className="space-y-5">
                  {TONE_SLIDERS.map((slider) => (
                    <ToneSlider
                      key={slider.key}
                      label={slider.label}
                      value={brandDNA.tone[slider.key] ?? 50}
                      onChange={(v) => setBrandDNA({ tone: { ...brandDNA.tone, [slider.key]: v } })}
                      left={slider.left}
                      right={slider.right}
                    />
                  ))}
                </div>
              </div>

              {/* keywords */}
              <div>
                <SectionLabel>{'// keywords'}</SectionLabel>
                <ListEditor
                  items={brandDNA.keywords}
                  onAdd={(v) => setBrandDNA({ keywords: [...brandDNA.keywords, v] })}
                  onRemove={(i) =>
                    setBrandDNA({ keywords: brandDNA.keywords.filter((_, j) => j !== i) })
                  }
                  placeholder="add keyword"
                />
              </div>

              {/* patterns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <SectionLabel>{'// do_patterns'}</SectionLabel>
                  <ListEditor
                    items={brandDNA.doPatterns}
                    onAdd={(v) => setBrandDNA({ doPatterns: [...brandDNA.doPatterns, v] })}
                    onRemove={(i) =>
                      setBrandDNA({ doPatterns: brandDNA.doPatterns.filter((_, j) => j !== i) })
                    }
                    placeholder="always..."
                    marker="✓"
                    markerColor="var(--success)"
                  />
                </div>
                <div>
                  <SectionLabel>{'// dont_patterns'}</SectionLabel>
                  <ListEditor
                    items={brandDNA.dontPatterns}
                    onAdd={(v) => setBrandDNA({ dontPatterns: [...brandDNA.dontPatterns, v] })}
                    onRemove={(i) =>
                      setBrandDNA({ dontPatterns: brandDNA.dontPatterns.filter((_, j) => j !== i) })
                    }
                    placeholder="never..."
                    marker="✗"
                    markerColor="var(--danger)"
                  />
                </div>
              </div>

              {/* voice samples */}
              <div>
                <SectionLabel>{'// voice_samples'}</SectionLabel>
                <ListEditor
                  items={brandDNA.voiceSamples}
                  onAdd={(v) => setBrandDNA({ voiceSamples: [...brandDNA.voiceSamples, v] })}
                  onRemove={(i) =>
                    setBrandDNA({ voiceSamples: brandDNA.voiceSamples.filter((_, j) => j !== i) })
                  }
                  placeholder="paste writing that sounds like you..."
                  multiline
                />
              </div>

              <TerminalButton primary onClick={() => setEditing(false)}>
                [ DONE EDITING ]
              </TerminalButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
