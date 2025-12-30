import { NextRequest, NextResponse } from 'next/server';
import { addEmailSignup } from '@/lib/newsletter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source = 'landing' } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Add signup
    const result = await addEmailSignup(email, source);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 409 } // Conflict - already exists
      );
    }

    return NextResponse.json(
      { success: true, message: 'Successfully signed up!' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
