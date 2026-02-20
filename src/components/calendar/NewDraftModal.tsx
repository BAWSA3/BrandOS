'use client';

import { useState } from 'react';

interface NewDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    content: string;
    contentType: string;
    tone: string;
    scheduledFor: string | null;
    status: string;
  }) => void;
  defaultDate?: string | null;
}

const contentTypes = ['tweet', 'thread', 'poll', 'hot-take', 'educational', 'story'];
const tones = ['casual', 'hot-take', 'educational', 'launch', 'behind-the-scenes', 'announcement'];

export default function NewDraftModal({ isOpen, onClose, onSubmit, defaultDate }: NewDraftModalProps) {
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('tweet');
  const [tone, setTone] = useState('casual');
  const [scheduledFor, setScheduledFor] = useState(defaultDate || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSubmit({
      content: content.trim(),
      contentType,
      tone,
      scheduledFor: scheduledFor || null,
      status: scheduledFor ? 'scheduled' : 'draft',
    });

    // Reset
    setContent('');
    setContentType('tweet');
    setTone('casual');
    setScheduledFor('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          border: '1px solid var(--border)',
          padding: 24,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>
          New Draft
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Content */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                color: 'var(--text-primary)',
                background: 'var(--surface-hover)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                resize: 'vertical',
                outline: 'none',
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, textAlign: 'right' }}>
              {content.length} characters
            </div>
          </div>

          {/* Type + Tone row */}
          <div className="grid grid-cols-2 gap-3" style={{ marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Type
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  outline: 'none',
                }}
              >
                {contentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/-/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  outline: 'none',
                }}
              >
                {tones.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/-/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Schedule for (optional)
            </label>
            <input
              type="date"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 13,
                color: 'var(--text-primary)',
                background: 'var(--surface-hover)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                outline: 'none',
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              style={{
                fontSize: 13,
                fontWeight: 500,
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim()}
              style={{
                fontSize: 13,
                fontWeight: 500,
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: content.trim() ? '#0A84FF' : 'var(--surface-hover)',
                color: content.trim() ? '#fff' : 'var(--text-tertiary)',
                cursor: content.trim() ? 'pointer' : 'default',
              }}
            >
              Create Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
