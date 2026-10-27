/**
 * Pure text helpers for the support inbox (no DB, no network), so they can be
 * unit-tested with `npm run test:support`.
 */

/** "Ada Lovelace <ada@example.com>" → { name, email }; email is lowercased. */
export function parseAddress(raw: string): { name: string | null; email: string | null } {
  const s = String(raw ?? '').trim();
  const angle = s.match(/^(.*?)<([^<>\s]+@[^<>\s]+)>\s*$/);
  if (angle) {
    const name = angle[1].trim().replace(/^"|"$/g, '').trim();
    return { name: name || null, email: angle[2].toLowerCase() };
  }
  if (/^[^\s@<>]+@[^\s@<>]+$/.test(s)) return { name: null, email: s.toLowerCase() };
  return { name: null, email: null };
}

// A line where a mail client starts quoting the message being replied to.
const QUOTE_HEADER = [
  /^On .{0,200}wrote:$/, // Gmail / Apple Mail
  /^Le .{0,200}a écrit ?:$/, // Gmail, French
  /^El .{0,200}escribió:$/, // Gmail, Spanish
  /^-{2,} ?Original Message ?-{2,}/i, // Outlook
  /^_{10,}$/, // Outlook web divider
  /^--$/, // signature delimiter ("-- ", trimmed)
];

function startsQuote(lines: string[], i: number): boolean {
  const line = lines[i].trim();
  const next = (lines[i + 1] ?? '').trim();
  if (QUOTE_HEADER.some((re) => re.test(line))) return true;
  // Gmail wraps a long "On … <x@y>" line, leaving "wrote:" on the next one.
  if (/^On .{0,200}$/.test(line) && /wrote:$/.test(next)) return true;
  // Outlook desktop: a "From:" header block.
  if (/^From: /.test(line) && /^(Sent|Date): /.test(next)) return true;
  // Only quoted (">") or blank lines from here on.
  return line.startsWith('>') && lines.slice(i).every((l) => !l.trim() || l.trim().startsWith('>'));
}

/**
 * The new text of an email reply, without the quoted thread underneath or a
 * signature. Falls back to the full text when nothing new is left (some
 * clients put the reply below the quote).
 */
export function stripQuotedReply(text: string): string {
  const lines = String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n');
  const cut = lines.findIndex((_, i) => startsQuote(lines, i));
  const fresh = (cut === -1 ? lines : lines.slice(0, cut)).join('\n').trim();
  return fresh || String(text ?? '').trim();
}

/** Very small HTML → text for emails that arrive without a text part. */
export function htmlToText(html: string): string {
  return String(html ?? '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** "Re: Fwd: RE: your score" → "your score". */
export function baseSubject(subject: string): string {
  return String(subject ?? '')
    .replace(/^(\s*(re|fwd?|aw|sv)\s*:\s*)+/i, '')
    .trim();
}

/** "Re: <subject>" for an outgoing reply, without stacking "Re: Re:". */
export function replySubject(subject: string): string {
  const base = baseSubject(subject);
  return base ? `Re: ${base}` : 'Re: your note to BrandOS';
}

/** Every Message-ID in In-Reply-To / References headers, angle brackets kept. */
export function referencedMessageIds(headers: Record<string, string> | null | undefined): string[] {
  if (!headers) return [];
  const pick = (name: string) =>
    Object.entries(headers).find(([k]) => k.toLowerCase() === name)?.[1] ?? '';
  const raw = `${pick('in-reply-to')} ${pick('references')}`;
  return Array.from(new Set(raw.match(/<[^<>\s]+>/g) ?? []));
}

/**
 * The agent chat marks a full replacement reply as <draft>…</draft>. Returns
 * the last one, or null when the message has none.
 */
export function extractDraft(text: string): string | null {
  const all = Array.from(String(text ?? '').matchAll(/<draft>([\s\S]*?)<\/draft>/g));
  const last = all[all.length - 1];
  return last ? last[1].trim() || null : null;
}

/** Plain-text reply → minimal HTML (escaped; paragraphs and line breaks only). */
export function replyHtml(text: string): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  return String(text ?? '')
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}
