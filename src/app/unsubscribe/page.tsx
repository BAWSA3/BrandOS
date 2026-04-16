'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const alreadyUnsubscribed = searchParams.get('success') === 'true';
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    alreadyUnsubscribed ? 'success' : 'idle'
  );
  const [message, setMessage] = useState(
    alreadyUnsubscribed ? 'You have been unsubscribed. You won\'t receive any more emails from us.' : ''
  );

  async function handleUnsubscribe(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage('You have been unsubscribed. You won\'t receive any more emails from us.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'JetBrains Mono', monospace",
        background: '#ffffff',
        padding: '24px',
      }}
    >
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          BrandOS — Unsubscribe
        </h1>

        {status === 'success' ? (
          <div style={{ marginTop: 24 }}>
            <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6 }}>{message}</p>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                marginTop: 24,
                color: '#0047FF',
                fontSize: 13,
                textDecoration: 'none',
              }}
            >
              ← Back to BrandOS
            </Link>
          </div>
        ) : (
          <form onSubmit={handleUnsubscribe} style={{ marginTop: 24 }}>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
              Enter your email to unsubscribe from BrandOS emails.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                border: '1px solid #ddd',
                borderRadius: 6,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                width: '100%',
                marginTop: 12,
                padding: '12px 16px',
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                background: '#111',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                opacity: status === 'loading' ? 0.6 : 1,
              }}
            >
              {status === 'loading' ? 'Processing...' : 'Unsubscribe'}
            </button>
            {status === 'error' && (
              <p style={{ color: '#e00', fontSize: 13, marginTop: 12 }}>{message}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  );
}
