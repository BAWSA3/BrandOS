import { NextRequest, NextResponse } from 'next/server';
import { addEmailSignup } from '@/lib/newsletter';
import { sendWelcomeSequence, SegmentIndicators } from '@/lib/email';
import { botGuard } from '@/lib/botid-guard';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { isValidEmail, sanitizeDeep } from '@/lib/email-safety';

// Public email capture after a scan. It sends mail to whatever address it's
// given, so: BotID, per-IP and per-address limits, and every caller-supplied
// field escaped before it reaches a template (the score card is the only
// non-text payload and must be a bounded PNG data URL).
const MAX_BODY_BYTES = 2_500_000;
const MAX_CARD_CHARS = 2_000_000;
const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;
const ARCHETYPE_ICON_RE = /^https:\/\/mybrandos\.app\/archetypes\/[A-Za-z0-9_.%-]+\.png$/;

export async function POST(request: NextRequest) {
  try {
    const botBlock = await botGuard(request);
    if (botBlock) return botBlock;

    const ip = getClientIdentifier(request);
    if (checkRateLimit(`signup:${ip}`, { interval: 60 * 60 * 1000, maxRequests: 6 }).limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const source = typeof body.source === 'string' ? body.source.slice(0, 40) : 'landing';
    const xUsername =
      typeof body.xUsername === 'string' && HANDLE_RE.test(body.xUsername.replace(/^@/, ''))
        ? body.xUsername.replace(/^@/, '')
        : undefined;
    const brandData = sanitizeDeep(
      (body.brandData && typeof body.brandData === 'object' ? body.brandData : undefined) as
        | Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
        | undefined
    );
    const segmentData = sanitizeDeep(
      (body.segmentData && typeof body.segmentData === 'object' ? body.segmentData : undefined) as
        | Record<string, string>
        | undefined
    );
    const scoreCardImage =
      typeof body.scoreCardImage === 'string' &&
      body.scoreCardImage.length <= MAX_CARD_CHARS &&
      /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(body.scoreCardImage)
        ? body.scoreCardImage
        : undefined;
    if (brandData && !ARCHETYPE_ICON_RE.test(String(brandData.archetypeIconUrl ?? ''))) {
      delete brandData.archetypeIconUrl;
    }

    // One welcome per address per day, however many IPs ask for it.
    if (
      checkRateLimit(`signup-email:${email.toLowerCase()}`, {
        interval: 24 * 60 * 60 * 1000,
        maxRequests: 2,
      }).limited
    ) {
      return NextResponse.json({ success: true, message: 'Email sent!' }, { status: 200 });
    }

    // Add signup (continue even if already exists — we still want to send the email)
    const result = await addEmailSignup(email, source, xUsername);
    const isExisting = !result.success;

    // Archetype scan flow: just collect email, don't send anything yet
    if (source === 'archetype-scan') {
      console.log('[Signup] Archetype scan email collected for', xUsername ?? 'unknown');
      return NextResponse.json(
        { success: true, message: isExisting ? 'Email collected!' : 'Successfully signed up!' },
        { status: isExisting ? 200 : 201 }
      );
    }

    // Standard flow: send welcome sequence
    const segmentIndicators: SegmentIndicators | undefined = segmentData
      ? {
          role: (segmentData.role || 'other') as SegmentIndicators['role'],
          companySize: (segmentData.companySize || '1-10') as SegmentIndicators['companySize'],
          industry: (segmentData.industry || 'other') as SegmentIndicators['industry'],
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
