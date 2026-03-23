import { NextRequest, NextResponse } from 'next/server';
import { addEmailSignup } from '@/lib/newsletter';
import { sendWelcomeSequence, sendArchetypeBreakdownEmail, SegmentIndicators } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source = 'landing', xUsername, brandData, segmentData, scoreCardImage } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Add signup (continue even if already exists — we still want to send the email)
    const result = await addEmailSignup(email, source, xUsername);
    const isExisting = !result.success;

    // Archetype scan flow: just collect email, don't send anything yet
    if (source === 'archetype-scan') {
      console.log('[Signup] Archetype scan email collected:', email, xUsername);
      return NextResponse.json(
        { success: true, message: isExisting ? 'Email collected!' : 'Successfully signed up!' },
        { status: isExisting ? 200 : 201 }
      );
    }

    // Standard flow: send welcome sequence
    const segmentIndicators: SegmentIndicators | undefined = segmentData
      ? {
          role: segmentData.role || 'other',
          companySize: segmentData.companySize || '1-10',
          industry: segmentData.industry || 'other',
        }
      : undefined;

    try {
      const emailResult = await sendWelcomeSequence(
        email,
        {
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
          scoreCardImage: scoreCardImage || undefined,
          defineInsights: brandData?.defineInsights || [],
          checkInsights: brandData?.checkInsights || [],
          generateInsights: brandData?.generateInsights || [],
          scaleInsights: brandData?.scaleInsights || [],
          summary: brandData?.summary || '',
          topImprovements: brandData?.topImprovements || [],
          topStrengths: brandData?.topStrengths || [],
          voiceConsistency: brandData?.voiceConsistency,
          bestContentFormat: brandData?.bestContentFormat,
          contentPillars: brandData?.contentPillars,
          identitySignature: brandData?.identitySignature,
          contentPillarNames: brandData?.contentPillarNames,
          topicConcentration: brandData?.topicConcentration,
          audienceSignal: brandData?.audienceSignal,
          archetypeIconUrl: brandData?.archetypeIconUrl,
          postDiagnosis: brandData?.postDiagnosis || null,
        },
        segmentIndicators
      );
      console.log('[Signup] Email sequence triggered:', emailResult);
    } catch (emailError) {
      console.error('[Signup] Email sequence error:', emailError);
    }

    return NextResponse.json(
      { success: true, message: isExisting ? 'Email sent!' : 'Successfully signed up!' },
      { status: isExisting ? 200 : 201 }
    );
  } catch (error) {
    console.error('Signup error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
