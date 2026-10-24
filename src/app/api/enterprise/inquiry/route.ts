import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { botGuard } from '@/lib/botid-guard';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { isValidEmail, safeText } from '@/lib/email-safety';

// Public contact form. The confirmation goes to an address the caller
// chooses, so it carries none of the caller's text; the team notification
// escapes and caps every field.
export async function POST(request: NextRequest) {
  try {
    const botBlock = await botGuard(request);
    if (botBlock) return botBlock;

    const ip = getClientIdentifier(request);
    if (checkRateLimit(`inquiry:${ip}`, { interval: 60 * 60 * 1000, maxRequests: 3 }).limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const raw = await request.text();
    if (raw.length > 20_000) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const name = safeText(body.name, 100);
    const company = safeText(body.company, 120);
    const role = safeText(body.role, 80);
    const teamSize = safeText(body.teamSize, 40);
    const brandsManaged = safeText(body.brandsManaged, 40);
    const interest = safeText(body.interest, 120);
    const message = safeText(body.message, 4000);

    if (!name || !email || !company) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    if (
      checkRateLimit(`inquiry-email:${email.toLowerCase()}`, {
        interval: 24 * 60 * 60 * 1000,
        maxRequests: 1,
      }).limited
    ) {
      return NextResponse.json({ success: true });
    }

    const notificationEmail =
      process.env.ENTERPRISE_NOTIFY_EMAIL || process.env.EMAIL_FROM || 'team@mybrandos.app';

    await sendEmail(
      notificationEmail,
      `[Enterprise Inquiry] ${company} — ${name}`,
      [
        `**New Enterprise Inquiry**`,
        ``,
        `Name: ${name}`,
        `Email: ${email}`,
        `Company: ${company}`,
        `Role: ${role || 'Not specified'}`,
        `Team Size: ${teamSize || 'Not specified'}`,
        `Brands Managed: ${brandsManaged || 'Not specified'}`,
        `Interest: ${interest || 'Not specified'}`,
        ``,
        `**Message:**`,
        message || '(No message provided)',
        ``,
        `---`,
        `Submitted at: ${new Date().toISOString()}`,
      ].join('\n')
    );

    await sendEmail(
      email,
      'Thanks for your interest in BrandOS Enterprise',
      [
        `Hi,`,
        ``,
        `Thanks for reaching out about BrandOS Enterprise! We've received your inquiry and our team will be in touch within 1 business day.`,
        ``,
        `In the meantime, feel free to explore BrandOS at https://mybrandos.app`,
        ``,
        `Best,`,
        `The BrandOS Team`,
      ].join('\n')
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Enterprise Inquiry] Error:', error);
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
