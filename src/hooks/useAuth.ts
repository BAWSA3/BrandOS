'use client';

import { useState, useEffect, useCallback } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

// Use the SSR-compatible browser client
function getSupabase() {
  return getSupabaseBrowser();
}

export interface AuthUser {
  id: string;
  supabaseId: string;
  xUsername: string;
  xId: string;
  name: string | null;
  avatar: string | null;
  email: string | null;
  isInnerCircle: boolean;
  invitedBy: string | null;
}

interface UseAuthReturn {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  signInWithX: (options?: { inviteCode?: string; redirectTo?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data from our database
  const fetchUser = useCallback(async (supabaseUser: SupabaseUser | null) => {
    if (!supabaseUser) {
      setUser(null);
      return;
    }

    try {
      const res = await fetch('/api/auth/user');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('[useAuth] Failed to fetch user:', error);
      setUser(null);
    }
  }, []);

  // Initialize auth state and handle OAuth callback tokens
  useEffect(() => {
    const initAuth = async () => {
      try {
        const supabase = getSupabase();

        // Check if we have tokens in the URL hash (implicit flow fallback)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Set the session from hash tokens
          const { data: { session: hashSession }, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            console.error('[useAuth] Set session error:', setSessionError);
          } else if (hashSession) {
            setSession(hashSession);
            await fetchUser(hashSession.user);
            // Clean up URL hash and redirect to app
            window.history.replaceState(null, '', '/app');
            setIsLoading(false);
            return;
          }
        }

        // Standard session check
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        await fetchUser(currentSession?.user ?? null);
      } catch (error) {
        console.error('[useAuth] Init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const supabase = getSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchUser(newSession?.user ?? null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  // Sign in with X (Twitter) OAuth
  const signInWithX = useCallback(async (options?: { inviteCode?: string; redirectTo?: string }) => {
    // Store invite code in cookie for use after callback (server-side readable)
    if (options?.inviteCode) {
      document.cookie = `pendingInviteCode=${options.inviteCode}; path=/; max-age=3600; samesite=lax`;
    }

    // Determine redirect URL
    const redirectTo = options?.redirectTo || `${window.location.origin}/api/auth/callback`;

    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error('[useAuth] Sign in error:', error);
      throw error;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[useAuth] Sign out error:', error);
      throw error;
    }
    setUser(null);
    setSession(null);
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (session?.user) {
      await fetchUser(session.user);
    }
  }, [session, fetchUser]);

  return {
    user,
    session,
    isLoading,
    signInWithX,
    signOut,
    refreshUser,
  };
}

// Export the supabase getter for use elsewhere
export { getSupabaseBrowser as getSupabase } from '@/lib/supabase-browser';
