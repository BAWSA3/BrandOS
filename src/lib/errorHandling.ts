/**
 * BrandOS Error Handling Utilities
 * 
 * Provides user-friendly error messages and rate limit detection.
 */

import analytics from './analytics';

// =============================================================================
// Types
// =============================================================================

export type ErrorType = 
  | 'rate_limit'
  | 'quota_exceeded'
  | 'network'
  | 'auth'
  | 'validation'
  | 'server'
  | 'unknown';

export interface ProcessedError {
  type: ErrorType;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick?: () => void;
  };
  shouldRetry: boolean;
  retryAfter?: number; // seconds
}

// =============================================================================
// Error Detection Patterns
// =============================================================================

const errorPatterns: { pattern: RegExp | string; type: ErrorType }[] = [
  { pattern: /rate.?limit/i, type: 'rate_limit' },
  { pattern: /429/i, type: 'rate_limit' },
  { pattern: /too many requests/i, type: 'rate_limit' },
  { pattern: /quota/i, type: 'quota_exceeded' },
  { pattern: /credit.?balance/i, type: 'quota_exceeded' },
  { pattern: /credits?.?depleted/i, type: 'quota_exceeded' },
  { pattern: /network/i, type: 'network' },
  { pattern: /fetch failed/i, type: 'network' },
  { pattern: /connection/i, type: 'network' },
  { pattern: /unauthorized/i, type: 'auth' },
  { pattern: /401/i, type: 'auth' },
  { pattern: /403/i, type: 'auth' },
  { pattern: /invalid.*api.*key/i, type: 'auth' },
  { pattern: /validation/i, type: 'validation' },
  { pattern: /invalid/i, type: 'validation' },
  { pattern: /missing/i, type: 'validation' },
  { pattern: /500/i, type: 'server' },
  { pattern: /internal.*error/i, type: 'server' },
];

// =============================================================================
// User-Friendly Messages
// =============================================================================

const errorMessages: Record<ErrorType, { title: string; message: string; shouldRetry: boolean }> = {
  rate_limit: {
    title: "We're a bit busy right now",
    message: "You've hit our rate limit. Please wait a moment and try again.",
    shouldRetry: true,
  },
  quota_exceeded: {
    title: "Daily limit reached",
    message: "We've reached our daily AI quota. Please try again tomorrow, or contact support if urgent.",
    shouldRetry: false,
  },
  network: {
    title: "Connection issue",
    message: "We couldn't reach our servers. Please check your internet connection.",
    shouldRetry: true,
  },
  auth: {
    title: "Authentication error",
    message: "There's an issue with our API configuration. We're looking into it.",
    shouldRetry: false,
  },
  validation: {
    title: "Invalid input",
    message: "Please check your input and try again.",
    shouldRetry: true,
  },
  server: {
    title: "Something went wrong",
    message: "Our servers are having trouble. Please try again in a few minutes.",
    shouldRetry: true,
  },
  unknown: {
    title: "Unexpected error",
    message: "Something unexpected happened. Please try again.",
    shouldRetry: true,
  },
};

// =============================================================================
// Error Processing
// =============================================================================

/**
 * Detect the type of error from an error message or Error object
 */
export function detectErrorType(error: unknown): ErrorType {
  const errorString = getErrorString(error);
  
  for (const { pattern, type } of errorPatterns) {
    if (typeof pattern === 'string') {
      if (errorString.includes(pattern)) return type;
    } else if (pattern.test(errorString)) {
      return type;
    }
  }
  
  return 'unknown';
}

/**
 * Convert any error to a string for pattern matching
 */
function getErrorString(error: unknown): string {
  if (typeof error === 'string') return error.toLowerCase();
  if (error instanceof Error) return error.message.toLowerCase();
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message).toLowerCase();
  }
  return String(error).toLowerCase();
}

/**
 * Process an error and return user-friendly information
 */
export function processError(error: unknown, endpoint?: string): ProcessedError {
  const type = detectErrorType(error);
  const config = errorMessages[type];
  
  // Track the error
  analytics.errorEncountered(type, getErrorString(error));
  
  // Track rate limits specifically
  if (type === 'rate_limit' && endpoint) {
    analytics.rateLimitHit(endpoint);
  }
  
  return {
    type,
    ...config,
  };
}

// =============================================================================
// Retry Helper
// =============================================================================

/**
 * Create a function that can be retried with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelay = 1000, onRetry } = options;
  
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's not a retryable error
      const errorType = detectErrorType(error);
      if (!errorMessages[errorType].shouldRetry) {
        throw error;
      }
      
      if (attempt < maxAttempts) {
        onRetry?.(attempt, error);
        await new Promise(resolve => 
          setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1))
        );
      }
    }
  }
  
  throw lastError;
}

export default {
  detectErrorType,
  processError,
  withRetry,
};
