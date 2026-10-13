import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { botGuard } from '@/lib/botid-guard';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';

/**
 * POST /api/early-access — the /early-access signup form.
 *
 * Saves to the EmailSignup list (Prisma, server-side). It used to write a
 * JSON file under process.cwd(), which Vercel's read-only filesystem rejects,
 * so every signup from this page was silently lost.
 *
 * Public, so: BotID + 5/min per IP, strict validation. Existing addresses are
 * never re-subscribed or re-sourced, and new vs existing emails get the same
 * response (no list enumeration). A referral code (?ref=CODE on the page) is
 * kept in `source` as "early-access:ref:CODE" so GET can count referrals.
 *
 * GET /api/early-access?ref=CODE — how many signups came in with this code.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REF_RE = /^[A-Z0-9_-]{3,24}$/;
const SOURCES = new Set(['early-access', 'breakdown-teaser']);

async function handlePost(request: NextRequest) {
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;

  let body: { email?: unknown; ref?: unknown; source?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email' }, { status: 400 });
  }
  const ref = typeof body.ref === 'string' ? body.ref.trim().toUpperCase() : '';
  const base =
    typeof body.source === 'string' && SOURCES.has(body.source) ? body.source : 'early-access';
  const source = REF_RE.test(ref) ? `${base}:ref:${ref}` : base;

  try {
    const existing = await prisma.emailSignup.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!existing) {
      await prisma.emailSignup.create({ data: { email, source } });
    }
    return NextResponse.json({ message: 'Signed up successfully' });
  } catch (error) {
    // a concurrent duplicate is still a successful signup
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ message: 'Signed up successfully' });
    }
    console.error('[early-access] Failed:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

async function handleGet(request: NextRequest) {
  const ref = (request.nextUrl.searchParams.get('ref') ?? '').trim().toUpperCase();
  if (!REF_RE.test(ref)) {
    return NextResponse.json({ error: 'ref parameter is required' }, { status: 400 });
  }
  try {
    const referralCount = await prisma.emailSignup.count({
      where: { source: { endsWith: `:ref:${ref}` } },
    });
    return NextResponse.json({ code: ref, referralCount, unlocked: referralCount >= 1 });
  } catch (error) {
    console.error('[early-access] Referral lookup failed:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePost, rateLimiters.strict);
export const GET = withRateLimit(handleGet, rateLimiters.standard);
