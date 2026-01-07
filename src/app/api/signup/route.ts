import { NextRequest, NextResponse } from 'next/server';
import { addEmailSignup } from '@/lib/newsletter';
import { sendWelcomeSequence } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source = 'landing', xUsername, brandData } = body;

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

    // Trigger welcome email sequence
    try {
      const emailResult = await sendWelcomeSequence(email, {
        username: xUsername || 'user',
        name: brandData?.displayName || xUsername || 'there',
        score: brandData?.score || 0,
        defineScore: brandData?.defineScore || 0,
        checkScore: brandData?.checkScore || 0,
        generateScore: brandData?.generateScore || 0,
        scaleScore: brandData?.scaleScore || 0,
        archetype: brandData?.archetype || 'Creator',
        archetypeEmoji: brandData?.archetypeEmoji || '✨',
        archetypeTagline: brandData?.archetypeTagline || '',
        archetypeDescription: brandData?.archetypeDescription || '',
        archetypeStrengths: brandData?.archetypeStrengths || [],
        topImprovement: brandData?.topImprovement || '',
        topStrength: brandData?.topStrength || '',
      });
      console.log('[Signup] Email sequence triggered:', emailResult);
    } catch (emailError) {
      // Log but don't fail the signup if email fails
      console.error('[Signup] Email sequence error:', emailError);
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
