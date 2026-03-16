import { Resend } from 'resend';
import { promises as fs } from 'fs';
import path from 'path';
import {
  EmailTemplateData,
  Segment,
  SegmentIndicators,
  detectSegment,
  getEmailSequenceForSegment,
  generateEmailContent,
} from './email-templates';

// Re-export segment types for convenience
export type { Segment, SegmentIndicators };

// Lazy initialize Resend client (only when needed)
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Pending emails storage
const DATA_DIR = path.join(process.cwd(), 'data');
const PENDING_EMAILS_FILE = path.join(DATA_DIR, 'pending-emails.json');

// From address - use your verified domain or Resend's default
const FROM_EMAIL = process.env.EMAIL_FROM || 'BrandOS <onboarding@resend.dev>';

// =============================================================================
// Types
// =============================================================================

export interface PendingEmail {
  id: string;
  to: string;
  templateId: string;
  data: Partial<EmailTemplateData>;
  scheduledFor: string; // ISO timestamp
  createdAt: string;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
}

// =============================================================================
// Pending Emails Storage
// =============================================================================

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readPendingEmails(): Promise<PendingEmail[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(PENDING_EMAILS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writePendingEmails(emails: PendingEmail[]) {
  await ensureDataDir();
  await fs.writeFile(PENDING_EMAILS_FILE, JSON.stringify(emails, null, 2));
}

// =============================================================================
// Core Email Functions
// =============================================================================

/**
 * Send a single email via Resend
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  scoreCardImage?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = getResendClient();

  // Skip if no API key (development mode)
  if (!resend) {
    console.log('[Email] No RESEND_API_KEY - skipping send');
    console.log('[Email] Subject:', subject);
    return { success: true, id: 'dev-mode-skip' };
  }

  try {
    // Convert plain text to HTML (preserve line breaks)
    const html = body
      .split('\n')
      .map((line) => {
        // Replace score card image placeholder
        if (line.includes('{{SCORE_CARD_IMAGE}}')) {
          if (scoreCardImage) {
            return `<div style="text-align: center; margin: 24px 0;"><img src="cid:scorecard" alt="Your BrandOS Score Card" style="max-width: 100%; width: 600px; border-radius: 8px;" /></div>`;
          }
          return ''; // Remove placeholder if no image
        }
        // Replace archetype image placeholder
        const archetypeMatch = line.match(/\{\{ARCHETYPE_IMAGE:(.*?)\}\}/);
        if (archetypeMatch) {
          return `<div style="text-align: center; margin: 32px 0 16px 0;"><img src="cid:archetype-icon" alt="Your Archetype" style="width: 120px; height: 120px;" /></div>`;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return `<p><strong>${line.slice(2, -2)}</strong></p>`;
        }
        if (line.startsWith('→ ') || line.startsWith('• ') || line.startsWith('✓ ')) {
          return `<p style="margin-left: 20px;">${line}</p>`;
        }
        if (line.trim() === '') {
          return '<br>';
        }
        return `<p>${line}</p>`;
      })
      .join('\n');

    // Build attachments array for inline images
    const attachments: Array<{
      filename: string;
      content: Buffer;
      contentType: string;
      contentId: string;
    }> = [];
    if (scoreCardImage) {
      // Extract base64 data from data URL (data:image/png;base64,...)
      const base64Data = scoreCardImage.replace(/^data:image\/\w+;base64,/, '');
      attachments.push({
        filename: 'scorecard.png',
        content: Buffer.from(base64Data, 'base64'),
        contentType: 'image/png',
        contentId: 'scorecard',
      });
    }

    // Attach archetype icon if referenced in the email
    const archetypeUrlMatch = body.match(/\{\{ARCHETYPE_IMAGE:(.*?)\}\}/);
    if (archetypeUrlMatch) {
      try {
        // Extract archetype name from URL (e.g. "https://mybrandos.app/archetypes/SIGNAL_SAGE.png" -> "SIGNAL_SAGE")
        const urlPath = archetypeUrlMatch[1];
        const archetypeName = decodeURIComponent(
          urlPath.split('/').pop()?.replace('.png', '') || ''
        );
        const fs = await import('fs');
        const path = await import('path');
        const iconPath = path.join(process.cwd(), 'public', 'archetypes', `${archetypeName}.png`);
        if (fs.existsSync(iconPath)) {
          attachments.push({
            filename: `${archetypeName}.png`,
            content: fs.readFileSync(iconPath) as Buffer,
            contentType: 'image/png',
            contentId: 'archetype-icon',
          });
        }
      } catch (iconErr) {
        console.warn('[Email] Failed to attach archetype icon:', iconErr);
      }
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: body.replace('{{SCORE_CARD_IMAGE}}', '').replace(/\{\{ARCHETYPE_IMAGE:.*?\}\}/g, ''), // Plain text fallback
      ...(attachments.length > 0 ? { attachments } : {}),
    });

    if (result.error) {
      console.error('[Email] Send error:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('[Email] Sent successfully:', result.data?.id);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('[Email] Send exception:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Schedule an email for later sending
 */
export async function schedulePendingEmail(
  to: string,
  templateId: string,
  data: Partial<EmailTemplateData>,
  delayMs: number
): Promise<{ success: boolean; id?: string }> {
  const pending = await readPendingEmails();

  const newEmail: PendingEmail = {
    id: `email_${crypto.randomUUID()}`,
    to,
    templateId,
    data,
    scheduledFor: new Date(Date.now() + delayMs).toISOString(),
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  pending.push(newEmail);
  await writePendingEmails(pending);

  console.log(`[Email] Scheduled ${templateId} at ${newEmail.scheduledFor}`);
  return { success: true, id: newEmail.id };
}

/**
 * Send the welcome email sequence to a new signup
 * @param email - User's email address
 * @param data - Template data for personalization
 * @param segmentOrIndicators - Either a Segment string or SegmentIndicators to detect segment
 */
export async function sendWelcomeSequence(
  email: string,
  data: Partial<EmailTemplateData>,
  segmentOrIndicators?: Segment | SegmentIndicators
): Promise<{ success: boolean; emailsSent: number; emailsScheduled: number; segment: Segment }> {
  let emailsSent = 0;
  let emailsScheduled = 0;

  // Determine segment
  let segment: Segment = 'general';
  if (segmentOrIndicators) {
    if (typeof segmentOrIndicators === 'string') {
      segment = segmentOrIndicators;
    } else {
      segment = detectSegment(segmentOrIndicators);
    }
  }

  // Ensure we have at least a username for templates
  const templateData: Partial<EmailTemplateData> = {
    name: data.name || data.username || 'there',
    username: data.username || 'user',
    score: data.score || 0,
    defineScore: data.defineScore || 0,
    checkScore: data.checkScore || 0,
    generateScore: data.generateScore || 0,
    scaleScore: data.scaleScore || 0,
    archetype: data.archetype || 'Creator',
    archetypeEmoji: data.archetypeEmoji || '✨',
    archetypeTagline: data.archetypeTagline || 'Building your unique brand',
    archetypeDescription: data.archetypeDescription || 'you have a unique voice and perspective',
    archetypeStrengths: data.archetypeStrengths || ['creativity', 'authenticity'],
    topImprovement: data.topImprovement || 'Optimize your bio for clarity',
    topStrength: data.topStrength || 'Your authentic voice',
    defineInsights: data.defineInsights || [],
    checkInsights: data.checkInsights || [],
    generateInsights: data.generateInsights || [],
    scaleInsights: data.scaleInsights || [],
    summary: data.summary || '',
    topImprovements: data.topImprovements || [],
    topStrengths: data.topStrengths || [],
    voiceConsistency: data.voiceConsistency,
    bestContentFormat: data.bestContentFormat,
    contentPillars: data.contentPillars,
    identitySignature: data.identitySignature,
    contentPillarNames: data.contentPillarNames,
    topicConcentration: data.topicConcentration,
    audienceSignal: data.audienceSignal,
    archetypeIconUrl: data.archetypeIconUrl,
    ...data,
  };

  // Get the appropriate sequence for this segment
  const sequence = getEmailSequenceForSegment(segment);
  console.log(`[Email] Using ${segment} sequence (${sequence.length} emails)`);

  // Process each email in the sequence
  for (const template of sequence) {
    try {
      const content = generateEmailContent(template.id, templateData as EmailTemplateData);
      if (!content) continue;

      if (template.sendDelay === 'immediate') {
        // Send immediately (pass score card image for the first email)
        const result = await sendEmail(
          email,
          content.subject,
          content.body,
          templateData.scoreCardImage
        );
        if (result.success) {
          emailsSent++;
        }
      } else {
        // Schedule for later (may fail on read-only filesystems like Vercel)
        const delayMs = parseDelay(template.sendDelay);
        await schedulePendingEmail(email, template.id, templateData, delayMs);
        emailsScheduled++;
      }
    } catch (templateErr) {
      console.warn(`[Email] Failed to process template ${template.id}:`, templateErr);
    }
  }

  return { success: true, emailsSent, emailsScheduled, segment };
}

/**
 * Process all pending emails that are due
 */
export async function processPendingEmails(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const pending = await readPendingEmails();
  const now = new Date();
  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const email of pending) {
    if (email.status !== 'pending') continue;

    const scheduledTime = new Date(email.scheduledFor);
    if (scheduledTime > now) continue;

    processed++;

    // Generate the email content
    const content = generateEmailContent(email.templateId, email.data as EmailTemplateData);
    if (!content) {
      email.status = 'failed';
      email.error = 'Template not found';
      failed++;
      continue;
    }

    // Send the email
    const result = await sendEmail(email.to, content.subject, content.body);
    if (result.success) {
      email.status = 'sent';
      sent++;
    } else {
      email.status = 'failed';
      email.error = result.error;
      failed++;
    }
  }

  // Save updated statuses
  await writePendingEmails(pending);

  return { processed, sent, failed };
}

/**
 * Get pending emails count
 */
export async function getPendingEmailsCount(): Promise<number> {
  const pending = await readPendingEmails();
  return pending.filter((e) => e.status === 'pending').length;
}

// =============================================================================
// Helpers
// =============================================================================

function parseDelay(delay: string): number {
  const match = delay.match(/^(\d+)([hd])$/);
  if (!match) return 0;

  const [, amount, unit] = match;
  const ms =
    unit === 'h' ? parseInt(amount) * 60 * 60 * 1000 : parseInt(amount) * 24 * 60 * 60 * 1000;

  return ms;
}
