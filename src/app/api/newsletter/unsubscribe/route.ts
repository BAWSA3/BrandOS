import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();

    const { data, error } = await supabase
      .from('EmailSignup')
      .update({ unsubscribed: true, unsubscribedAt: new Date().toISOString() })
      .eq('email', normalized)
      .select('id')
      .single();

    if (error || !data) {
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

  if (!email) {
    return NextResponse.redirect(new URL('/unsubscribe', request.url));
  }

  const normalized = email.toLowerCase().trim();

  await supabase
    .from('EmailSignup')
    .update({ unsubscribed: true, unsubscribedAt: new Date().toISOString() })
    .eq('email', normalized);

  return NextResponse.redirect(new URL('/unsubscribe?success=true', request.url));
}
