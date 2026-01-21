'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { InnerCircleBadge } from '@/components/InnerCircleBadge';

interface AuthButtonProps {
  variant?: 'default' | 'compact';
  showInnerCircle?: boolean;
}

export function AuthButton({ variant = 'default', showInnerCircle = true }: AuthButtonProps) {
  const { user, isLoading, signInWithX, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithX();
    } catch (error) {
      console.error('[AuthButton] Sign in error:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      setShowMenu(false);
    } catch (error) {
      console.error('[AuthButton] Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-10 w-10 rounded-full bg-white/10 animate-pulse" />
    );
  }

  // Not signed in - show sign in button
  if (!user) {
    return (
      <button
        onClick={handleSignIn}
        disabled={isSigningIn}
        className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white transition-all disabled:opacity-50"
        style={{
          background: 'linear-gradient(135deg, #1DA1F2 0%, #0D8BDB 100%)',
        }}
      >
        {isSigningIn ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>Sign in</span>
          </>
        )}
      </button>
    );
  }

  // Signed in - show user menu
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 p-1 pr-3 rounded-full transition-all hover:bg-white/10"
        style={{
          background: showMenu ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
        }}
      >
        {/* Avatar */}
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name || user.xUsername}
            className="w-8 h-8 rounded-full object-cover border border-white/20"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            {(user.name || user.xUsername)?.[0]?.toUpperCase() || '?'}
          </div>
        )}

        {/* Name and badge */}
        {variant === 'default' && (
          <div className="flex items-center gap-1">
            <span className="text-white/90 text-sm font-medium max-w-[120px] truncate">
              @{user.xUsername}
            </span>
            {showInnerCircle && user.isInnerCircle && (
              <InnerCircleBadge variant="inline" />
            )}
          </div>
        )}

        {/* Dropdown arrow */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeOpacity="0.6"
          className={`transition-transform ${showMenu ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-56 z-50 rounded-xl overflow-hidden shadow-2xl"
              style={{
                background: 'rgba(20, 20, 25, 0.98)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* User info header */}
              <div className="px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || user.xUsername}
                      className="w-10 h-10 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {(user.name || user.xUsername)?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">
                      {user.name || `@${user.xUsername}`}
                    </div>
                    <div className="text-white/50 text-sm truncate">
                      @{user.xUsername}
                    </div>
                  </div>
                </div>
                {user.isInnerCircle && (
                  <div className="mt-2">
                    <InnerCircleBadge variant="inline" />
                    {user.invitedBy && (
                      <span className="text-white/40 text-xs ml-2">
                        via @{user.invitedBy}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full px-4 py-2.5 text-left text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-3"
                >
                  {isSigningOut ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  )}
                  <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AuthButton;
