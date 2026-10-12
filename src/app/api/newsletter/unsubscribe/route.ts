import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeEmail } from '@/lib/newsletter';

// Unsubscribe (form POST + one-click GET link in every email's footer and
// List-Unsubscribe header). Server-side write via Prisma: the old anon-key
// update matched 0 rows (no UPDATE policy), so nobody was ever unsubscribed.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: NextRequest) {
  try {
    // RFC 8058 one-click: mail clients POST to the List-Unsubscribe URL with the
    // address in the query string (form body "List-Unsubscribe=One-Click").
    // The site's unsubscribe form posts JSON { email }.
    const fromQuery = request.nextUrl.searchParams.get('email');
    const email =
      fromQuery ?? ((await request.json().catch(() => ({}))) as { email?: unknown }).email;

    if (!email || typeof email !== 'string' || email.length > 254 || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const found = await unsubscribeEmail(email);
    if (!found) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'You have been unsubscribed.' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also support GET with query param for one-click unsubscribe links
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');

  if (!email || email.length > 254 || !EMAIL_RE.test(email.trim())) {
    return NextResponse.redirect(new URL('/unsubscribe', request.url));
  }

  try {
    await unsubscribeEmail(email);
  } catch (e) {
    console.error('[unsubscribe] failed', e);
    return NextResponse.redirect(new URL('/unsubscribe?error=true', request.url));
  }

  // Same page whether or not the address was on the list (no list enumeration).
  return NextResponse.redirect(new URL('/unsubscribe?success=true', request.url));
}
