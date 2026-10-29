'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MEMBER_INVITES } from '@/lib/early-access-rules';
import InfoTip, { TIPS } from '@/components/dashboard-v2/InfoTip';

const VCR = "'VCR OSD Mono', var(--font-jetbrains), monospace";
const DISPLAY = "'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export interface InvitePass {
  code: string;
  link: string;
  usedBy: string | null;
  usedAt: string | null;
}
export interface InviteData {
  cap: number;
  left: number;
  invites: InvitePass[];
}

/**
 * A member's invites, like guest passes: one card, "3 invites", a count of
 * what's left, and one row per invite. A code is made on its first copy (POST
 * /api/dashboard/invites), not upfront. Once someone uses it, the row says
 * who. Follows the dashboard finish (v2 CSS variables). The one moment: the
 * copy button presses and says "Copied".
 * `preview` renders fixed data for /world-preview/access (no network).
 */
export default function InvitePasses({ preview }: { preview?: InviteData }) {
  const [data, setData] = useState<InviteData | null>(preview ?? null);
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (preview) return;
    let live = true;
    fetch('/api/dashboard/invites')
      .then((r) => (r.ok ? (r.json() as Promise<InviteData>) : null))
      .then((d) => {
        if (!live) return;
        if (d) setData(d);
        else setHidden(true); // not a member, or invites not open yet (051)
      })
      .catch(() => live && setHidden(true));
    return () => {
      live = false;
    };
  }, [preview]);

  const flash = useCallback((slot: number) => {
    setCopied(slot);
    window.setTimeout(() => setCopied((c) => (c === slot ? null : c)), 1600);
  }, []);

  const copy = useCallback(
    async (slot: number) => {
      if (!data) return;
      setNote(null);
      const existing = data.invites[slot];
      if (preview) return flash(slot);
      if (existing) {
        const ok = await navigator.clipboard
          ?.writeText(existing.link)
          .then(() => true)
          .catch(() => false);
        if (ok) return flash(slot);
        return setNote(`Copy this link: ${existing.link}`);
      }
      setBusy(slot);
      // Make the code, then copy. Safari only allows a clipboard write inside
      // the tap, so hand it a promise (ClipboardItem) that resolves to the link.
      const made = fetch('/api/dashboard/invites', { method: 'POST' }).then(async (r) => {
        const body = (await r.json().catch(() => ({}))) as { invite?: InvitePass; error?: string };
        if (!r.ok || !body.invite) throw new Error(body.error ?? 'Couldn’t make an invite.');
        return body.invite;
      });
      let wrote = false;
      try {
        if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/plain': made.then((i) => new Blob([i.link], { type: 'text/plain' })),
            }),
          ]);
          wrote = true;
        }
      } catch {
        /* fall back below */
      }
      try {
        const invite = await made;
        if (!wrote) {
          wrote = !!(await navigator.clipboard
            ?.writeText(invite.link)
            .then(() => true)
            .catch(() => false));
        }
        setData((d) =>
          d ? { ...d, left: Math.max(0, d.left - 1), invites: [...d.invites, invite] } : d
        );
        // made either way; if the clipboard said no, show the link to copy by hand
        if (wrote) flash(slot);
        else setNote(`Copy this link: ${invite.link}`);
      } catch (e) {
        setNote(e instanceof Error ? e.message : 'Couldn’t make an invite.');
      } finally {
        setBusy(null);
      }
    },
    [data, flash, preview]
  );

  if (hidden || !data) return null;
  const cap = data.cap || MEMBER_INVITES;
  const used = data.invites.filter((i) => i.usedBy).length;
  // revoked invites still count toward the cap, so show only rows that can exist
  const slots = Math.min(cap, data.invites.length + data.left);
  const leftToGive = slots - used;

  return (
    <section
      aria-labelledby="invites-h"
      className="mt-2"
      style={{
        background: 'var(--v-surface)',
        color: 'var(--v-ink)',
        boxShadow: 'inset 0 0 0 1px var(--v-rule)',
        borderRadius: 14,
        padding: 20,
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="invites-h"
          className="text-[22px] leading-none"
          style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}
        >
          {cap} invites
          <InfoTip label="invites">{TIPS.invites}</InfoTip>
        </h2>
        <span
          className="text-[11px] uppercase tracking-[0.16em]"
          style={{ fontFamily: VCR, color: 'var(--v-muted)' }}
          aria-live="polite"
        >
          {leftToGive} left
        </span>
      </div>
      <p className="mt-2 text-[14px] leading-[1.5]" style={{ color: 'var(--v-muted)' }}>
        Each one is 30 days of BrandOS, no card. Send the link to someone you’d vouch for.
      </p>

      <ul className="mt-4 grid gap-2" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {Array.from({ length: slots }, (_, slot) => {
          const inv = data.invites[slot];
          const isCopied = copied === slot;
          return (
            <li
              key={slot}
              className="flex min-h-[48px] items-center justify-between gap-3"
              style={{
                borderRadius: 10,
                padding: '8px 8px 8px 14px',
                boxShadow: 'inset 0 0 0 1px var(--v-rule)',
              }}
            >
              <span
                className="text-[11px] uppercase tracking-[0.14em]"
                style={{ fontFamily: VCR, color: 'var(--v-muted)' }}
              >
                Invite {slot + 1}
              </span>
              {inv?.usedBy ? (
                <span className="text-[14px]" style={{ color: 'var(--v-ink)' }}>
                  Used by @{inv.usedBy}
                </span>
              ) : (
                <motion.button
                  type="button"
                  onClick={() => copy(slot)}
                  disabled={busy !== null}
                  whileTap={reduce ? undefined : { scale: 0.96 }}
                  animate={isCopied && !reduce ? { scale: [1.06, 1] } : { scale: 1 }}
                  transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                  className="v2-focus min-h-[36px] px-3 text-[12px] uppercase tracking-[0.12em] disabled:opacity-60"
                  style={{
                    fontFamily: VCR,
                    borderRadius: 8,
                    background: isCopied ? 'var(--v-signal)' : 'transparent',
                    color: isCopied ? '#FFFFFF' : 'var(--v-ink)',
                    boxShadow: isCopied ? 'none' : 'inset 0 0 0 1px var(--v-ink)',
                    minWidth: 128,
                  }}
                  aria-label={
                    inv ? `Copy invite link ${slot + 1}` : `Make and copy invite link ${slot + 1}`
                  }
                >
                  {busy === slot ? 'Making…' : isCopied ? 'Copied' : 'Copy link'}
                </motion.button>
              )}
            </li>
          );
        })}
      </ul>
      {note && (
        <p role="alert" className="mt-3 text-[13px]" style={{ color: 'var(--v-muted)' }}>
          {note}
        </p>
      )}
    </section>
  );
}
