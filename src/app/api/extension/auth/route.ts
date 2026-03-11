import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Specific extension ID — update when published to Chrome Web Store
const BRANDOS_EXTENSION_ID = process.env.BRANDOS_CHROME_EXTENSION_ID;

const ALLOWED_ORIGINS = [
  'https://brandos.app',
  'https://www.brandos.app',
  'http://localhost:3000',
];

function corsHeaders(origin?: string | null) {
  const isAllowed = origin && (
    ALLOWED_ORIGINS.includes(origin) ||
    // Only allow the specific extension ID, or any in dev
    (origin.startsWith('chrome-extension://') && (
      !BRANDOS_EXTENSION_ID ||
      origin === `chrome-extension://${BRANDOS_EXTENSION_ID}`
    ))
  );
  const corsOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const { access_token } = await request.json() as { access_token: string };

    if (!access_token) {
      return NextResponse.json({ valid: false, error: 'access_token required' }, { status: 400, headers });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error } = await supabase.auth.getUser(access_token);

    if (error || !user) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired token' }, { status: 401, headers });
    }

    const xUsername = user.user_metadata?.user_name ||
                     user.user_metadata?.preferred_username ||
                     user.user_metadata?.screen_name;

    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        xUsername,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        email: user.email,
      },
    }, { headers });
  } catch {
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500, headers });
  }
}
