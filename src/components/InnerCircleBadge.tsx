'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface InnerCircleBadgeProps {
  variant?: 'inline' | 'large';
  showEntrance?: boolean;
}

export function InnerCircleBadge({ variant = 'inline', showEntrance = false }: InnerCircleBadgeProps) {
  const [hasAnimated, setHasAnimated] = useState(!showEntrance);

  useEffect(() => {
    if (showEntrance) {
      const timer = setTimeout(() => setHasAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [showEntrance]);

  if (variant === 'large') {
    return (
      <motion.div
        initial={showEntrance ? { scale: 0, opacity: 0, rotate: -180 } : false}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 50%, #D97706 100%)',
          boxShadow: `
            0 0 20px rgba(245, 158, 11, 0.5),
            0 0 40px rgba(245, 158, 11, 0.3),
            0 0 60px rgba(245, 158, 11, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.4)
          `,
        }}
      >
        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: 'inherit' }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              animation: 'innerCircleShimmer 2.5s ease-in-out infinite',
              transform: 'translateX(-100%)',
            }}
          />
        </div>

        {/* Crown icon */}
        <span className="relative text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">👑</span>

        {/* Text */}
        <span
          className="relative font-bold text-sm tracking-wide"
          style={{
            color: '#1a1a1a',
            textShadow: '0 1px 0 rgba(255,255,255,0.3)',
          }}
        >
          Inner Circle
        </span>

        {/* Particle effects on hover */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-yellow-200"
              style={{
                left: `${20 + i * 12}%`,
                top: '50%',
              }}
              animate={{
                y: [0, -8, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  // Inline variant (for header)
  return (
    <motion.span
      initial={showEntrance ? { scale: 0, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="relative inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ml-2 overflow-hidden cursor-default"
      style={{
        background: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 50%, #D97706 100%)',
        color: '#1a1a1a',
        boxShadow: `
          0 0 12px rgba(245, 158, 11, 0.4),
          0 0 24px rgba(245, 158, 11, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.4)
        `,
        textShadow: '0 1px 0 rgba(255,255,255,0.3)',
      }}
    >
      {/* Shimmer overlay */}
      <span
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
          animation: 'innerCircleShimmer 2s ease-in-out infinite',
          transform: 'translateX(-100%)',
        }}
      />

      {/* Crown */}
      <span className="relative text-[11px] drop-shadow-sm">👑</span>

      {/* Text */}
      <span className="relative">Inner Circle</span>

      {/* Subtle pulse glow */}
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(135deg, rgba(255,215,0,0.3) 0%, rgba(245,158,11,0.3) 100%)',
        }}
        animate={{
          opacity: [0, 0.5, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.span>
  );
}

// Hook to check if Inner Circle mode is active
// Now uses database via useAuth, with localStorage fallback for unauthenticated users
export function useInnerCircle() {
  const [isInnerCircle, setIsInnerCircle] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);

  useEffect(() => {
    const validateAndRedeem = async () => {
      const urlParams = new URLSearchParams(window.location.search);

      // Check direct innerCircle param first (for admin/testing)
      const innerCircleParam = urlParams.get('innerCircle');
      if (innerCircleParam === 'true') {
        localStorage.setItem('innerCircle', 'true');
        setIsInnerCircle(true);
        return;
      }

      // Check for invite code in URL
      const inviteCode = urlParams.get('invite');
      if (inviteCode) {
        setIsValidating(true);
        try {
          // Validate the code
          const validateRes = await fetch(`/api/invite?code=${encodeURIComponent(inviteCode)}`);
          const validateData = await validateRes.json();

          if (validateData.valid) {
            // Store the invite code for use during auth flow
            localStorage.setItem('pendingInviteCode', inviteCode);
            document.cookie = `pendingInviteCode=${inviteCode}; path=/; max-age=3600; samesite=lax`;
            setPendingInviteCode(inviteCode);

            // For unauthenticated users going through the score journey,
            // mark as Inner Circle locally (will be persisted on auth)
            localStorage.setItem('innerCircle', 'true');
            localStorage.setItem('innerCircle_referredBy', validateData.createdBy || '');
            setReferredBy(validateData.createdBy);
            setIsInnerCircle(true);

            // Clean up URL (remove invite param)
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('invite');
            window.history.replaceState({}, '', newUrl.toString());
          }
        } catch (err) {
          console.error('[useInnerCircle] Failed to validate invite:', err);
        } finally {
          setIsValidating(false);
        }
        return;
      }

      // Check if user is authenticated and has Inner Circle status in database
      try {
        const res = await fetch('/api/auth/user');
        if (res.ok) {
          const data = await res.json();
          if (data.user?.isInnerCircle) {
            setIsInnerCircle(true);
            setReferredBy(data.user.invitedBy);
            return;
          }
        }
      } catch (err) {
        // Not authenticated or error, fall through to localStorage check
      }

      // Fallback: check localStorage for unauthenticated users
      const stored = localStorage.getItem('innerCircle');
      if (stored === 'true') {
        setIsInnerCircle(true);
        setReferredBy(localStorage.getItem('innerCircle_referredBy'));
      }
    };

    validateAndRedeem();
  }, []);

  return { isInnerCircle, isValidating, referredBy, pendingInviteCode };
}

// Add keyframes to global styles
export function InnerCircleStyles() {
  return (
    <style jsx global>{`
      @keyframes innerCircleShimmer {
        0% {
          transform: translateX(-100%);
        }
        50%, 100% {
          transform: translateX(100%);
        }
      }
    `}</style>
  );
}

export default InnerCircleBadge;
