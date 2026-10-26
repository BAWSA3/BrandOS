'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Label, MONO, T, Tile } from './parts';
import XComposer, { Avatar, X } from './XComposer';

/**
 * Idea board: a blank page to think on (not a search box), BrandOS ideas with
 * their reason, and your own notes moving Ideas → Drafting → Posted.
 * With an `accountId` every change is saved to that brand's board
 * (/api/ideas, migration 042) and "New BrandOS ideas" generates ideas from the
 * brand's analytics; without one (the preview) it's local only.
 * Ideas are written and read like X posts (XComposer); editing an idea reopens
 * it in the composer.
 */

export type Idea = {
  id: string | number;
  text: string;
  why?: string;
  hook?: string;
  format?: string;
  col: 'ideas' | 'drafting' | 'posted';
  createdAt?: string;
};
const STATUS: Record<Idea['col'], string> = {
  ideas: 'saved',
  drafting: 'drafting',
  posted: 'posted',
};

async function call(url: string, method: string, body: unknown) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string; idea?: { id: string } };
  if (!res.ok) throw new Error(json.error || 'Something went wrong. Try again.');
  return json;
}

/** X's timestamp: 4m / 3h / Oct 24 (and the year once it isn't this year). */
function ago(iso?: string) {
  if (!iso) return 'now';
  const t = new Date(iso);
  const s = (Date.now() - t.getTime()) / 1000;
  if (!Number.isFinite(s) || s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h`;
  const sameYear = t.getFullYear() === new Date().getFullYear();
  return t.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

// prompts for a blank page: things only this person can say
const SPARKS = [
  'Something I changed my mind about',
  'A question my audience keeps asking',
  'A win (or a miss) from this week',
  'What everyone in my niche gets wrong',
];

export default function IdeaBoard({
  handle,
  name,
  avatarUrl,
  initial,
  accountId,
}: {
  handle: string;
  name?: string | null;
  avatarUrl?: string | null;
  initial: Idea[];
  accountId?: string;
}) {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // the server's board after a refresh (e.g. new BrandOS ideas) replaces the local one
  useEffect(() => {
    const t = window.setTimeout(() => setIdeas(initial), 0);
    return () => window.clearTimeout(t);
  }, [initial]);
  const [draft, setDraft] = useState('');
  const pageRef = useRef<HTMLTextAreaElement>(null);
  const [editing, setEditing] = useState<{ id: Idea['id']; text: string } | null>(null);
  const save = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  };
  const pin = () => {
    const text = draft.trim();
    if (!text) return;
    const temp = Date.now();
    setIdeas((all) => [
      { id: temp, text, col: 'ideas', createdAt: new Date().toISOString() },
      ...all,
    ]);
    setDraft('');
    if (accountId)
      save(async () => {
        const r = await call('/api/ideas', 'POST', { account: accountId, text });
        if (r.idea)
          setIdeas((all) => all.map((i) => (i.id === temp ? { ...i, id: r.idea!.id } : i)));
      });
  };
  const move = (id: Idea['id'], col: Idea['col']) => {
    setIdeas((all) => all.map((i) => (i.id === id ? { ...i, col } : i)));
    if (accountId && typeof id === 'string')
      save(() => call('/api/ideas', 'PATCH', { id, status: STATUS[col] }));
  };
  const edit = () => {
    if (!editing) return;
    const { id } = editing;
    const text = editing.text.trim();
    if (!text) return;
    setIdeas((all) => all.map((i) => (i.id === id ? { ...i, text } : i)));
    setEditing(null);
    if (accountId && typeof id === 'string') save(() => call('/api/ideas', 'PATCH', { id, text }));
  };
  const remove = (id: Idea['id']) => {
    setIdeas((all) => all.filter((i) => i.id !== id));
    if (accountId && typeof id === 'string') save(() => call('/api/ideas', 'DELETE', { id }));
  };
  const generate = async () => {
    if (!accountId) return;
    setBusy(true);
    await save(async () => {
      await call('/api/ideas/generate', 'POST', { account: accountId });
      router.refresh();
    });
    setBusy(false);
  };
  const brand = { handle, name, avatarUrl };

  return (
    <Tile className="md:col-span-12">
      <div className="flex items-center justify-between gap-3">
        <Label>Idea board</Label>
        {accountId && (
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="text-[10px] uppercase tracking-[0.14em] disabled:opacity-50"
            style={{ fontFamily: MONO, color: T.blue }}
          >
            {busy ? 'Thinking…' : '✦ New BrandOS ideas'}
          </button>
        )}
      </div>
      {error && (
        <div
          className="mt-3 border px-3 py-2 text-[13px]"
          style={{ borderColor: '#F3C2C2', background: '#FDF1F1', color: '#9B1C1C' }}
          role="alert"
        >
          {error}
        </div>
      )}
      {/* The blank page: a place to think, not a search box */}
      <div
        className="mt-4 grid grid-cols-1 gap-6 border p-5 md:grid-cols-[1fr_260px] md:gap-10 md:p-8"
        style={{
          borderColor: T.rule,
          background: '#FFFFFF',
        }}
      >
        <div>
          <div className="mb-4 text-[13px] leading-[1.5]" style={{ color: T.muted }}>
            Half-formed is fine. Write it the way you&apos;d post it.
          </div>
          <XComposer
            value={draft}
            onChange={setDraft}
            onSubmit={pin}
            handle={brand.handle}
            name={brand.name}
            avatarUrl={brand.avatarUrl}
            placeholder={`What should @${brand.handle} say next?`}
            textareaRef={pageRef}
          />
        </div>
        <aside className="md:border-l md:pl-8" style={{ borderColor: T.rule }}>
          <Label>Stuck? Start from</Label>
          <div className="mt-3 flex flex-wrap gap-2 md:flex-col md:items-start">
            {SPARKS.map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => {
                  setDraft(`${sp}: `);
                  pageRef.current?.focus();
                }}
                className="border bg-white px-3 py-2 text-left text-[13px] leading-[1.35] transition-colors hover:border-[#0047FF]"
                style={{ borderColor: T.rule }}
              >
                {sp}
              </button>
            ))}
          </div>
        </aside>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {(
          [
            ['ideas', 'Ideas'],
            ['drafting', 'Drafting'],
            ['posted', 'Posted'],
          ] as const
        ).map(([col, title]) => (
          <div
            key={col}
            className="border p-3"
            style={{ borderColor: T.rule, background: T.canvas }}
          >
            <div className="mb-3 flex justify-between">
              <Label>{title}</Label>
              <Label>{ideas.filter((i) => i.col === col).length}</Label>
            </div>
            <div className="space-y-2.5">
              {ideas
                .filter((i) => i.col === col)
                .map((i) => (
                  <article
                    key={i.id}
                    className="border bg-white px-3 py-3"
                    style={{ borderColor: X.rule, fontFamily: X.font, color: X.ink }}
                  >
                    {editing?.id === i.id ? (
                      <XComposer
                        value={editing.text}
                        onChange={(text) => setEditing({ id: i.id, text })}
                        onSubmit={edit}
                        onCancel={() => setEditing(null)}
                        handle={brand.handle}
                        name={brand.name}
                        avatarUrl={brand.avatarUrl}
                        submitLabel="Save"
                        toolbar={false}
                        autoFocus
                      />
                    ) : (
                      <div className="flex gap-3">
                        <Avatar
                          name={brand.name}
                          handle={brand.handle}
                          avatarUrl={brand.avatarUrl}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-baseline gap-1 text-[15px] leading-5">
                            <span className="truncate font-bold">{brand.name || brand.handle}</span>
                            <span
                              className="truncate"
                              style={{ color: X.muted }}
                              suppressHydrationWarning
                            >
                              @{brand.handle} · {ago(i.createdAt)}
                            </span>
                          </div>
                          {i.why && (
                            <div
                              className="mt-1 text-[9px] uppercase tracking-[0.14em]"
                              style={{ fontFamily: MONO, color: T.blue }}
                            >
                              ✦ BrandOS idea
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditing({ id: i.id, text: i.text })}
                            className="mt-0.5 block w-full whitespace-pre-wrap break-words text-left text-[15px] leading-5"
                            aria-label={`Edit idea: ${i.text.slice(0, 80)}`}
                          >
                            {i.text}
                          </button>
                          {i.hook && (
                            <div className="mt-1.5 text-[14px] leading-5">
                              <span style={{ color: X.muted }}>Open with: </span>
                              {i.hook}
                            </div>
                          )}
                          {i.format && i.format !== 'note' && (
                            <div
                              className="mt-1 text-[10px] uppercase tracking-[0.14em]"
                              style={{ fontFamily: MONO, color: X.muted }}
                            >
                              {i.format}
                            </div>
                          )}
                          {i.why && (
                            <div
                              className="mt-1.5 text-[13px] leading-[18px]"
                              style={{ color: X.muted }}
                            >
                              {i.why}
                            </div>
                          )}
                          <div
                            className="mt-2.5 flex items-center gap-4 text-[13px]"
                            style={{ color: X.muted }}
                          >
                            {col !== 'drafting' && col !== 'posted' && (
                              <button
                                type="button"
                                onClick={() => move(i.id, 'drafting')}
                                className="hover:text-[#0047FF]"
                              >
                                Draft it →
                              </button>
                            )}
                            {col === 'drafting' && (
                              <button
                                type="button"
                                onClick={() => move(i.id, 'posted')}
                                className="hover:text-[#0047FF]"
                              >
                                Mark posted →
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setEditing({ id: i.id, text: i.text })}
                              className="hover:text-[#0047FF]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(i.id)}
                              aria-label="Remove idea"
                              className="ml-auto text-[15px] leading-none hover:text-[#F4212E]"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[13px]" style={{ color: T.muted }}>
        New BrandOS ideas every morning, from what&apos;s working on @{brand.handle} and its
        competitors.
      </p>
    </Tile>
  );
}
