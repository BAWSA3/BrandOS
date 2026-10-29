'use client';

import { useEffect, useState } from 'react';
import type { PeopleState, PersonView } from '@/lib/people-to-know';
import { Btn, ButtonLink, DISPLAY, Label, Panel, VCR } from './ui';
import InfoTip, { TIPS } from './InfoTip';

/**
 * People to know (Playbook, dashboard v2; migration 053): 3 people in the
 * member's niche to reach out to this week (2 peers + 1 one step bigger), why
 * each fits, a first DM drafted in their voice, and an "I messaged them" tick.
 * Shown only to members with the gap (the server decides; "hidden" renders
 * nothing). BrandOS never sends: the member copies the DM out to X.
 *
 * `initial` skips the fetch (the /world-preview harness). No Motion+ headline
 * here: the Record tile keeps the page's one moving number.
 */

const compact = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 10_000
      ? `${Math.round(n / 1000)}K`
      : n >= 1000
        ? `${(n / 1000).toFixed(1)}K`
        : String(n);

const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

type Loaded = PeopleState | { state: 'loading' } | { state: 'error' };

export default function PeopleToKnow({
  initial,
}: {
  initial?: PeopleState | { state: 'loading' };
}) {
  const [data, setData] = useState<Loaded>(initial ?? { state: 'loading' });

  useEffect(() => {
    if (initial) return;
    let live = true;
    fetch('/api/dashboard/people-to-know', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : r.status === 403 ? { state: 'hidden' } : { state: 'error' }))
      .then((d: Loaded) => live && setData(d))
      .catch(() => live && setData({ state: 'error' }));
    return () => {
      live = false;
    };
  }, [initial]);

  if (data.state === 'hidden' || data.state === 'unavailable') return null;

  return (
    <Panel className="p-6 md:col-span-2 md:p-8" style={{ scrollMarginTop: 96 }}>
      <div id="people" className="flex flex-wrap items-center justify-between gap-3">
        <Label>
          People to know
          <InfoTip label="people to know">{TIPS.people}</InfoTip>
        </Label>
        {data.state === 'ready' && (
          <span className="text-[12px]" style={{ fontFamily: VCR, color: 'var(--v-muted)' }}>
            {data.people.filter((p) => p.messaged).length} / {data.people.length} messaged
          </span>
        )}
      </div>
      <p
        className="mt-3 max-w-[640px] text-[15px] leading-[1.5]"
        style={{ color: 'var(--v-muted)' }}
      >
        {data.state === 'ready' && data.reason === 'scale'
          ? 'Scale is your weakest phase: the right people in your niche don’t know you yet.'
          : 'Few known accounts engage with your posts yet.'}{' '}
        Reach out to these people this week. Start a conversation, not a pitch.
      </p>

      {data.state === 'loading' && (
        <p className="mt-6 text-[14px]" style={{ fontFamily: VCR, color: 'var(--v-muted)' }}>
          Finding people in your niche… about 20 seconds
        </p>
      )}
      {data.state === 'error' && (
        <p className="mt-6 text-[14px]" style={{ color: 'var(--v-muted)' }}>
          Couldn&apos;t load this week&apos;s people. Refresh to try again.
        </p>
      )}
      {data.state === 'ready' && (
        <>
          {data.people.length > 0 ? (
            <ul className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {data.people.map((p) => (
                <Person
                  key={p.handle}
                  p={p}
                  onTick={(messaged) =>
                    setData((d) =>
                      d.state === 'ready'
                        ? {
                            ...d,
                            people: d.people.map((x) =>
                              x.handle === p.handle ? { ...x, messaged } : x
                            ),
                          }
                        : d
                    )
                  }
                  preview={!!initial}
                />
              ))}
            </ul>
          ) : null}
          <p className="mt-5 text-[13px]" style={{ color: 'var(--v-muted)' }}>
            {data.people.length === 0
              ? `No one fit well enough this week. New people ${dayLabel(data.next)}.`
              : data.people.length < 3
                ? `That's everyone who fit this week. New people ${dayLabel(data.next)}.`
                : `New people ${dayLabel(data.next)}.`}
          </p>
        </>
      )}
    </Panel>
  );
}

function Person({
  p,
  onTick,
  preview,
}: {
  p: PersonView;
  onTick: (messaged: boolean) => void;
  preview: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(p.dm);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const tick = async () => {
    const next = !p.messaged;
    onTick(next);
    if (preview) return;
    setSaving(true);
    try {
      const r = await fetch('/api/dashboard/people-to-know', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: p.handle, messaged: next }),
      });
      if (!r.ok) onTick(!next);
    } catch {
      onTick(!next);
    } finally {
      setSaving(false);
    }
  };

  const edit = `/dashboard/write?prompt=${encodeURIComponent(
    `A first DM to @${p.handle}: ${p.dm}`.slice(0, 390)
  )}`;

  return (
    <li
      className="flex min-w-0 flex-col p-5"
      style={{
        background: 'var(--v-raised)',
        borderRadius: 14,
        boxShadow: 'inset 0 0 0 1px var(--v-rule)',
        opacity: p.messaged ? 0.72 : 1,
      }}
    >
      <div className="flex items-center gap-3">
        {p.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.avatarUrl}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 object-cover"
            style={{ borderRadius: 999 }}
          />
        ) : (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center text-[16px]"
            style={{ borderRadius: 999, background: 'var(--v-track)', fontFamily: DISPLAY }}
            aria-hidden
          >
            {p.handle[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div
            className="truncate text-[17px]"
            style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: '-0.01em' }}
          >
            {p.name || `@${p.handle}`}
          </div>
          <a
            href={`https://x.com/${p.handle}`}
            target="_blank"
            rel="noreferrer"
            className="v2-focus block truncate text-[13px] hover:underline"
            style={{ color: 'var(--v-muted)' }}
          >
            @{p.handle} · {compact(p.followers)} followers
          </a>
        </div>
      </div>
      <span
        className="mt-3 self-start px-2 py-1 text-[10px] uppercase tracking-[0.14em]"
        style={{
          fontFamily: VCR,
          borderRadius: 999,
          boxShadow: 'inset 0 0 0 1px var(--v-rule)',
          color: 'var(--v-muted)',
        }}
      >
        {p.tier === 'peer' ? 'About your size' : 'One step up'}
      </span>
      <p className="mt-3 text-[15px] leading-[1.45]">{p.why}</p>

      <div className="mt-4">
        <Label>First message</Label>
        <p
          className="mt-2 whitespace-pre-wrap break-words p-3 text-[14px] leading-[1.5]"
          style={{ background: 'var(--v-surface)', borderRadius: 10, color: 'var(--v-ink)' }}
        >
          {p.dm}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Btn onClick={copy} kind="secondary" ariaLabel={`Copy the message to @${p.handle}`}>
          {copied ? 'Copied' : 'Copy message'}
        </Btn>
        <ButtonLink href={edit} kind="quiet">
          Edit in Write
        </ButtonLink>
      </div>

      <label
        className="v2-focus mt-auto flex cursor-pointer items-center gap-3 pt-5 text-[14px]"
        style={{ color: 'var(--v-ink)' }}
      >
        <input
          type="checkbox"
          checked={p.messaged}
          disabled={saving}
          onChange={tick}
          className="h-5 w-5"
          style={{ accentColor: 'var(--v-signal)' }}
        />
        I messaged them
      </label>
    </li>
  );
}
