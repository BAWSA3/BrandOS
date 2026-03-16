import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import {
  allEmailTemplates,
  generateEmailContent,
  emailSequence,
  EmailTemplateData,
} from '@/lib/email-templates';

// Temporary debug endpoint — remove after fixing email issues
export async function POST(request: NextRequest) {
  const { email } = await request.json();

  const debug: Record<string, unknown> = {};

  debug.resendKeySet = !!process.env.RESEND_API_KEY;
  debug.emailFrom = process.env.EMAIL_FROM || '(not set)';
  debug.allTemplateCount = allEmailTemplates.length;
  debug.sequenceIds = emailSequence.map((t) => t.id);

  // Test generateEmailContent
  const testData: EmailTemplateData = {
    name: 'Test',
    username: 'test',
    score: 75,
    defineScore: 70,
    checkScore: 65,
    generateScore: 80,
    scaleScore: 75,
    archetype: 'SIGNAL_SAGE',
    archetypeEmoji: '✨',
    archetypeTagline: '',
    archetypeDescription: 'Test archetype',
    archetypeStrengths: [],
    topImprovement: '',
    topStrength: '',
    defineInsights: ['Test insight'],
    checkInsights: [],
    generateInsights: [],
    scaleInsights: [],
    summary: 'Test summary',
    topImprovements: [],
    topStrengths: [],
  };

  const content = generateEmailContent('score-explainer', testData);
  debug.contentGenerated = !!content;
  debug.contentSubject = content?.subject?.substring(0, 50) || null;
  debug.contentBodyLength = content?.body?.length || 0;

  // Try direct send if content generated
  if (content && email) {
    try {
      const result = await sendEmail(email, content.subject, content.body);
      debug.sendResult = result;
    } catch (err) {
      debug.sendError = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json(debug);
}
