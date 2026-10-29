import { Resend } from 'resend';
import prisma from '@/lib/db';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import { normalizeArchetypeName } from '@/lib/archetype-names';
import { renderNewsletter, type NewsletterContent } from '@/lib/newsletter-template';
import { formatNumber } from '@/lib/index-rules';

/**
 * List email campaigns (the BrandOS Studio tease and what follows). Server-only.
 *
 * Every send goes through sendOnce(): it claims an EmailSend row
 * (unique per signup + campaign) BEFORE calling Resend, so each address gets a
 * campaign at most once. That's what stops the public reserve form being used
 * to spam someone, and it makes the send script safe to re-run.
 */

export const CAMPAIGNS = {
  studioTease: 'studio-tease-oct22',
  indexReserved: 'index-reserved-nov2',
  earlyAccess: 'early-access-oct27',
  earlyAccessWelcome: 'early-access-welcome',
  earlyAccessCodes: 'early-access-codes-oct30',
} as const;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';
const FROM = process.env.EMAIL_FROM || 'BrandOS <onboarding@resend.dev>';
// mybrandos.app has no inbox (no MX), so replies need a real mailbox
const REPLY_TO = process.env.EMAIL_REPLY_TO || undefined;

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

// Handles on older (March) signups were free text, so escape anything that
// goes into the email HTML.
const esc = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!
  );

/** Current display name for a stored archetype ("SIGNAL_SAGE" → "SOURCE"), or null. */
function archetypeLabel(raw: string | null): string | null {
  if (!raw) return null;
  const name = normalizeArchetypeName(normalizeArchetypeName(raw).replace(/^The /, ''));
  const info = getArchetypeInfo(name);
  // "62 · NULL" reads like missing data, so the anon archetype stays off the label
  return info && info.name !== 'NULL' ? info.name : null;
}

/**
 * Pre-launch tease (Oct 22 2026) for the whole list: "BrandOS Studio opens
 * Nov 2". One job: get a fresh scan. Hook (their last score + archetype) →
 * button straight away (`/?scan=<handle>` runs their scan) → the why, the
 * Studio, a reply offer, Founding 100 in the P.S.
 *
 * Subject A/B on people with a score: A = "you scored 62 in march",
 * B = "did your brand score go up?". The variant rides utm_content, and
 * conversion is read back from BrandScans (did that handle scan after the send).
 */
type TeaseRecipient = {
  handle: string | null;
  score: number | null;
  archetype?: string | null;
  since: Date;
  variant?: 'a' | 'b';
};

/** Everything the tease says, shared by the plain-text and branded HTML versions. */
function teaseModel(r: TeaseRecipient) {
  const month = r.since.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' }).toLowerCase();
  const days = (Date.now() - r.since.getTime()) / 86_400_000;
  // scanned in the last ~6 weeks: "7 months of posts ago" would read wrong
  const recent = days < 45;
  const months = Math.max(2, Math.round(days / 30));
  const variant = r.variant ?? 'a';
  const utm = `utm_source=email&utm_medium=email&utm_campaign=studio-tease&utm_content=${variant}`;
  const hasScore = r.score != null;

  const subject =
    hasScore && r.handle
      ? variant === 'b'
        ? `@${r.handle}, did your brand score go up?`
        : recent
          ? `@${r.handle}, your last brand score was ${r.score}`
          : `@${r.handle}, you scored ${r.score} in ${month}`
      : r.handle
        ? `@${r.handle}, what's your brand score now?`
        : "what's your brand score now?";

  return {
    subject,
    preheader: hasScore
      ? 'did it go up or down? takes a minute to find out.'
      : 'free, about a minute. BrandOS Studio opens Nov 2.',
    who: r.handle ? `@${esc(r.handle)}` : 'there',
    handle: r.handle ? esc(r.handle) : null,
    score: r.score,
    arch: archetypeLabel(r.archetype ?? null),
    then: recent ? 'last scan' : month,
    url: r.handle
      ? `${APP_URL}/?scan=${encodeURIComponent(r.handle)}&${utm}`
      : `${APP_URL}/?${utm}`,
    hook: hasScore
      ? recent
        ? 'your score moves every time you post. up or down since your last scan? i&#39;d bet you can&#39;t guess which.'
        : `that was ${months} months of posts ago. your score has moved since, up or down, and i&#39;d bet you can&#39;t guess which.`
      : recent
        ? 'you signed up for BrandOS recently. before it opens, see where your brand stands. it&#39;s free and takes about a minute.'
        : `you signed up for BrandOS back in ${month}. i&#39;ve been building since. before it opens, see where your brand stands. it&#39;s free and takes about a minute.`,
    cta: hasScore ? 'See my score now →' : 'Scan my brand →',
    why: '4,000+ creators have scanned their brand on BrandOS. brands are starting to ask AI who to work with instead of reading bios, so knowing where you stand matters more every month.',
    studio:
      'on <b>nov 2</b> i&#39;m opening <b>BrandOS Studio</b>: one dashboard that tracks your brand score over time, keeps you on-brand, and tells you what to fix after every post.',
    reply: 'hit reply with your new score and i&#39;ll tell you the one thing i&#39;d fix first.',
    ps: 'on nov 2 everyone gets full access to BrandOS Studio, free until dec 3. no card needed. the first 100 people who add a card before dec 3 lock in $29/mo for life (nothing is charged until dec 3), plus a recorded teardown of their brand from me. after that, Pro is $39/mo.',
  };
}

