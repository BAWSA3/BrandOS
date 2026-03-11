'use client';

import { useState } from 'react';
import { ContentEngineConfig } from '@/lib/agents/content-engine.types';
import { BrandDNA } from '@/lib/types';

interface VoiceScanResult {
  toneWords: string[];
  doPatterns: string[];
  dontPatterns: string[];
  sampleTopics: string[];
  suggestedVibe: string;
  confidence: number;
}

interface VoiceScannerProps {
  config: ContentEngineConfig;
  brand: BrandDNA | null;
  onSave: (config: ContentEngineConfig) => void;
}

export default function VoiceScanner({ config, brand, onSave }: VoiceScannerProps) {
  const [handle, setHandle] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scan, setScan] = useState<VoiceScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(1);

  const hasScanData = !!config.scannedHandle;

  const runScan = async () => {
    const clean = handle.replace(/^@/, '').trim();
    if (!clean) return;

    setScanning(true);
    setError(null);
    setScan(null);

    const tickInterval = setInterval(() => setTick(p => (p >= 3 ? 1 : p + 1)), 380);

    try {
      const res = await fetch('/api/try-engine/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');

      setScan(data);

      // Auto-save scan results into the content engine config
      const newVoiceConstraints = data.toneWords || [];
      const newDoPatterns = data.doPatterns || [];
      const newNeverSay = data.dontPatterns || [];
      const newThemes = data.sampleTopics || [];

      onSave({
        ...config,
        scannedHandle: clean,
        voiceConstraints: newVoiceConstraints,
        doPatterns: newDoPatterns,
        neverSay: newNeverSay,
        themes: newThemes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
      clearInterval(tickInterval);
    }
  };

  const dots = '.'.repeat(tick);

  return (
    <div className="glass-card border border-[var(--surface-tertiary)] rounded-[var(--radius-md)] p-5 mb-4">
      <h3 className="label-mono text-[var(--text-tertiary)] mb-1">Voice & Context</h3>
      <p className="font-mono text-[10px] text-[var(--text-quaternary)] mb-4">
        Enter your X handle to scan your recent posts and detect your writing style, tone, and topics.
      </p>

      {/* X Handle Input + Scan */}
      <div className="flex gap-2 mb-4">
        <input
          value={handle}
          onChange={e => setHandle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runScan()}
          placeholder="@username"
          className="terminal-input flex-1 bg-[var(--surface)] border border-[var(--surface-tertiary)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-[var(--transition-fast)]"
        />
        <button
          onClick={runScan}
          disabled={scanning || !handle.replace(/^@/, '').trim()}
          className="btn-engine label-mono px-5 py-2.5 rounded-[var(--radius-sm)] whitespace-nowrap"
          style={scanning
            ? { background: 'var(--surface-tertiary)', color: 'var(--text-quaternary)', cursor: 'default' }
            : { background: 'var(--accent)', color: '#fff', cursor: 'pointer' }
          }
        >
          {scanning ? `scanning${dots}` : 'scan voice'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="border rounded-[var(--radius-sm)] px-3 py-2 mb-4" style={{ background: 'rgba(255, 59, 48, 0.06)', borderColor: 'rgba(255, 59, 48, 0.15)' }}>
          <span className="label-mono" style={{ color: 'var(--danger)' }}>{error}</span>
        </div>
      )}

      {/* Scan Results */}
      {scan && (
        <div className="space-y-3 mb-4">
          {/* Confidence */}
          <div className="flex items-center gap-2">
            <span className="label-mono text-[var(--text-quaternary)]">Confidence:</span>
            <span className="label-mono font-bold text-[var(--accent)]">{scan.confidence}%</span>
            <span className="label-mono text-[var(--text-quaternary)]">Vibe:</span>
            <span className="label-mono font-bold text-[var(--text-secondary)]">{scan.suggestedVibe}</span>
          </div>

          {/* Tone Words */}
          {scan.toneWords.length > 0 && (
            <div>
              <div className="label-mono text-[var(--text-quaternary)] mb-1.5" style={{ fontSize: 9 }}>Tone</div>
              <div className="flex gap-1.5 flex-wrap">
                {scan.toneWords.map(w => (
                  <span key={w} className="px-2.5 py-1 text-[10px] font-mono rounded-[var(--radius-sm)] bg-[var(--accent)] text-white font-medium">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Do Patterns */}
          {scan.doPatterns.length > 0 && (
            <div>
              <div className="label-mono text-[var(--text-quaternary)] mb-1.5" style={{ fontSize: 9 }}>Style Patterns</div>
              <div className="space-y-1">
                {scan.doPatterns.map(p => (
                  <div key={p} className="font-mono text-[11px] text-[var(--text-secondary)]">
                    <span className="text-[var(--success)]">+</span> {p}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Don't Patterns */}
          {scan.dontPatterns.length > 0 && (
            <div>
              <div className="label-mono text-[var(--text-quaternary)] mb-1.5" style={{ fontSize: 9 }}>Avoids</div>
              <div className="space-y-1">
                {scan.dontPatterns.map(p => (
                  <div key={p} className="font-mono text-[11px] text-[var(--text-secondary)]">
                    <span style={{ color: 'var(--danger)' }}>-</span> {p}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topics */}
          {scan.sampleTopics.length > 0 && (
            <div>
              <div className="label-mono text-[var(--text-quaternary)] mb-1.5" style={{ fontSize: 9 }}>Topics</div>
              <div className="flex gap-1.5 flex-wrap">
                {scan.sampleTopics.map(t => (
                  <span key={t} className="px-2.5 py-1 text-[10px] font-mono rounded-[var(--radius-sm)] border border-[var(--surface-tertiary)] text-[var(--text-secondary)]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="font-mono text-[10px] text-[var(--text-quaternary)] pt-1">
            Voice profile saved to engine config.
          </div>
        </div>
      )}

      {/* Collapsed summary when scan data exists but no active scan result showing */}
      {!scan && hasScanData && (
        <div className="space-y-3 mb-3">
          {/* Tone pills */}
          {config.voiceConstraints.length > 0 && (
            <div>
              <div className="label-mono text-[var(--text-quaternary)] mb-1.5" style={{ fontSize: 9 }}>Tone</div>
              <div className="flex gap-1.5 flex-wrap">
                {config.voiceConstraints.map(w => (
                  <span key={w} className="px-2.5 py-1 text-[10px] font-mono rounded-[var(--radius-sm)] bg-[var(--accent)] text-white font-medium">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Do patterns — green */}
          {config.doPatterns.length > 0 && (
            <div>
              <div className="label-mono text-[var(--text-quaternary)] mb-1.5" style={{ fontSize: 9 }}>Style Patterns</div>
              <div className="space-y-1">
                {config.doPatterns.map(p => (
                  <div key={p} className="font-mono text-[11px] text-[var(--text-secondary)]">
                    <span className="text-[var(--success)]">+</span> {p}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Don't patterns — red */}
          {config.neverSay.length > 0 && (
            <div>
              <div className="label-mono text-[var(--text-quaternary)] mb-1.5" style={{ fontSize: 9 }}>Avoids</div>
              <div className="space-y-1">
                {config.neverSay.map(p => (
                  <div key={p} className="font-mono text-[11px] text-[var(--text-secondary)]">
                    <span style={{ color: 'var(--danger)' }}>-</span> {p}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topics */}
          {config.themes.length > 0 && (
            <div>
              <div className="label-mono text-[var(--text-quaternary)] mb-1.5" style={{ fontSize: 9 }}>Topics</div>
              <div className="flex gap-1.5 flex-wrap">
                {config.themes.map(t => (
                  <span key={t} className="px-2.5 py-1 text-[10px] font-mono rounded-[var(--radius-sm)] border border-[var(--surface-tertiary)] text-[var(--text-secondary)]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
