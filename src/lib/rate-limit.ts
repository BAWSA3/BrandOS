/**
 * Simple in-memory rate limiter for Next.js API routes
 *
 * For production with multiple servers, consider using Redis-based rate limiting.
 * This implementation is suitable for single-server deployments.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  interval: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

// In-memory store for rate limit tracking
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Object with limited status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { limited: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitStore.get(key);

  // If no entry or entry has expired, create a new one
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.interval,
    };
    rateLimitStore.set(key, entry);
    return {
      limited: false,
      remaining: config.maxRequests - 1,
      resetIn: config.interval,
    };
  }

  // Increment counter
  entry.count++;

  // Check if over limit
  if (entry.count > config.maxRequests) {
    return {
      limited: true,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  return {
    limited: false,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

/**
 * Get client identifier from request (IP address)
 * Works with various proxy setups (Vercel, Cloudflare, etc.)
 */
export function getClientIdentifier(request: Request): string {
  const headers = request.headers;

  // Check common proxy headers
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Vercel-specific header
  const vercelIp = headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    return vercelIp.split(',')[0].trim();
  }

  // Cloudflare-specific header
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp;
  }

  // Fallback - this won't work in serverless but provides a default
  return 'unknown';
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // Strict: 5 requests per minute (for auth endpoints)
  strict: { interval: 60 * 1000, maxRequests: 5 },

  // Standard: 30 requests per minute (for general API endpoints)
  standard: { interval: 60 * 1000, maxRequests: 30 },

  // Relaxed: 100 requests per minute (for read-heavy endpoints)
  relaxed: { interval: 60 * 1000, maxRequests: 100 },

  // Burst: 10 requests per 10 seconds (for endpoints that might have bursts)
  burst: { interval: 10 * 1000, maxRequests: 10 },
};

/**
 * Higher-order function to wrap an API handler with rate limiting
 * Usage: export const POST = withRateLimit(handler, rateLimiters.strict);
 */
export function withRateLimit<T extends Request>(
  handler: (request: T) => Promise<Response>,
  config: RateLimitConfig = rateLimiters.standard
) {
  return async (request: T): Promise<Response> => {
    const identifier = getClientIdentifier(request);
    const { limited, remaining, resetIn } = checkRateLimit(identifier, config);

    if (limited) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(resetIn / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(resetIn / 1000).toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(resetIn / 1000).toString(),
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = await handler(request);

    // Clone the response to add headers (Response objects are immutable)
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-RateLimit-Remaining', remaining.toString());
    newHeaders.set('X-RateLimit-Reset', Math.ceil(resetIn / 1000).toString());

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}
