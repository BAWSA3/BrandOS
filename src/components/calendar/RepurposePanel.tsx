'use client';

import { useState, useCallback } from 'react';
import { useCurrentBrand } from '@/lib/store';
import type { CalendarDraft } from '@/hooks/useCalendarDrafts';

interface RepurposePanelProps {
  source: CalendarDraft;
  onClose: () => void;
  onSaveDraft: (data: {
    content: string;
    contentType: string;
    tone: string;
    status: string;
    scheduledFor: string | null;
  }) => Promise<void>;
}

const formats = [
  { id: 'thread', label: 'Thread', desc: '3-5 tweet thread expanding the idea' },
  { id: 'poll', label: 'Poll', desc: 'Question + options for engagement' },
  { id: 'hot-take', label: 'Hot Take', desc: 'Provocative rewrite' },
  { id: 'educational', label: 'Educational', desc: 'Hook → concept → example → takeaway' },
  { id: 'counter-argument', label: 'Counter Argument', desc: 'Argue the opposite side' },
  { id: 'story', label: 'Story', desc: 'Narrative version of the idea' },
];

interface GeneratedDerivative {
  format: string;
  content: string;
  saved: boolean;
}

export default function RepurposePanel({ source, onClose, onSaveDraft }: RepurposePanelProps) {
  const brand = useCurrentBrand();
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [derivatives, setDerivatives] = useState<GeneratedDerivative[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFormat = useCallback((id: string) => {
    setSelectedFormats(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  }, []);

  const handleGenerate = useCallback(async () => {
    if (selectedFormats.length === 0 || !brand) return;

    setIsGenerating(true);
    setError(null);
    setDerivatives([]);

    try {
      const res = await fetch('/api/repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: brand.id,
          sourceContent: source.content,
          formats: selectedFormats,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate');

      const data = await res.json();
      setDerivatives(
        (data.derivatives || []).map((d: { format: string; content: string }) => ({
          ...d,
          saved: false,
        }))
      );
    } catch (err) {
      console.error('Repurpose failed:', err);
      setError('Failed to generate derivatives');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedFormats, brand, source.content]);

  const handleSave = useCallback(async (index: number) => {
    const d = derivatives[index];
    if (!d || d.saved) return;

    await onSaveDraft({
      content: d.content,
      contentType: d.format,
      tone: source.tone,
      status: 'draft',
      scheduledFor: null,
    });

    setDerivatives(prev =>
      prev.map((item, i) => i === index ? { ...item, saved: true } : item)
    );
  }, [derivatives, onSaveDraft, source.tone]);

  const handleEditContent = useCallback((index: number, newContent: string) => {
    setDerivatives(prev =>
      prev.map((item, i) => i === index ? { ...item, content: newContent } : item)
    );
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          padding: 24,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
            Repurpose Content
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Source content */}
        <div
          style={{
            background: 'var(--surface-hover)',
            borderRadius: 10,
            padding: 14,
            border: '1px solid var(--border)',
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>
            Source
          </span>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
            {source.content}
          </p>
        </div>

        {/* Format selection */}
        <div style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
            Select formats to generate
          </span>
          <div className="grid grid-cols-2 gap-2">
            {formats.map(f => {
              const selected = selectedFormats.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggleFormat(f.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: selected ? '1.5px solid #0A84FF' : '1px solid var(--border)',
                    background: selected ? 'rgba(10,132,255,0.06)' : 'var(--surface)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 500, color: selected ? '#0A84FF' : 'var(--text-primary)' }}>
                    {f.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {f.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={selectedFormats.length === 0 || isGenerating}
          style={{
            fontSize: 13,
            fontWeight: 500,
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: selectedFormats.length > 0 && !isGenerating ? '#0A84FF' : 'var(--surface-hover)',
            color: selectedFormats.length > 0 && !isGenerating ? '#fff' : 'var(--text-tertiary)',
            cursor: selectedFormats.length > 0 && !isGenerating ? 'pointer' : 'default',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {isGenerating ? (
            <>
              <div
                className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
              />
              Generating...
            </>
          ) : (
            <>
              Generate {selectedFormats.length > 0 ? `(${selectedFormats.length})` : ''}
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <p style={{ fontSize: 13, color: 'var(--error, #ff3b30)', marginBottom: 12 }}>
            {error}
          </p>
        )}

        {/* Results */}
        {derivatives.length > 0 && (
          <div className="space-y-3 flex-1">
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
              Generated Derivatives
            </span>
            {derivatives.map((d, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--surface-hover)',
                  borderRadius: 10,
                  padding: 14,
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#0A84FF',
                    background: 'rgba(10,132,255,0.12)',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}>
                    {d.format}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {d.content.length} chars
                  </span>
                </div>
                <textarea
                  value={d.content}
                  onChange={(e) => handleEditContent(i, e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    background: 'transparent',
                    border: 'none',
                    resize: 'vertical',
                    outline: 'none',
                    lineHeight: 1.5,
                  }}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => handleSave(i)}
                    disabled={d.saved}
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      padding: '5px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: d.saved ? 'rgba(48,209,88,0.12)' : 'rgba(10,132,255,0.1)',
                      color: d.saved ? '#30D158' : '#0A84FF',
                      cursor: d.saved ? 'default' : 'pointer',
                    }}
                  >
                    {d.saved ? 'Saved' : 'Save as Draft'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
