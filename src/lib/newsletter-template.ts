/**
 * BrandOS Newsletter Email Template
 *
 * Branded HTML template for broadcast newsletters.
 * Includes unsubscribe link (CAN-SPAM / GDPR compliant).
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';

export interface NewsletterContent {
  subject: string;
  preheader?: string;
  sections: NewsletterSection[];
}

export interface NewsletterSection {
  type: 'heading' | 'text' | 'cta' | 'divider' | 'stat';
  content: string;
  url?: string;       // for cta type
  label?: string;     // for stat type (the number/value)
}

/**
 * Render a newsletter to HTML with the BrandOS branded template
 */
export function renderNewsletter(
  content: NewsletterContent,
  recipientEmail: string
): { html: string; text: string } {
  const unsubscribeUrl = `${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;

  const sectionsHtml = content.sections
    .map((section) => {
      switch (section.type) {
        case 'heading':
          return `<h2 style="font-family: 'VCR OSD Mono', 'JetBrains Mono', monospace; font-size: 18px; font-weight: 600; color: #111; margin: 32px 0 12px 0; letter-spacing: -0.3px;">${section.content}</h2>`;
        case 'text':
          return `<p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; color: #333; line-height: 1.7; margin: 0 0 16px 0;">${section.content}</p>`;
        case 'cta':
          return `<div style="text-align: center; margin: 28px 0;"><a href="${section.url || APP_URL}" style="display: inline-block; padding: 14px 32px; background: #0047FF; color: #fff; font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px; letter-spacing: 0.5px;">${section.content}</a></div>`;
        case 'divider':
          return `<hr style="border: none; border-top: 1px solid #eee; margin: 28px 0;" />`;
        case 'stat':
          return `<div style="text-align: center; margin: 20px 0; padding: 20px; background: #f8f8f8; border-radius: 8px;"><div style="font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 700; color: #0047FF;">${section.label}</div><div style="font-family: -apple-system, sans-serif; font-size: 13px; color: #666; margin-top: 4px;">${section.content}</div></div>`;
        default:
          return '';
      }
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${content.preheader ? `<span style="display:none;max-height:0;overflow:hidden;">${content.preheader}</span>` : ''}
</head>
<body style="margin: 0; padding: 0; background: #f4f4f4; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden; max-width: 560px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 24px 36px; border-bottom: 1px solid #f0f0f0;">
              <div style="font-family: 'VCR OSD Mono', 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; color: #111; letter-spacing: 2px;">BRANDOS</div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 28px 36px 36px 36px;">
              ${sectionsHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background: #fafafa; border-top: 1px solid #f0f0f0;">
              <p style="font-family: -apple-system, sans-serif; font-size: 12px; color: #999; margin: 0; line-height: 1.6; text-align: center;">
                You're receiving this because you signed up at <a href="${APP_URL}" style="color: #999;">mybrandos.app</a>.<br>
                <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Plain text version
  const text = content.sections
    .map((s) => {
      switch (s.type) {
        case 'heading': return `\n## ${s.content}\n`;
        case 'text': return s.content;
        case 'cta': return `${s.content}: ${s.url || APP_URL}`;
        case 'divider': return '\n---\n';
        case 'stat': return `${s.label} — ${s.content}`;
        default: return '';
      }
    })
    .join('\n')
    + `\n\n---\nUnsubscribe: ${unsubscribeUrl}`;

  return { html, text };
}
