'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient, Session, User as SupabaseUser, SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton for browser client
let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
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

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const supabase = getSupabase();
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
    // Store invite code and any pending brand data in localStorage for use after callback
    if (options?.inviteCode) {
      localStorage.setItem('pendingInviteCode', options.inviteCode);
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
export { getSupabase };
