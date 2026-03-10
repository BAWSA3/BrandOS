'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const chrome: any;

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

const EXTENSION_ID = process.env.NEXT_PUBLIC_EXTENSION_ID || '';

export default function ExtensionAuthPage() {
  const [status, setStatus] = useState<'loading' | 'authenticating' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    async function handleAuth() {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Already logged in — send tokens to extension
        sendToExtension(session.access_token, session.refresh_token);
        return;
      }

      // Not logged in — start OAuth
      setStatus('authenticating');
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/extension-auth`,
        },
      });

      if (authError) {
        setError(authError.message);
        setStatus('error');
      }
    }

    handleAuth();

    // Listen for auth state changes (after OAuth redirect)
    const supabase = getSupabaseBrowser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        sendToExtension(session.access_token, session.refresh_token);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  function sendToExtension(accessToken: string, refreshToken: string) {
    if (!EXTENSION_ID) {
      // Fallback: post message to window (extension listens via content script)
      window.postMessage({
        type: 'BRANDOS_AUTH_TOKENS',
        accessToken,
        refreshToken,
      }, '*');
      setStatus('success');
      return;
    }

    try {
      // Send directly to extension via externally_connectable
      chrome.runtime.sendMessage(EXTENSION_ID, {
        type: 'AUTH_TOKENS',
        accessToken,
        refreshToken,
      }, (response) => {
        if (chrome.runtime.lastError || !response?.success) {
          // Fallback to postMessage
          window.postMessage({
            type: 'BRANDOS_AUTH_TOKENS',
            accessToken,
            refreshToken,
          }, '*');
        }
        setStatus('success');
      });
    } catch {
      window.postMessage({
        type: 'BRANDOS_AUTH_TOKENS',
        accessToken,
        refreshToken,
      }, '*');
      setStatus('success');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>BrandOS Extension</h1>

        {status === 'loading' && (
          <p style={{ color: '#888' }}>Checking authentication...</p>
        )}

        {status === 'authenticating' && (
          <p style={{ color: '#888' }}>Redirecting to X for login...</p>
        )}

        {status === 'success' && (
          <>
            <p style={{ color: '#22c55e', fontSize: 18, marginBottom: 16 }}>
              Connected successfully
            </p>
            <p style={{ color: '#888', fontSize: 14 }}>
              You can close this tab and return to X. Brand scores will now appear next to usernames.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <p style={{ color: '#ef4444', marginBottom: 16 }}>{error || 'Authentication failed'}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#fff',
                color: '#000',
                border: 'none',
                padding: '10px 24px',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
