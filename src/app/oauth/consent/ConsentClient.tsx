'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";
const BIG = "'Inter Tight', 'Helvetica Neue', sans-serif";
const BLUE = '#0047FF';

type State =
  | { kind: 'loading' }
  | { kind: 'ask'; client: string; email: string }
  | { kind: 'working' }
  | { kind: 'error'; message: string };

export default function ConsentClient() {
  const params = useSearchParams();
  const id = params.get('authorization_id') ?? '';
  const validId = /^[A-Za-z0-9_-]{8,128}$/.test(id);
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!validId) return;
    void (async () => {
      const supabase = getSupabaseBrowser();
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) {
        // sign in (or create the account), then come straight back here
        const next = `/oauth/consent?authorization_id=${encodeURIComponent(id)}`;
        window.location.href = `/signup?next=${encodeURIComponent(next)}`;
        return;
      }
      const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(id);
      if (error || !data) {
        setState({
          kind: 'error',
          message:
            'This sign-in request expired or was already used. Start again from your AI app.',
        });
        return;
      }
      if (data.redirect_url) {
        window.location.href = data.redirect_url; // already approved before
        return;
      }
      setState({
        kind: 'ask',
        client: data.client?.name || 'An AI app',
        email: data.user?.email ?? s.session.user.email ?? '',
      });
    })();
  }, [id, validId]);

  const decide = async (allow: boolean) => {
    setState({ kind: 'working' });
    const oauth = getSupabaseBrowser().auth.oauth;
    const { data, error } = allow
      ? await oauth.approveAuthorization(id, { skipBrowserRedirect: true })
      : await oauth.denyAuthorization(id, { skipBrowserRedirect: true });
    if (error || !data?.redirect_url) {
      setState({ kind: 'error', message: 'Something went wrong. Start again from your AI app.' });
      return;
    }
    window.location.href = data.redirect_url;
  };

  return (
    <main
      className="flex min-h-screen items-center justify-center px-5 py-10"
      style={{ background: '#F2EFE8', color: '#0E0E0E' }}
    >
      <div className="w-full max-w-[440px]">
        <div
          className="text-[11px] uppercase tracking-[0.14em]"
          style={{ fontFamily: MONO, color: BLUE }}
        >
          Sign in with BrandOS
        </div>

        {validId && state.kind === 'ask' ? (
          <>
            <h1
              className="mt-3 text-[36px] leading-[1.04] md:text-[44px]"
              style={{ fontFamily: BIG, fontWeight: 500 }}
            >
              Connect {state.client} to your BrandOS.
            </h1>
            <ul
              className="mt-6 space-y-2 border-y py-4 text-[14px]"
              style={{ borderColor: 'rgba(0,0,0,0.12)' }}
            >
              <li>✓ Break down X posts against your brand</li>
              <li>✓ Posts you analyze save to your dashboard</li>
              <li>✓ Free plan: 10 reads a week (unlimited your first 30 days)</li>
              <li style={{ color: '#6B6B6B' }}>It never posts or writes anything for you.</li>
            </ul>
            {state.email && (
              <div
                className="mt-4 text-[11px] uppercase tracking-[0.12em]"
                style={{ fontFamily: MONO, color: '#6B6B6B' }}
              >
                Signed in as {state.email}
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => void decide(true)}
                className="flex-1 px-4 py-3 text-[12px] uppercase tracking-[0.14em] text-white"
                style={{ fontFamily: MONO, background: BLUE }}
              >
                Allow
              </button>
              <button
                type="button"
                onClick={() => void decide(false)}
                className="px-4 py-3 text-[12px] uppercase tracking-[0.14em]"
                style={{ fontFamily: MONO, border: '1px solid rgba(0,0,0,0.2)' }}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <p className="mt-4 text-[15px]" style={{ fontFamily: BIG }}>
            {!validId
              ? 'This sign-in link is invalid. Start again from your AI app.'
              : state.kind === 'error'
                ? state.message
                : 'One moment…'}
          </p>
        )}
      </div>
    </main>
  );
}
