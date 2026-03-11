'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useBrandStore } from '@/lib/store';

export default function EarlyAccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)]" />}>
      <EarlyAccessContent />
    </Suspense>
  );
}

function EarlyAccessContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const { initReferralCode, grantBonusGeneration } = useBrandStore();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const copyInviteLink = () => {
    const code = initReferralCode();
    navigator.clipboard.writeText(`${window.location.origin}/early-access?ref=${code}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), ref: ref || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      grantBonusGeneration();
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] relative">
      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="flex items-center justify-center min-h-screen px-6 relative">
        <div className="max-w-[440px] w-full">

          {/* Header */}
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" style={{ boxShadow: '0 0 6px var(--accent)' }} />
              <span className="label-mono text-[var(--accent)]">early access</span>
            </div>
            <h1
              className="text-2xl text-[var(--text-primary)] tracking-tight mb-2"
              style={{ fontFamily: 'var(--font-vcr, "VCR OSD Mono", monospace)' }}
            >
              build with BrandOS_
            </h1>
            <p className="font-mono text-[11px] text-[var(--text-quaternary)] leading-relaxed">
              content engine. brand dna. voice matching.<br />
              {ref ? 'a friend invited you. sign up to get started.' : 'sign up to get early access.'}
            </p>
          </div>

          {!submitted ? (
            /* Email Signup */
            <div className="glass-card border border-[var(--surface-tertiary)] rounded-[var(--radius-md)] p-6">
              <form onSubmit={handleSubmit}>
                <label className="label-mono text-[var(--text-quaternary)] mb-2 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="terminal-input w-full bg-[var(--surface)] border border-[var(--surface-tertiary)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-[var(--transition-fast)] mb-4"
                />

                {error && (
                  <div className="border rounded-[var(--radius-sm)] px-3 py-2 mb-4" style={{ background: 'rgba(255, 59, 48, 0.06)', borderColor: 'rgba(255, 59, 48, 0.15)' }}>
                    <span className="label-mono" style={{ color: 'var(--danger)' }}>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="btn-engine label-mono w-full py-3 rounded-[var(--radius-sm)]"
                  style={loading || !email.trim()
                    ? { background: 'var(--surface-tertiary)', color: 'var(--text-quaternary)', cursor: 'default' }
                    : { background: 'var(--accent)', color: '#fff', cursor: 'pointer' }
                  }
                >
                  {loading ? 'submitting...' : 'get early access'}
                </button>
              </form>
            </div>
          ) : (
            /* Success State */
            <div className="glass-card border border-[var(--surface-tertiary)] rounded-[var(--radius-md)] p-6 text-center">
              <p
                className="text-lg text-[var(--text-primary)] mb-1"
                style={{ fontFamily: 'var(--font-vcr, "VCR OSD Mono", monospace)' }}
              >
                you're in_
              </p>
              <p className="font-mono text-[11px] text-[var(--text-quaternary)] mb-2">
                we'll reach out when it's your turn.
              </p>
              <p className="font-mono text-[11px] text-[var(--accent)] mb-5">
                here's one free generation on the house.
              </p>

              <Link
                href="/content-engine"
                className="btn-engine label-mono inline-block px-6 py-3 rounded-[var(--radius-sm)]"
                style={{ background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)' }}
              >
                back to content engine
              </Link>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}
