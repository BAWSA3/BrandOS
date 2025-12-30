import { NextResponse } from 'next/server';
import { getSignupCount } from '@/lib/newsletter';

export async function GET() {
  try {
    const signupCount = await getSignupCount();

    return NextResponse.json({
      signups: signupCount,
      // These will be populated once the app is fully functional
      brandsCreated: 0,
      contentChecks: 0,
      avgBrandScore: 0,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
