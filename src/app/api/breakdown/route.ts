import { NextRequest, NextResponse, after } from 'next/server';
import prisma from '@/lib/db';
import { botGuard } from '@/lib/botid-guard';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { getScanBreakdown, sendBreakdown } from '@/lib/breakdown-email';

/**
 * POST /api/breakdown — "Get The Full Breakdown" after a homepage scan.
 *
 * Adds the email to EmailSignup (source 'breakdown', or keeps an existing
 * row's source) and emails the handle's full scan breakdown, which also
 * secures an early-access spot for BrandOS Dashboards. Public, so: BotID +
 * 5/min per IP, strict validation, service-role write via Prisma.
 *
 * The breakdown is built from our own latest scan of the handle, never from
 * the request. Each address gets each handle's breakdown at most once
 * (EmailSend unique key), so the form can't be used to repeatedly mail
 * someone. Unsubscribed rows are skipped and never re-subscribed. New and
 * existing emails get the same response (no list enumeration).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HANDLE_RE = /^[A-Za-z0-9_]{1,30}$/;

async function handlePost(request: NextRequest) {
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;

  let body: { email?: unknown; handle?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email' }, { status: 400 });
  }
  const rawHandle = typeof body.handle === 'string' ? body.handle.trim().replace(/^@/, '') : '';
  if (!HANDLE_RE.test(rawHandle)) {
    return NextResponse.json({ error: 'Scan your X handle first' }, { status: 400 });
  }
  const handle = rawHandle.toLowerCase();

  try {
    const scan = await getScanBreakdown(handle);
    if (!scan) {
      return NextResponse.json({ error: 'Scan your X handle first' }, { status: 404 });
    }

    const existing = await prisma.emailSignup.findUnique({
      where: { email },
      select: { id: true, xUsername: true },
    });
    const row = existing
      ? await prisma.emailSignup.update({
          where: { id: existing.id },
          // keep the original source and handle; never touch unsubscribe status
          data: { xUsername: existing.xUsername ?? handle },
          select: { id: true },
        })
      : await prisma.emailSignup.create({
          data: { email, xUsername: handle, source: 'breakdown' },
          select: { id: true },
        });

    after(() =>
      sendBreakdown(row.id, scan).catch((e) => console.error('[breakdown] email failed:', e))
    );

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('[breakdown] Failed:', error);
    return NextResponse.json({ error: 'Could not send right now' }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePost, rateLimiters.strict);
