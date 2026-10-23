'use client';

import { useEffect, useRef, useState } from 'react';
import { Label, MONO, BIG, T, Tile } from './parts';

/**
 * Idea board: a blank page to think on (not a search box), BrandOS ideas with
 * their reason, and your own notes moving Ideas → Drafting → Posted.
 * Local state for now; persisted + AI ideas from the brand's analytics land
 * with the idea board build (Oct 29).
 */

export type Idea = { id: number; text: string; why?: string; col: 'ideas' | 'drafting' | 'posted' };

// prompts for a blank page: things only this person can say
const SPARKS = [
  'Something I changed my mind about',
  'A question my audience keeps asking',
  'A win (or a miss) from this week',
  'What everyone in my niche gets wrong',
];

export default function IdeaBoard({ handle, initial }: { handle: string; initial: Idea[] }) {
  const [ideas, setIdeas] = useState<Idea[]>(initial);
  const [draft, setDraft] = useState('');
  const pageRef = useRef<HTMLTextAreaElement>(null);
  // the page grows with the idea instead of scrolling inside a box
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(120, el.scrollHeight)}px`;
  }, [draft]);
  const pin = () => {
    if (!draft.trim()) return;
    setIdeas((all) => [{ id: Date.now(), text: draft.trim(), col: 'ideas' }, ...all]);
    setDraft('');
  };
  const move = (id: number, col: Idea['col']) =>
    setIdeas((all) => all.map((i) => (i.id === id ? { ...i, col } : i)));
  const brand = { handle };

  return (
    <Tile className="md:col-span-12">
      <Label>Idea board</Label>
      {/* The blank page: a place to think, not a search box */}
      <div
        className="mt-4 grid grid-cols-1 gap-6 border p-5 md:grid-cols-[1fr_260px] md:gap-10 md:p-8"
        style={{
          borderColor: T.rule,
          background: '#FFFFFF',
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            pin();
          }}
        >
          <div className="text-[13px] leading-[1.5]" style={{ color: T.muted }}>
            Half-formed is fine. Get it out of your head.
          </div>
          <textarea
            ref={pageRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                pin();
              }
            }}
            rows={3}
            placeholder={`What should @${brand.handle} say next?`}
            aria-label="Write an idea"
            className="mt-3 w-full resize-none bg-transparent text-[26px] leading-[40px] outline-none placeholder:text-black/25 md:text-[32px]"
            style={{
              fontFamily: BIG,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              // site-wide form styles give textareas a grey box; this is a page
              // notebook rules that sit under each 40px line and scroll with the text
              background:
                'repeating-linear-gradient(transparent 0 39px, rgba(14,14,14,0.07) 39px 40px)',
              backgroundAttachment: 'local',
              border: 'none',
              borderRadius: 0,
              boxShadow: 'none',
              padding: 0,
              overflow: 'hidden',
              width: '100%',
              maxWidth: 'none',
              fontSize: 'clamp(24px, 2.6vw, 32px)',
              lineHeight: '40px',
              color: T.ink,
            }}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span
              className="hidden text-[10px] uppercase tracking-[0.14em] md:inline"
              style={{ fontFamily: MONO, color: T.muted }}
            >
              ⌘ + Enter to pin it
            </span>
            <button
              type="submit"
              disabled={!draft.trim()}
              className="ml-auto px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-white transition-opacity disabled:opacity-30"
              style={{ fontFamily: MONO, background: T.ink }}
            >
              Pin to the board →
            </button>
          </div>
        </form>
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
                  <div key={i.id} className="border bg-white p-3" style={{ borderColor: T.rule }}>
                    {i.why && (
                      <div
                        className="mb-1.5 text-[9px] uppercase tracking-[0.14em]"
                        style={{ fontFamily: MONO, color: T.blue }}
                      >
                        ✦ BrandOS idea
                      </div>
                    )}
                    <div className="text-[14px] leading-[1.4]">{i.text}</div>
                    {i.why && (
                      <div className="mt-1.5 text-[12px] leading-[1.45]" style={{ color: T.muted }}>
                        {i.why}
                      </div>
                    )}
                    <div className="mt-2.5 flex gap-3">
                      {col !== 'drafting' && col !== 'posted' && (
                        <button
                          type="button"
                          onClick={() => move(i.id, 'drafting')}
                          className="text-[10px] uppercase tracking-[0.14em] hover:underline"
                          style={{ fontFamily: MONO }}
                        >
                          Draft it →
                        </button>
                      )}
                      {col === 'drafting' && (
                        <button
                          type="button"
                          onClick={() => move(i.id, 'posted')}
                          className="text-[10px] uppercase tracking-[0.14em] hover:underline"
                          style={{ fontFamily: MONO }}
                        >
                          Mark posted →
                        </button>
                      )}
                    </div>
                  </div>
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
