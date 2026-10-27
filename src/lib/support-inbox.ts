import { Resend } from 'resend';
import prisma from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { memberContext, triageThread } from '@/lib/support-agent';
import {
  baseSubject,
  htmlToText,
  parseAddress,
  referencedMessageIds,
  replyHtml,
  replySubject,
  stripQuotedReply,
} from '@/lib/support-text';

/**
 * The support inbox (/admin → Inbox): threads from the feedback button and
 * from replies to our emails (Resend inbound). New member messages are
 * triaged and drafted by the support agent; replies are sent only by an
 * admin, through sendReply. Server-only.
 */

const FROM = process.env.EMAIL_FROM || 'BrandOS <onboarding@resend.dev>';
// Replies to our replies come back through the inbound address too.
const REPLY_TO = process.env.EMAIL_REPLY_TO || undefined;
const MAX_BODY_CHARS = 20_000;
// Model calls from inbound mail are attacker-triggerable: bound them.
const TRIAGE_LIMIT = { interval: 60 * 60 * 1000, maxRequests: 120 };

let resend: Resend | null = null;
function client(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  resend ??= new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const threadWithMessages = { messages: { orderBy: { createdAt: 'asc' as const } } };

/** Run the agent over a thread and store its triage + draft. */
export async function triageAndDraft(threadId: string): Promise<boolean> {
  if (checkRateLimit('support-triage', TRIAGE_LIMIT).limited) return false;
  const thread = await prisma.supportThread.findUnique({
    where: { id: threadId },
    include: threadWithMessages,
  });
  if (!thread) return false;
  const member = await memberContext(thread.userId, thread.email);
  const triage = await triageThread(thread, member);
  if (!triage) return false;
  await prisma.supportThread.update({
    where: { id: threadId },
    data: {
      category: triage.category,
      priority: triage.priority,
      summary: triage.summary || null,
      draft: triage.draft || null,
      status: triage.category === 'spam' ? 'closed' : undefined,
    },
  });
  return true;
}

/** A feedback-button submission becomes a thread (one per feedback row). Triage separately. */
export async function threadFromFeedback(feedbackId: string): Promise<string | null> {
  const fb = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: { user: true },
  });
  if (!fb) return null;
  const subject = `${fb.type.replace('_', ' ')}: ${fb.message.replace(/\s+/g, ' ').slice(0, 70)}`;
  const thread = await prisma.supportThread.upsert({
    where: { feedbackId },
    update: {},
    create: {
      source: 'feedback',
      feedbackId,
      userId: fb.userId,
      email: fb.user?.email?.toLowerCase() ?? null,
      name: fb.user?.name ?? (fb.user?.xUsername ? `@${fb.user.xUsername}` : null),
      subject,
      lastMessageAt: fb.createdAt,
      messages: {
        create: {
          direction: 'in',
          body: [
            fb.message.slice(0, MAX_BODY_CHARS),
            fb.rating != null ? `\n(rating: ${fb.rating})` : '',
            fb.url ? `\n(page: ${fb.url})` : '',
          ].join(''),
          createdAt: fb.createdAt,
        },
      },
    },
  });
  return thread.id;
}

// Auto-replies (out of office, bounces, list mail) never get a thread.
function isAutomated(headers: Record<string, string>): boolean {
  const h = (name: string) =>
    (Object.entries(headers).find(([k]) => k.toLowerCase() === name)?.[1] ?? '').toLowerCase();
  const auto = h('auto-submitted');
  return (
    (auto !== '' && auto !== 'no') ||
    /bulk|junk|list|auto_reply/.test(h('precedence')) ||
    h('x-autoreply') !== '' ||
    h('x-autorespond') !== '' ||
    h('list-unsubscribe') !== ''
  );
}

function ourDomain(): string | null {
  return parseAddress(FROM).email?.split('@')[1] ?? null;
}

export type IngestResult =
  | { status: 'stored'; threadId: string }
  | { status: 'duplicate' | 'ignored' | 'unavailable' };

/**
 * Store one inbound email (by Resend id) on its thread: the thread it
 * replies to (In-Reply-To / References), else the sender's latest open
 * thread with the same subject, else a new one. Idempotent on the email id.
 * Triage separately (triageAndDraft) so the webhook can answer fast.
 */
