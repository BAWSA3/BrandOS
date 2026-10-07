'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PixelSticker from './PixelSticker';
import { STICKER_IDS, type StickerId } from '@/lib/pixel-stickers';

/**
 * The polaroid wall on /station/[handle] (Phase 1 of
 * docs/specs/STATION-BOARD-AND-BRAND-REVIEWS.md). Friends signed in with X pin
 * one note each: their X avatar as the photo, a short note, an optional pixel
 * sticker. Loaded client-side so the station page itself stays cached.
 */

const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";
const PIXEL = "'PP NeueBit', 'VCR OSD Mono', monospace";
const MAX = 140;

type Note = {
  id: string;
  handle: string;
  avatar: string | null;
  body: string;
  sticker: StickerId | null;
  createdAt: string;
  hidden?: boolean;
  mine?: boolean;
};
type Board = {
  claimed: boolean;
  notes: Note[];
  total: number;
  myNote: Note | null;
  viewer: {
    signedIn: boolean;
    isOwner: boolean;
    canPost: boolean;
    reason?: 'sign-in' | 'connect-x' | 'own-station' | 'unclaimed';
  };
};

// Stable small tilt per note, like polaroids pinned by hand.
function tilt(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 7) - 3) * 0.9;
}

function Polaroid({
  note,
  preview,
  actions,
}: {
  note: Pick<Note, 'id' | 'handle' | 'avatar' | 'body' | 'sticker' | 'hidden'>;
  preview?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <figure
      className="relative bg-white p-2 pb-3 shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
      style={{
        transform: preview ? undefined : `rotate(${tilt(note.id)}deg)`,
        opacity: note.hidden ? 0.45 : 1,
      }}
    >
      {/* pushpin */}
      <span
        aria-hidden
        className="absolute left-1/2 -top-1.5 -ml-1.5 h-3 w-3 rounded-[2px] bg-[#0A84FF] shadow-[0_1px_0_rgba(0,0,0,0.3)]"
      />
      <div className="aspect-square w-full overflow-hidden bg-[#E8E8ED]">
        {note.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- X avatar URL (pbs.twimg.com), already sized
          <img
            src={note.avatar.replace('_normal', '_200x200')}
            alt={`@${note.handle}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-[28px] text-[#6E6E73]"
            style={{ fontFamily: PIXEL }}
          >
            @{note.handle.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      {note.sticker && (
        <span className="absolute -right-2 top-[42%] rotate-12">
          <PixelSticker id={note.sticker} size={30} />
        </span>
      )}
      <figcaption className="mt-2 min-h-[2.5em]">
        <p
          className="text-[15px] leading-[1.05] text-[#1D1D1F] break-words"
          style={{ fontFamily: PIXEL }}
        >
          {note.body || (preview ? 'your note...' : '')}
        </p>
        <div
          className="mt-1.5 flex items-center justify-between gap-1 text-[9px] tracking-wider text-[#6E6E73]"
          style={{ fontFamily: MONO }}
        >
          <span className="truncate">@{note.handle}</span>
          {note.hidden && <span className="shrink-0 text-[#FF3B30]">HIDDEN</span>}
        </div>
        {actions}
      </figcaption>
    </figure>
  );
}

export default function StationBoard({ handle }: { handle: string }) {
  const params = useSearchParams();
  const [board, setBoard] = useState<Board | null>(null);
  const [loadError, setLoadError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [composing, setComposing] = useState(false);
  const [body, setBody] = useState('');
  const [sticker, setSticker] = useState<StickerId | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const autoOpened = useRef(false);

  const signInUrl = `/signup?next=${encodeURIComponent(`/station/${handle}?pin=1`)}`;

  const load = useCallback(
    async (all = showAll) => {
      try {
        const res = await fetch(`/api/stations/${handle}/board${all ? '?all=1' : ''}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error();
        setBoard(await res.json());
        setLoadError('');
      } catch {
        setLoadError('The board could not load.');
      }
    },
    [handle, showAll]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const openComposer = useCallback((b: Board) => {
    setBody(b.myNote?.body ?? '');
    setSticker(b.myNote?.sticker ?? null);
    setError('');
    setComposing(true);
  }, []);

  // Back from Sign in with X (?pin=1): open the composer once.
  useEffect(() => {
    if (board?.viewer.canPost && params.get('pin') === '1' && !autoOpened.current) {
      autoOpened.current = true;
      queueMicrotask(() => openComposer(board));
    }
  }, [board, params, openComposer]);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/stations/${handle}/board`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, sticker }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not pin your note.');
      setComposing(false);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm('Remove your note from this wall?')) return;
    setBusy(true);
    try {
      await fetch(`/api/stations/${handle}/board`, { method: 'DELETE' });
      setComposing(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const act = async (noteId: string, action: 'hide' | 'unhide' | 'report') => {
    if (action === 'report' && !confirm('Report this note?')) return;
    await fetch(`/api/stations/${handle}/board/${noteId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    await load();
  };

  if (loadError) {
    return (
      <p className="mt-8 text-[11px] text-[#6E6E73]" style={{ fontFamily: MONO }}>
        {loadError}
      </p>
    );
  }
  if (!board) return null;

  const { viewer } = board;
  const header = (
    <div className="flex items-end justify-between gap-3">
      <div style={{ fontFamily: MONO }}>
        <div className="text-[11px] tracking-[0.15em] uppercase text-[#1D1D1F]">
          {'// the wall'}
        </div>
        <div className="mt-1 text-[10px] tracking-wider text-[#6E6E73]">
          {board.claimed
            ? `${board.total} note${board.total === 1 ? '' : 's'} from friends`
            : 'notes from friends'}
        </div>
      </div>
      {board.claimed && !composing && viewer.reason !== 'own-station' && (
        <button
          onClick={() =>
            viewer.canPost ? openComposer(board) : (window.location.href = signInUrl)
          }
          className="shrink-0 px-3 py-2 rounded-[4px] bg-[#0A84FF] hover:bg-[#0070E0] text-white text-[11px] tracking-wider uppercase transition-colors"
          style={{ fontFamily: MONO }}
        >
          {viewer.canPost
            ? board.myNote
              ? 'Edit your note'
              : 'Pin a note'
            : 'Sign in with X to pin'}
        </button>
      )}
    </div>
  );

  return (
    <section className="mt-10 w-full max-w-[640px]">
      {header}

      {!board.claimed ? (
        <div
          className="mt-4 rounded-[8px] border border-dashed border-black/15 px-4 py-8 text-center text-[11px] tracking-wider text-[#6E6E73]"
          style={{ fontFamily: MONO }}
        >
          The wall opens when @{handle} claims this station.
        </div>
      ) : (
        <>
          {composing && (
            <div className="mt-4 rounded-[8px] border border-black/10 bg-white/70 p-4">
              <div className="flex gap-4">
                <div className="w-[140px] shrink-0">
                  <Polaroid
                    preview
                    note={{
                      id: 'preview',
                      handle: board.myNote?.handle ?? 'you',
                      avatar: board.myNote?.avatar ?? null,
                      body,
                      sticker,
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1" style={{ fontFamily: MONO }}>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value.slice(0, MAX))}
                    rows={3}
                    autoFocus
                    placeholder={`Leave @${handle} a note`}
                    aria-label="Your note"
                    className="w-full resize-none rounded-[6px] border border-black/15 bg-white px-3 py-2 text-[16px] text-[#1D1D1F] outline-none focus:border-[#0A84FF]"
                    style={{ fontFamily: PIXEL }}
                  />
                  <div className="mt-1 text-right text-[10px] text-[#6E6E73]">
                    {body.length}/{MAX}
                  </div>
                  <div className="mt-2 text-[10px] tracking-wider uppercase text-[#6E6E73]">
                    sticker
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <button
                      onClick={() => setSticker(null)}
                      aria-pressed={sticker === null}
                      className="h-9 w-9 rounded-[4px] border text-[10px] text-[#6E6E73]"
                      style={{ borderColor: sticker === null ? '#0A84FF' : 'rgba(0,0,0,0.12)' }}
                    >
                      none
                    </button>
                    {STICKER_IDS.map((id) => (
                      <button
                        key={id}
                        onClick={() => setSticker(id)}
                        aria-label={id}
                        aria-pressed={sticker === id}
                        className="flex h-9 w-9 items-center justify-center rounded-[4px] border bg-white"
                        style={{ borderColor: sticker === id ? '#0A84FF' : 'rgba(0,0,0,0.12)' }}
                      >
                        <PixelSticker id={id} size={22} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {error && (
                <div className="mt-3 text-[11px] text-[#FF3B30]" style={{ fontFamily: MONO }}>
                  {error}
                </div>
              )}
              <div className="mt-3 flex items-center gap-2" style={{ fontFamily: MONO }}>
                <button
                  onClick={submit}
                  disabled={busy || !body.trim()}
                  className="px-4 py-2 rounded-[4px] bg-[#1A1A1A] hover:bg-black text-white text-[11px] tracking-wider uppercase disabled:opacity-40"
                >
                  {busy ? '...' : board.myNote ? 'Save note' : 'Pin it'}
                </button>
                <button
                  onClick={() => setComposing(false)}
                  className="px-3 py-2 text-[11px] tracking-wider uppercase text-[#6E6E73]"
                >
                  Cancel
                </button>
                {board.myNote && (
                  <button
                    onClick={remove}
                    disabled={busy}
                    className="ml-auto px-3 py-2 text-[11px] tracking-wider uppercase text-[#FF3B30]"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          )}

          {board.notes.length === 0 ? (
            <div
              className="mt-4 rounded-[8px] border border-dashed border-black/15 px-4 py-8 text-center text-[11px] tracking-wider text-[#6E6E73]"
              style={{ fontFamily: MONO }}
            >
              {viewer.isOwner
                ? 'No notes yet. Share your station link with friends.'
                : `No notes yet. Be the first to pin one for @${handle}.`}
            </div>
          ) : (
            <div
              className="mt-6 grid grid-cols-2 gap-x-5 gap-y-7 rounded-[8px] p-5 sm:grid-cols-3"
              style={{
                background: '#ECEAE6',
                backgroundImage:
                  'linear-gradient(rgba(10,132,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(10,132,255,0.06) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            >
              {board.notes.map((n) => (
                <Polaroid
                  key={n.id}
                  note={n}
                  actions={
                    viewer.isOwner ? (
                      <button
                        onClick={() => act(n.id, n.hidden ? 'unhide' : 'hide')}
                        className="mt-1.5 text-[9px] tracking-wider uppercase text-[#6E6E73] hover:text-[#1D1D1F]"
                        style={{ fontFamily: MONO }}
                      >
                        {n.hidden ? 'unhide' : 'hide'}
                      </button>
                    ) : viewer.signedIn && !n.mine ? (
                      <button
                        onClick={() => act(n.id, 'report')}
                        className="mt-1.5 text-[9px] tracking-wider uppercase text-[#A1A1AA] hover:text-[#FF3B30]"
                        style={{ fontFamily: MONO }}
                      >
                        report
                      </button>
                    ) : null
                  }
                />
              ))}
            </div>
          )}

          {board.total > board.notes.length && (
            <button
              onClick={() => {
                setShowAll(true);
                void load(true);
              }}
              className="mt-4 w-full text-center text-[11px] tracking-wider uppercase text-[#0A84FF]"
              style={{ fontFamily: MONO }}
            >
              See all {board.total} notes
            </button>
          )}
        </>
      )}
    </section>
  );
}
