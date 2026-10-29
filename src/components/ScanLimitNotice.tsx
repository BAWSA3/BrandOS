'use client';

import { SYSTEM_FONTS } from '@/components/system';
import { counterLine, limitCopy, type QuotaView } from '@/lib/scan-quota-rules';

/**
 * The daily scan limit on the scan form (bone panel, ink text). Two pieces:
 * the quiet "2 of 3 scans left today" line for signed-in free members, and the
 * notice when today's scans are used up: sign in (signed out) or the Founding
 * offer (signed in). Paid members see nothing.
 */

const INK = '#0E0E0E';
const BONE = '#F2EFE8';

export function ScanCounter({ quota }: { quota: QuotaView | null }) {
  const line = quota ? counterLine(quota) : null;
  if (!line) return null;
  return (
    <p
      aria-live="polite"
      style={{
        margin: 0,
        fontFamily: SYSTEM_FONTS.plex,
        fontSize: 12,
        letterSpacing: '0.02em',
        color: 'rgba(14,14,14,.62)',
      }}
    >
      {line}
    </p>
  );
}

export function ScanLimitNotice({
  quota,
  now = new Date(),
}: {
  quota: Pick<QuotaView, 'signedIn' | 'limit'>;
  now?: Date;
}) {
  const c = limitCopy(quota, now);
  return (
    <div
      role="status"
      style={{
        display: 'grid',
        gap: 10,
        padding: '14px 0 2px',
        borderTop: '1px solid rgba(14,14,14,.16)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: SYSTEM_FONTS.display,
          fontWeight: 700,
          fontSize: 18,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          color: INK,
        }}
      >
        {c.title}
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: SYSTEM_FONTS.plex,
          fontSize: 13,
          lineHeight: 1.55,
          color: INK,
        }}
      >
        {c.body}
      </p>
      <a
        href={c.href}
        className="sys-press sys-focus"
        style={{
          justifySelf: 'start',
          fontFamily: SYSTEM_FONTS.plex,
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          textDecoration: 'none',
          padding: '12px 18px',
          background: INK,
          color: BONE,
          border: `1px solid ${INK}`,
        }}
      >
        {c.cta} →
      </a>
    </div>
  );
}