export async function ingestInboundEmail(emailId: string): Promise<IngestResult> {
  const r = client();
  if (!r) return { status: 'unavailable' };
  if (await prisma.supportMessage.findUnique({ where: { emailId } }))
    return { status: 'duplicate' };

  const { data: mail, error } = await r.emails.receiving.get(emailId);
  if (error || !mail) {
    console.error('[support-inbox] could not fetch inbound email', emailId, error);
    return { status: 'unavailable' };
  }

  const { name, email } = parseAddress(mail.from);
  if (!email) return { status: 'ignored' };
  const domain = ourDomain();
  if ((domain && email.endsWith(`@${domain}`)) || isAutomated(mail.headers ?? {}))
    return { status: 'ignored' };

  const raw = mail.text?.trim() ? mail.text : htmlToText(mail.html ?? '');
  const body = stripQuotedReply(raw).slice(0, MAX_BODY_CHARS);
  if (!body) return { status: 'ignored' };
  const subject = baseSubject(mail.subject ?? '') || '(no subject)';

  const refs = referencedMessageIds(mail.headers);
  const byReference = refs.length
    ? await prisma.supportMessage.findFirst({
        where: { messageId: { in: refs } },
        orderBy: { createdAt: 'desc' },
        select: { threadId: true },
      })
    : null;
  const bySender = byReference
    ? null
    : await prisma.supportThread.findFirst({
        where: {
          email,
          subject,
          status: { not: 'closed' },
          lastMessageAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { lastMessageAt: 'desc' },
        select: { id: true },
      });
  const existingId = byReference?.threadId ?? bySender?.id ?? null;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  const message = {
    direction: 'in',
    body,
    emailId,
    messageId: mail.message_id || null,
  };

  let threadId: string;
  try {
    if (existingId) {
      threadId = existingId;
      await prisma.supportThread.update({
        where: { id: threadId },
        data: { status: 'open', lastMessageAt: new Date(), messages: { create: message } },
      });
    } else {
      const created = await prisma.supportThread.create({
        data: {
          source: 'email',
          email,
          name,
          userId: user?.id ?? null,
          subject,
          messages: { create: message },
        },
      });
      threadId = created.id;
    }
  } catch (e) {
    // A concurrent retry of the same delivery won the unique emailId.
    if ((e as { code?: string }).code === 'P2002') return { status: 'duplicate' };
    throw e;
  }

  return { status: 'stored', threadId };
}

export class SendError extends Error {}

/** Send the admin's reply to the thread's member and record it. */
export async function sendReply(threadId: string, text: string): Promise<void> {
  const body = text.trim();
  if (!body) throw new SendError('The reply is empty.');
  if (/\[check:/i.test(body)) throw new SendError('Resolve every [check: …] before sending.');
  const thread = await prisma.supportThread.findUnique({
    where: { id: threadId },
    include: threadWithMessages,
  });
  if (!thread) throw new SendError('Thread not found.');
  if (!thread.email)
    throw new SendError('This feedback was anonymous; there is no address to reply to.');
  const r = client();
  if (!r) throw new SendError('Email is not configured (RESEND_API_KEY).');

  const refs = thread.messages.map((m) => m.messageId).filter((id): id is string => !!id);
  const last = refs[refs.length - 1];
  const { data, error } = await r.emails.send({
    from: FROM,
    to: thread.email,
    subject: replySubject(thread.subject),
    text: body,
    html: replyHtml(body),
    ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
    ...(last ? { headers: { 'In-Reply-To': last, References: refs.slice(-10).join(' ') } } : {}),
  });
  if (error || !data) {
    console.error('[support-inbox] send failed:', error);
    throw new SendError('Resend rejected the email. Check the logs.');
  }

  await prisma.supportThread.update({
    where: { id: threadId },
    data: {
      status: 'replied',
      draft: null,
      lastMessageAt: new Date(),
      messages: { create: { direction: 'out', body, emailId: data.id } },
    },
  });
  if (thread.feedbackId)
    await prisma.feedback.updateMany({
      where: { id: thread.feedbackId, status: 'new' },
      data: { status: 'reviewed' },
    });
}
