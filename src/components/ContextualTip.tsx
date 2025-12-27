'use client';

import { useState, useEffect } from 'react';

interface ContextualTipProps {
  tip: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showOnce?: boolean;
  storageKey?: string;
  delay?: number;
  children: React.ReactNode;
}

export default function ContextualTip({ 
  tip, 
  position = 'top', 
  showOnce = false,
  storageKey,
  delay = 0,
  children 
}: ContextualTipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  useEffect(() => {
    if (showOnce && storageKey) {
      const dismissed = localStorage.getItem(`tip-dismissed-${storageKey}`);
      if (dismissed) {
        setHasBeenDismissed(true);
      }
    }
  }, [showOnce, storageKey]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (showOnce && storageKey) {
      localStorage.setItem(`tip-dismissed-${storageKey}`, 'true');
      setHasBeenDismissed(true);
    }
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-foreground',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-foreground',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-foreground',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-foreground',
  };

  if (hasBeenDismissed) {
    return <>{children}</>;
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => {
        if (delay > 0) {
          setTimeout(() => setIsVisible(true), delay);
        } else {
          setIsVisible(true);
        }
      }}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div 
          className={`absolute z-50 ${positionClasses[position]} animate-fade-in`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative bg-foreground text-background px-3 py-2 rounded-lg text-xs max-w-xs whitespace-normal shadow-lg">
            <div className="flex items-start gap-2">
              <span className="text-yellow-400 flex-shrink-0">💡</span>
              <span>{tip}</span>
              {showOnce && (
                <button 
                  onClick={handleDismiss}
                  className="text-background/60 hover:text-background ml-1 flex-shrink-0"
                >
                  ×
                </button>
              )}
            </div>
            <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
          </div>
        </div>
      )}
    </div>
  );
}

// Empty state component for better UX
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-6">
      {icon && (
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-surface flex items-center justify-center text-muted">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted text-sm max-w-md mx-auto mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Progress milestone component
interface ProgressMilestoneProps {
  milestones: {
    label: string;
    isComplete: boolean;
    isActive?: boolean;
  }[];
}

export function ProgressMilestone({ milestones }: ProgressMilestoneProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {milestones.map((milestone, index) => (
        <div key={index} className="flex items-center">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
            transition-all duration-300
            ${milestone.isComplete 
              ? 'bg-green-500 text-white' 
              : milestone.isActive 
                ? 'bg-foreground text-background' 
                : 'bg-surface text-muted'
            }
          `}>
            {milestone.isComplete ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          {index < milestones.length - 1 && (
            <div className={`w-8 h-0.5 mx-1 transition-colors duration-300 ${
              milestone.isComplete ? 'bg-green-500' : 'bg-border'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

// Feature highlight badge
interface FeatureBadgeProps {
  label: string;
  variant?: 'new' | 'beta' | 'pro';
}

export function FeatureBadge({ label, variant = 'new' }: FeatureBadgeProps) {
  const variantClasses = {
    new: 'bg-green-500/10 text-green-500 border-green-500/20',
    beta: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    pro: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${variantClasses[variant]}`}>
      {label}
    </span>
  );
}

// Keyboard shortcut display
interface KeyboardShortcutProps {
  keys: string[];
}

export function KeyboardShortcut({ keys }: KeyboardShortcutProps) {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((key, index) => (
        <span key={index}>
          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-surface border border-border rounded">
            {key}
          </kbd>
          {index < keys.length - 1 && <span className="text-muted mx-0.5">+</span>}
        </span>
      ))}
    </span>
  );
}









