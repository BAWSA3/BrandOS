/**
 * Marketing email compliance (CAN-SPAM / RFC 8058), shared by every list or
 * promotional send: launch campaigns (sendOnce), the lookup digest, the
 * newsletter route and the legacy welcome sequence.
 *
 *   - a visible unsubscribe link and one-click List-Unsubscribe headers
 *   - the sender's postal address in the footer (MAIL_POSTAL_ADDRESS)
 *
 * The address is Bawsa's to supply. Until MAIL_POSTAL_ADDRESS is set, marketing
 * sends refuse (marketingBlocked) instead of going out without it.
 * Transactional mail (receipts, sign-in, trial notices) doesn't use this.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';

/** The sender's physical postal address, or null when not configured. */
export function postalAddress(): string | null {
  const v = (process.env.MAIL_POSTAL_ADDRESS ?? '').trim();
  return v.length >= 10 ? v : null;
}

/** Why a marketing send must not go out, or null when it may. */
export function marketingBlocked(): string | null {
  return postalAddress()
    ? null
    : 'MAIL_POSTAL_ADDRESS is not set: marketing emails need a postal address in the footer';
}

export function unsubscribeUrl(email: string): string {
  return `${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
}

/** One-click unsubscribe headers (Gmail/Yahoo bulk-sender rules, RFC 8058). */
export function unsubscribeHeaders(email: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${unsubscribeUrl(email)}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Add the compliance footer to a rendered email: the postal address always,
 * and an unsubscribe link when the body doesn't already carry one. Goes just
 * before </body> when there is one, else at the end.
 */
export function withMarketingFooter(
  html: string,
  text: string,
  email: string
): { html: string; text: string } {
  const address = postalAddress();
  const url = unsubscribeUrl(email);
  const hasLink = html.includes('/api/newsletter/unsubscribe');

  const parts: string[] = [];
  if (!hasLink) {
    parts.push(
      `<a href="${escapeHtml(url)}" style="color:#999;text-decoration:underline;">Unsubscribe</a>`
    );
  }
  if (address) parts.push(escapeHtml(address));
  const block = parts.length
    ? `<div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.5;color:#999;text-align:center;padding:16px 24px;">${parts.join('<br />')}</div>`
    : '';

  const i = html.lastIndexOf('</body>');
  const outHtml = block ? (i >= 0 ? html.slice(0, i) + block + html.slice(i) : html + block) : html;

  const textParts: string[] = [];
  if (!text.includes('/api/newsletter/unsubscribe')) textParts.push(`Unsubscribe: ${url}`);
  if (address) textParts.push(address);
  const outText = textParts.length ? `${text}\n\n---\n${textParts.join('\n')}` : text;

  return { html: outHtml, text: outText };
}
