import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, role, teamSize, brandsManaged, message } = body;

    if (!name || !email || !company) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notificationEmail = process.env.ENTERPRISE_NOTIFY_EMAIL || process.env.EMAIL_FROM || 'team@mybrandos.app';

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
        `Hi ${name},`,
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