/** Plain content (subject, preheader, text part); the HTML comes from renderStudioTease. */
export function studioTeaseContent(r: TeaseRecipient): NonNullable<NewsletterContent> {
  const m = teaseModel(r);
  return {
    subject: m.subject,
    preheader: m.preheader,
    sections: [
      { type: 'text', content: `hey ${m.who},` },
      ...(m.score != null
        ? [
            {
              type: 'stat' as const,
              label: m.arch ? `${m.score} · ${esc(m.arch)}` : String(m.score),
              content: `your brand, ${m.then}`,
            },
          ]
        : []),
      { type: 'text', content: m.hook },
      { type: 'cta', content: m.cta, url: m.url },
      { type: 'text', content: m.why },
      { type: 'text', content: m.studio },
      { type: 'text', content: `${m.reply}<br/><br/>— Bawsa` },
      { type: 'text', content: `<b>p.s.</b> ${m.ps}` },
    ],
  };
}

/**
 * Branded HTML for the tease, in the locked design system: bone canvas, one
 * Klein tile (their score then → "??" now, the whole hook in one glance),
 * ink button, mono micro-labels, hairline rules. Table layout + inline styles
 * for email clients; light-only so Gmail's dark mode doesn't invert the tile.
 */
export function renderStudioTease(
  r: TeaseRecipient,
  email: string
): { html: string; text: string } {
  const m = teaseModel(r);
  const { text } = renderNewsletter(studioTeaseContent(r), email);
  const unsub = `${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
  const asset = process.env.EMAIL_ASSET_BASE || APP_URL;

  const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  const MONO = "'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace";
  const label = (t: string, color = '#6B6862') =>
    `<div style="font-family:${MONO};font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:${color};margin:0 0 10px 0;">${t}</div>`;
  const p = (t: string, extra = '') =>
    `<p style="font-family:${SANS};font-size:16px;line-height:1.6;color:#0E0E0E;margin:0 0 18px 0;${extra}">${t}</p>`;
  const rule = `<tr><td style="padding:8px 0 26px 0;"><div style="border-top:1px solid #DCD8CF;font-size:0;line-height:0;">&nbsp;</div></td></tr>`;
  const big = (v: string, color: string) =>
    `<div style="font-family:${SANS};font-size:76px;line-height:1;font-weight:700;letter-spacing:-3px;color:${color};">${v}</div>`;

  const tile =
    m.score != null
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0047FF;border-radius:10px;">
          <tr><td colspan="3" style="padding:22px 24px 0 24px;">${label(`Brand score · ${m.handle ? '@' + m.handle : 'you'}`, '#B8CBFF')}</td></tr>
          <tr>
            <td valign="top" style="padding:6px 0 24px 24px;width:46%;">
              ${label(m.then, '#B8CBFF')}${big(String(m.score), '#FFFFFF')}
              ${m.arch ? `<div style="font-family:${MONO};font-size:11px;letter-spacing:1.6px;color:#FFFFFF;margin-top:10px;">${esc(m.arch)}</div>` : ''}
            </td>
            <td valign="top" align="center" style="padding:52px 0 0 0;font-family:${MONO};font-size:22px;color:#8FADFF;">&rarr;</td>
            <td valign="top" style="padding:6px 24px 24px 0;width:42%;">
              ${label('now', '#B8CBFF')}${big('??', '#7FA1FF')}
              <div style="font-family:${MONO};font-size:11px;letter-spacing:1.6px;color:#B8CBFF;margin-top:10px;">1 MIN SCAN</div>
            </td>
          </tr>
        </table>`
      : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0047FF;border-radius:10px;">
          <tr><td style="padding:22px 24px 24px 24px;">
            ${label(`Brand score · ${m.handle ? '@' + m.handle : 'you'}`, '#B8CBFF')}
            ${big('??', '#FFFFFF')}
            <div style="font-family:${MONO};font-size:11px;letter-spacing:1.6px;color:#B8CBFF;margin-top:10px;">1 MIN SCAN</div>
          </td></tr>
        </table>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>${esc(m.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F2EFE8;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${m.preheader}${'&nbsp;&zwnj;'.repeat(60)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2EFE8;">
    <tr><td align="center" style="padding:28px 16px 40px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding:0 0 22px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><a href="${APP_URL}" style="text-decoration:none;"><img src="${asset}/brand/wordmark-day-480.png" width="150" alt="BrandOS" style="display:block;width:150px;height:auto;border:0;"></a></td>
            <td align="right" style="font-family:${MONO};font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:#6B6862;">Brand report</td>
          </tr></table>
        </td></tr>
        ${rule}
        <tr><td>${p(`hey ${m.who},`)}</td></tr>
        <tr><td style="padding:4px 0 22px 0;">${tile}</td></tr>
        <tr><td>${p(m.hook)}</td></tr>
        <tr><td style="padding:6px 0 30px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td align="center" style="background:#0E0E0E;border-radius:6px;">
              <a href="${m.url}" style="display:block;padding:17px 20px;font-family:${MONO};font-size:13px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#FFFFFF;text-decoration:none;">${m.cta}</a>
            </td>
          </tr></table>
        </td></tr>
        ${rule}
        <tr><td>${label('Why now')}${p(m.why)}</td></tr>
        <tr><td style="padding-top:6px;">${label('Nov 2 · BrandOS Studio')}${p(m.studio)}</td></tr>
        <tr><td style="padding-top:6px;">${p(m.reply)}${p('— Bawsa', 'margin-bottom:28px;')}</td></tr>
        <tr><td style="background:#FAF8F3;border:1px solid #DCD8CF;border-radius:10px;padding:20px 22px;">
          ${label('Founding 100', '#0047FF')}${p(`<b>p.s.</b> ${m.ps}`, 'font-size:15px;margin:0;')}
        </td></tr>
        <tr><td align="center" style="padding:30px 0 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:#9A968E;">
          You're getting this because you signed up at <a href="${APP_URL}" style="color:#9A968E;">mybrandos.app</a>.<br>
          <a href="${unsub}" style="color:#9A968E;text-decoration:underline;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { html, text };
}

/**
 * "No. 0137 is yours. no code needed" (launch, Nov 2): everyone on the list
 * with an X handle had a number reserved for them (migration 045,
 * scripts/reserve-index-numbers.ts). One job: claim it, which means signing in
 * with X as that handle and joining. It picks up from the Oct 27 early access
 * email: the list went in first, now it's open to all of them, no code needed
 * (so INVITE_ONLY must be off when it goes). No price (GTM phase 2): the P.S.
 * is "free until dec 3, no card".
 */
/**
 * `read` is their latest public scan (score + archetype) when there is one.
 * `earlyAccess` picks the opening: 'sent' got the Oct 27 email, 'replied' was
 * sent a code they never used, 'code' got an unused code in the Oct 30 list
 * send, 'none' never got it.
 * Subject A/B: A = "@handle, No. 0137 is yours. no code needed",
 * B = "@handle, no code needed anymore". The variant rides utm_content.
 */
export type ReservedRecipient = {
  handle: string;
  number: number;
  read?: { score: number; archetype: string } | null;
  earlyAccess?: 'sent' | 'replied' | 'code' | 'none';
  variant?: 'a' | 'b';
  /**
   * Invite-only from Nov 2: the code minted for this reservation
   * (scripts/invite-codes.ts reserve-codes), shown as "AU7K-2QX9", and its
   * link (mybrandos.app/i/AU7K-2QX9). The copy must use them while INVITE_ONLY
   * is on; send-index-reserved.ts refuses to send until it does.
   */
  code?: string;
  codeLink?: string;
};

/** A scan's archetype as a display name, or null when it's missing or junk. */
export function readArchetype(raw: string | null | undefined): string | null {
  const name = normalizeArchetypeName((raw ?? '').replace(/[^\x20-\x7E]/g, '').trim());
  if (!name || /^(null|unknown)$/i.test(name)) return null;
  return getArchetypeInfo(name)?.name ?? null;
}

// Past this, "@handle, No. 0137 is yours. no code needed" runs over 50 characters.
const SUBJECT_HANDLE_MAX = 13;

function reservedModel(r: ReservedRecipient) {
  const no = formatNumber(r.number);
  const variant = r.variant ?? 'a';
  const url = `${APP_URL}/index/claim?utm_source=email&utm_medium=email&utm_campaign=${CAMPAIGNS.indexReserved}&utm_content=${variant}`;
  const read = r.read
    ? { score: Math.round(r.read.score), archetype: esc(r.read.archetype) }
    : null;
  const yours =
    r.handle.length > SUBJECT_HANDLE_MAX
      ? `${no} is yours. no code needed`
      : `@${r.handle}, ${no} is yours. no code needed`;
  return {
    no,
    url,
    read,
    handle: esc(r.handle),
    subject: variant === 'b' ? `@${r.handle}, no code needed anymore` : yours,
    preheader: 'the early access list went in first. now it&#39;s open to you, free until dec 3.',
    opening: {
      sent: 'last tuesday i emailed you about early access. everyone who replied got a code and went in first.',
      replied: 'you replied last week and i sent you a code. you don&#39;t need it anymore.',
      code: 'on friday i sent you an early access code. you don&#39;t need it anymore.',
      none: 'BrandOS has been invite-only. the early access list went in first.',
    }[r.earlyAccess ?? 'sent'],
    open: `today it&#39;s open to everyone on this list. no code needed. your number in the Index is held: <b>${no}</b>.`,
    cta: `Claim ${no} →`,
    index: `the Index is a book of creators brands can browse. every entry shows a real read, not a follower count. ${
      read
        ? `yours is <b>${read.score}/100, ${read.archetype}</b>. that&#39;s what a brand sees on your entry.`
        : 'claiming runs your read, so you&#39;ll see what a brand sees on your entry.'
    }`,
    claim: 'claiming takes a minute: sign in with X, pick your niches, write one line for brands.',
    reply: 'if your read looks wrong, reply and tell me why. i answer every one myself.',
    ps: 'full access is free until dec 3, no card. unclaimed numbers are released dec 3.',
  };
}

/** Plain content (subject, preheader, text part); the HTML comes from renderIndexReservedEmail. */
export function indexReservedContent(r: ReservedRecipient): NonNullable<NewsletterContent> {
  const m = reservedModel(r);
  return {
    subject: m.subject,
    preheader: m.preheader,
    sections: [
      { type: 'text', content: `hey @${m.handle},` },
      { type: 'text', content: `${m.opening}<br/><br/>${m.open}` },
      { type: 'cta', content: m.cta, url: m.url },
      { type: 'text', content: m.index },
      { type: 'text', content: m.claim },
      { type: 'text', content: `${m.reply}<br/><br/>— Bawsa` },
      { type: 'text', content: `<b>p.s.</b> ${m.ps}` },
    ],
  };
}

/** Branded HTML in the locked design system (bone canvas, one Klein tile with the number). */
export function renderIndexReservedEmail(
  r: ReservedRecipient,
  email: string
): { html: string; text: string } {
  const m = reservedModel(r);
  const { text } = renderNewsletter(indexReservedContent(r), email);
  const unsub = `${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
  const asset = process.env.EMAIL_ASSET_BASE || APP_URL;
  const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  const MONO = "'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace";
  const label = (t: string, color = '#6B6862') =>
    `<div style="font-family:${MONO};font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:${color};margin:0 0 10px 0;">${t}</div>`;
  const p = (t: string, extra = '') =>
    `<p style="font-family:${SANS};font-size:16px;line-height:1.6;color:#0E0E0E;margin:0 0 18px 0;${extra}">${t}</p>`;
  const rule = `<tr><td style="padding:8px 0 26px 0;"><div style="border-top:1px solid #DCD8CF;font-size:0;line-height:0;">&nbsp;</div></td></tr>`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>${esc(m.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F2EFE8;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${m.preheader}${'&nbsp;&zwnj;'.repeat(60)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2EFE8;">
    <tr><td align="center" style="padding:28px 16px 40px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding:0 0 22px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><a href="${APP_URL}" style="text-decoration:none;"><img src="${asset}/brand/wordmark-day-480.png" width="150" alt="BrandOS" style="display:block;width:150px;height:auto;border:0;"></a></td>
            <td align="right" style="font-family:${MONO};font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:#6B6862;">The Creator Index</td>
          </tr></table>
        </td></tr>
        ${rule}
        <tr><td>${p(`hey @${m.handle},`)}</td></tr>
        <tr><td style="padding:4px 0 22px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0047FF;border-radius:10px;">
            <tr><td style="padding:22px 24px 24px 24px;">
              ${label('Creator Index · reserved', '#B8CBFF')}
              <div style="font-family:${SANS};font-size:76px;line-height:1;font-weight:700;letter-spacing:-3px;color:#FFFFFF;">${m.no}</div>
              <div style="font-family:${MONO};font-size:11px;letter-spacing:1.6px;color:#FFFFFF;margin-top:12px;">@${m.handle}${m.read ? ` · ${m.read.archetype} · ${m.read.score}/100` : ''}</div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td>${p(m.opening)}${p(m.open)}</td></tr>
        <tr><td style="padding:6px 0 30px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td align="center" style="background:#0E0E0E;border-radius:6px;">
              <a href="${m.url}" style="display:block;padding:17px 20px;font-family:${MONO};font-size:13px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#FFFFFF;text-decoration:none;">${m.cta}</a>
            </td>
          </tr></table>
        </td></tr>
        <tr><td>${p(m.index)}${p(m.claim)}${p(m.reply)}${p('— Bawsa', 'margin-bottom:28px;')}</td></tr>
        <tr><td style="background:#FAF8F3;border:1px solid #DCD8CF;border-radius:10px;padding:20px 22px;">
          ${label('Free until Dec 3', '#0047FF')}${p(`<b>p.s.</b> ${m.ps}`, 'font-size:15px;margin:0;')}
        </td></tr>
        <tr><td align="center" style="padding:30px 0 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:#9A968E;">
          You're getting this because you signed up at <a href="${APP_URL}" style="color:#9A968E;">mybrandos.app</a>.<br>
          <a href="${unsub}" style="color:#9A968E;text-decoration:underline;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { html, text };
}

/**
 * Early access invite (Oct 27 2026), the whole list. Sign-in is invite-only
 * (INVITE_ONLY): new accounts need a personal code. "reply with BrandOS and
 * i'll send you your own code to get in". One job: a reply. No button on purpose: it
 * reads like a personal note, and replies help deliverability before the
 * Nov 2 send. Everyone who replies gets a personal single-use code as a
 * link (mybrandos.app/i/<CODE>, scripts/invite-codes.ts): the Index before
 * Nov 2, the Founding price locked for life, a direct line to Bawsa. No
 * price figure (GTM phase 1). Send only once the codes are live on prod.
 *
 * Subject A/B: A = "@handle, you're on the early access list",
 * B = "early access to BrandOS. reply to claim it."
 */
export type EarlyAccessRecipient = {
  handle: string | null;
  score: number | null;
  since: Date;
  variant?: 'a' | 'b';
};

function earlyAccessModel(r: EarlyAccessRecipient) {
  const month = r.since.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' }).toLowerCase();
  const recent = (Date.now() - r.since.getTime()) / 86_400_000 < 45;
  const variant = r.variant ?? 'a';
  return {
    subject:
      variant === 'b'
        ? 'early access to BrandOS. reply to claim it.'
        : r.handle
          ? `@${r.handle}, you're on the early access list`
          : "you're on the BrandOS early access list",
    preheader: 'BrandOS is invite-only right now. reply with one word to get in.',
    who: r.handle ? `@${esc(r.handle)}` : 'there',
    intro: recent
      ? 'you signed up for BrandOS recently. it&#39;s invite-only right now, and this list gets in first, before the public launch on nov 2.'
      : `you signed up for BrandOS back in ${month}. it&#39;s invite-only right now, and this list gets in first, before the public launch on nov 2.`,
    scoreLine:
      r.score != null
        ? `your last brand score was <b>${r.score}</b>. with your invite you get the full dashboard, plus:`
        : 'with your invite you get the full dashboard, plus:',
    perks: [
      'your entry in the <b>BrandOS Creator Index</b> before it opens on nov 2, where brands browse creators by their real brand read',
      'the <b>Founding price, locked for life</b>, even after the founding spots are gone',
      'a <b>direct line to me</b> from your dashboard',
    ],
    ask: 'want in? reply to this email with the word <b>BrandOS</b> and i&#39;ll send you your own code to get in. it&#39;s single-use and just for you. i answer every reply myself.',
    ps: 'your free brand scan still works without a code. the invite is for the dashboard and the Index.',
  };
}

/** Plain content (subject, preheader, text part); the HTML comes from renderEarlyAccessEmail. */
export function earlyAccessContent(r: EarlyAccessRecipient): NonNullable<NewsletterContent> {
  const m = earlyAccessModel(r);
  return {
    subject: m.subject,
    preheader: m.preheader,
    sections: [
      { type: 'text', content: `hey ${m.who},` },
      { type: 'text', content: m.intro },
      { type: 'text', content: m.scoreLine },
      { type: 'text', content: m.perks.map((p) => `- ${p}`).join('<br/>') },
      { type: 'text', content: `${m.ask}<br/><br/>— Bawsa` },
      { type: 'text', content: `<b>p.s.</b> ${m.ps}` },
    ],
  };
}

/**
 * HTML for the invite: deliberately plain (wordmark, text, signature), so it
 * reads like a note from Bawsa rather than a campaign. Light-only, inline styles.
 */
export function renderEarlyAccessEmail(
  r: EarlyAccessRecipient,
  email: string
): { html: string; text: string } {
  const m = earlyAccessModel(r);
  const { text } = renderNewsletter(earlyAccessContent(r), email);
  const unsub = `${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
  const asset = process.env.EMAIL_ASSET_BASE || APP_URL;
  const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  const p = (t: string, extra = '') =>
    `<p style="font-family:${SANS};font-size:16px;line-height:1.6;color:#0E0E0E;margin:0 0 18px 0;${extra}">${t}</p>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>${esc(m.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F2EFE8;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${m.preheader}${'&nbsp;&zwnj;'.repeat(60)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2EFE8;">
    <tr><td align="center" style="padding:28px 16px 40px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding:0 0 26px 0;">
          <a href="${APP_URL}" style="text-decoration:none;"><img src="${asset}/brand/wordmark-day-480.png" width="120" alt="BrandOS" style="display:block;width:120px;height:auto;border:0;"></a>
        </td></tr>
        <tr><td>
          ${p(`hey ${m.who},`)}${p(m.intro)}${p(m.scoreLine, 'margin-bottom:10px;')}
          <ul style="font-family:${SANS};font-size:16px;line-height:1.6;color:#0E0E0E;margin:0 0 18px 0;padding-left:22px;">${m.perks.map((t) => `<li style="margin:0 0 6px 0;">${t}</li>`).join('')}</ul>
          ${p(m.ask)}
          ${p('— Bawsa', 'margin-bottom:24px;')}${p(`<b>p.s.</b> ${m.ps}`, 'font-size:15px;')}
        </td></tr>
        <tr><td align="center" style="padding:30px 0 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:#9A968E;">
          You're getting this because you signed up at <a href="${APP_URL}" style="color:#9A968E;">mybrandos.app</a>.<br>
          <a href="${unsub}" style="color:#9A968E;text-decoration:underline;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { html, text };
}

/**
 * Sent automatically when someone redeems an early-access code
 * (src/lib/early-access-welcome.ts): "you're in, here are 3 things to do this
 * week". The copy is the manual tour Bawsa approved on Oct 28, as a standalone
 * email. One job: do today's move. One ask: reply with what was confusing.
 *
 * `usedBy` is set when the code was given to one handle and redeemed by
 * another; the email goes to the person it was given to, who may not know.
 */
export type EarlyAccessWelcomeRecipient = {
  handle: string | null;
  usedBy?: string | null;
};

function earlyAccessWelcomeModel(r: EarlyAccessWelcomeRecipient) {
  const usedBy = r.usedBy ? `@${esc(r.usedBy)}` : null;
  return {
    subject: r.handle
      ? `@${r.handle}, you're in. here's what to do first`
      : "you're in. here's what to do first",
    preheader: 'three things for your first week on BrandOS, and one small ask.',
    who: r.handle ? `@${esc(r.handle)}` : 'there',
    opening: usedBy
      ? `saw your code got used by ${usedBy}. if that&#39;s you, you&#39;re in. here&#39;s how to get the most out of it this week.`
      : 'you&#39;re in. here&#39;s how to get the most out of it this week.',
    steps: [
      '<b>do today&#39;s move.</b> the top card on your dashboard is one thing to do today, picked from your recent posts. do that, skip the rest.',
      '<b>score a draft before you post it.</b> open Write, paste what you&#39;re about to post, and you&#39;ll see what&#39;s working and what to fix. it can also draft a post or a full article in your voice.',
      '<b>read your playbook.</b> it&#39;s what your posts say you&#39;re known for and what&#39;s landing. the Brand tab has your growth, who you&#39;re up against, your audience, and an idea board.',
    ],
    cta: 'Do today&#39;s move →',
    url: `${APP_URL}/dashboard?utm_source=email&utm_medium=email&utm_campaign=${CAMPAIGNS.earlyAccessWelcome}`,
    small:
      'small stuff: ⌘K (ctrl+K on windows) jumps anywhere. if you run more than one account, add it from Brand.',
    ask: 'one ask: after you&#39;ve used it twice, reply with the one thing that was confusing or felt useless. one line is plenty. that&#39;s what i&#39;m fixing before launch.',
    ps: usedBy ? `(if ${usedBy} isn&#39;t you, reply and i&#39;ll sort you out.)` : null,
  };
}

/** Plain content (subject, preheader, text part); the HTML comes from renderEarlyAccessWelcomeEmail. */
export function earlyAccessWelcomeContent(
  r: EarlyAccessWelcomeRecipient
): NonNullable<NewsletterContent> {
  const m = earlyAccessWelcomeModel(r);
  return {
    subject: m.subject,
    preheader: m.preheader,
    sections: [
      { type: 'text', content: `hey ${m.who},` },
      { type: 'text', content: m.opening },
      { type: 'text', content: m.steps.map((t, i) => `${i + 1}. ${t}`).join('<br/>') },
      { type: 'cta', content: m.cta, url: m.url },
      { type: 'text', content: m.small },
      { type: 'text', content: `${m.ask}<br/><br/>— Bawsa` },
      ...(m.ps ? [{ type: 'text' as const, content: m.ps }] : []),
    ],
  };
}

/** HTML for the welcome: the same plain note look as the invite, plus one button. */
export function renderEarlyAccessWelcomeEmail(
  r: EarlyAccessWelcomeRecipient,
  email: string
): { html: string; text: string } {
  const m = earlyAccessWelcomeModel(r);
  const { text } = renderNewsletter(earlyAccessWelcomeContent(r), email);
  const unsub = `${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
  const asset = process.env.EMAIL_ASSET_BASE || APP_URL;
  const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  const p = (t: string, extra = '') =>
    `<p style="font-family:${SANS};font-size:16px;line-height:1.6;color:#0E0E0E;margin:0 0 18px 0;${extra}">${t}</p>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>${esc(m.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F2EFE8;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${m.preheader}${'&nbsp;&zwnj;'.repeat(60)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2EFE8;">
    <tr><td align="center" style="padding:28px 16px 40px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding:0 0 26px 0;">
          <a href="${APP_URL}" style="text-decoration:none;"><img src="${asset}/brand/wordmark-day-480.png" width="120" alt="BrandOS" style="display:block;width:120px;height:auto;border:0;"></a>
        </td></tr>
        <tr><td>
          ${p(`hey ${m.who},`)}${p(m.opening, 'margin-bottom:10px;')}
          <ol style="font-family:${SANS};font-size:16px;line-height:1.6;color:#0E0E0E;margin:0 0 22px 0;padding-left:22px;">${m.steps.map((t) => `<li style="margin:0 0 8px 0;">${t}</li>`).join('')}</ol>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;"><tr><td style="background:#0047FF;">
            <a href="${m.url}" style="display:inline-block;padding:13px 22px;font-family:${SANS};font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;">${m.cta}</a>
          </td></tr></table>
          ${p(m.small, 'font-size:15px;color:#4A4741;')}${p(m.ask)}
          ${p('— Bawsa', m.ps ? '' : 'margin-bottom:0;')}${m.ps ? p(m.ps, 'font-size:15px;') : ''}
        </td></tr>
        <tr><td align="center" style="padding:30px 0 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:#9A968E;">
          You're getting this because you redeemed an early-access code at <a href="${APP_URL}" style="color:#9A968E;">mybrandos.app</a>.<br>
          <a href="${unsub}" style="color:#9A968E;text-decoration:underline;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { html, text };
}

/**
 * Oct 30: an early-access code for everyone left on the list (no reply
 * needed), so more people start before Nov 2. One job: use the code. The
 * codes carry no Founding price or early Index, only the tester line
 * (scripts/send-early-access-codes.ts creates them). What to do once in is
 * the welcome email's job, sent on redemption.
 *
 * Subject A/B: A = "@handle, here's your early access code",
 * B = "you're in early. here's your code".
 */
export type EarlyAccessCodeRecipient = {
  handle: string | null;
  code: string; // 8 chars, as stored
  variant?: 'a' | 'b';
};

function earlyAccessCodeModel(r: EarlyAccessCodeRecipient) {
  const variant = r.variant ?? 'a';
  const shown = `${r.code.slice(0, 4)}-${r.code.slice(4)}`;
  return {
    subject:
      variant === 'b' || !r.handle
        ? "you're in early. here's your code"
        : `@${r.handle}, here's your early access code`,
    preheader: 'BrandOS opens to everyone on nov 2. you can start today.',
    who: r.handle ? `@${esc(r.handle)}` : 'there',
    intro: `BrandOS opens to everyone on nov 2. you&#39;re on the list, so you can start now. here&#39;s your code: <b>${shown}</b>`,
    cta: 'Get in early →',
    url: `${APP_URL}/i/${shown}?utm_source=email&utm_medium=email&utm_campaign=${CAMPAIGNS.earlyAccessCodes}&utm_content=${variant}`,
    how: 'the button signs you in with X and applies the code for you. or go to mybrandos.app/signup, tap &quot;Have an early-access code?&quot; and paste it.',
    close:
      'it&#39;s free until dec 3, no card. the code is single-use and just for you. reply if anything breaks, i read every one.',
  };
}

/** Plain content (subject, preheader, text part); the HTML comes from renderEarlyAccessCodeEmail. */
export function earlyAccessCodeContent(
  r: EarlyAccessCodeRecipient
): NonNullable<NewsletterContent> {
  const m = earlyAccessCodeModel(r);
  return {
    subject: m.subject,
    preheader: m.preheader,
    sections: [
      { type: 'text', content: `hey ${m.who},` },
      { type: 'text', content: m.intro },
      { type: 'cta', content: m.cta, url: m.url },
      { type: 'text', content: m.how },
      { type: 'text', content: `${m.close}<br/><br/>— Bawsa` },
    ],
  };
}

/** HTML for the code email: the plain note look, one button. */
export function renderEarlyAccessCodeEmail(
  r: EarlyAccessCodeRecipient,
  email: string
): { html: string; text: string } {
  const m = earlyAccessCodeModel(r);
  const { text } = renderNewsletter(earlyAccessCodeContent(r), email);
  const unsub = `${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
  const asset = process.env.EMAIL_ASSET_BASE || APP_URL;
  const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  const p = (t: string, extra = '') =>
    `<p style="font-family:${SANS};font-size:16px;line-height:1.6;color:#0E0E0E;margin:0 0 18px 0;${extra}">${t}</p>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>${esc(m.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F2EFE8;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${m.preheader}${'&nbsp;&zwnj;'.repeat(60)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2EFE8;">
    <tr><td align="center" style="padding:28px 16px 40px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding:0 0 26px 0;">
          <a href="${APP_URL}" style="text-decoration:none;"><img src="${asset}/brand/wordmark-day-480.png" width="120" alt="BrandOS" style="display:block;width:120px;height:auto;border:0;"></a>
        </td></tr>
        <tr><td>
          ${p(`hey ${m.who},`)}${p(m.intro)}
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px 0;"><tr><td style="background:#0047FF;">
            <a href="${m.url}" style="display:inline-block;padding:13px 22px;font-family:${SANS};font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;">${m.cta}</a>
          </td></tr></table>
          ${p(m.how, 'font-size:15px;color:#4A4741;')}${p(m.close)}
          ${p('— Bawsa', 'margin-bottom:0;')}
        </td></tr>
        <tr><td align="center" style="padding:30px 0 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:#9A968E;">
          You're getting this because you signed up at <a href="${APP_URL}" style="color:#9A968E;">mybrandos.app</a>.<br>
          <a href="${unsub}" style="color:#9A968E;text-decoration:underline;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { html, text };
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

let resend: Resend | null = null;
function client(): Resend {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
  resend ??= new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export type SendResult = 'sent' | 'already-sent' | 'skipped-unsubscribed' | 'failed';

/**
 * Send `content` to a signup at most once per campaign. The EmailSend claim is
 * inserted first (unique key), so concurrent or repeated calls can't double
 * send. If Resend fails, the claim is released so a later run can retry.
 */
export async function sendOnce(
  signupId: string,
  campaign: string,
  build: (signup: { id: string; email: string }) => NewsletterContent,
  // optional campaign-specific HTML (defaults to the shared newsletter template)
  render: (
    content: NonNullable<NewsletterContent>,
    email: string
  ) => {
    html: string;
    text: string;
  } = renderNewsletter
): Promise<SendResult> {
  const signup = await prisma.emailSignup.findUnique({
    where: { id: signupId },
    select: { id: true, email: true, unsubscribed: true },
  });
  if (!signup || signup.unsubscribed) return 'skipped-unsubscribed';

  try {
    await prisma.emailSend.create({ data: { emailSignupId: signup.id, campaign } });
  } catch (e) {
    if ((e as { code?: string }).code === 'P2002') return 'already-sent';
    throw e;
  }

  const content = build(signup);
  const { html, text } = render(content, signup.email);
  const { data, error } = await client().emails.send({
    from: FROM,
    to: signup.email,
    ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
    subject: content.subject,
    html,
    text,
    headers: {
      'List-Unsubscribe': `<${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(signup.email)}>`,
      // RFC 8058 one-click: Gmail/Yahoo POST to the URL above (the route reads ?email=)
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });
  if (error || !data) {
    await prisma.emailSend
      .delete({ where: { emailSignupId_campaign: { emailSignupId: signup.id, campaign } } })
      .catch(() => {});
    console.error(`[launch-emails] ${campaign} send failed`, error);
    return 'failed';
  }
  await prisma.emailSend.update({
    where: { emailSignupId_campaign: { emailSignupId: signup.id, campaign } },
    data: { resendId: data.id },
  });
  return 'sent';
}
