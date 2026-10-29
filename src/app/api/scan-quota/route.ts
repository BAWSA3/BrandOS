import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { quotaFor, scanSubject } from '@/lib/scan-quota';

/**
 * GET /api/scan-quota — today's fresh scans for whoever is asking (signed in:
 * their account; signed out: this device). Drives the "2 of 3 scans left
 * today" line and lets the homepage show the limit before starting a read.
 * Read-only; counts only, nothing about anyone else.
 */
async function handleGet(request: NextRequest) {
  const q = await quotaFor(await scanSubject(request.headers));
  return NextResponse.json(q, { headers: { 'Cache-Control': 'no-store' } });
}

export const GET = withRateLimit(handleGet, rateLimiters.standard);
