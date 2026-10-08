'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Inter_Tight } from 'next/font/google';

const display = Inter_Tight({ subsets: ['latin'], weight: ['500', '700', '800'] });
const C = {
  canvas: '#E7E7E4',
  ink: '#0E0E0E',
  muted: '#6B6B6B',
  rule: 'rgba(14,14,14,0.16)',
  blue: '#0047FF',
};
const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";
const CODE = "'JetBrains Mono', ui-monospace, monospace";

interface KeyRow {
  id: string;
  prefix: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

function Micro({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] uppercase tracking-[0.14em]"
      style={{ fontFamily: MONO, color: C.muted }}
    >
      {children}
    </div>
  );
}

function Snippet({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between">
        <Micro>{label}</Micro>
        <button
          type="button"
          className="text-[12px] font-medium underline-offset-4 hover:underline"
          onClick={async () => {
            await navigator.clipboard.writeText(code).catch(() => undefined);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre
        suppressHydrationWarning
        className="mt-2 overflow-x-auto whitespace-pre-wrap break-all p-4 text-[12.5px] leading-[1.5]"
        style={{ fontFamily: CODE, background: '#0E0E0E', color: '#E7E7E4' }}
      >
        {code}
      </pre>
    </div>
  );
}

export default function ConnectClient() {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [fresh, setFresh] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Snippets point at this deployment (staging or prod); server render uses the prod URL.
  const [origin] = useState(() =>
    typeof window === 'undefined' ? 'https://mybrandos.app' : window.location.origin
  );

  const load = useCallback(async () => {
    const res = await fetch('/api/account/api-keys');
    if (res.ok) setKeys(((await res.json()) as { keys: KeyRow[] }).keys);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch('/api/account/api-keys', { method: 'POST', body: '{}' });
    const data = (await res.json()) as { key?: { raw: string }; error?: string };
    setBusy(false);
    if (!res.ok || !data.key) return setError(data.error ?? 'Could not create a key.');
    setFresh(data.key.raw);
    void load();
  };

  const revoke = async (id: string) => {
    if (!confirm('Revoke this key? Tools using it will stop working.')) return;
    await fetch(`/api/account/api-keys?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    void load();
  };

  const url = `${origin}/api/mcp`;
  const key = fresh ?? 'bos_YOUR_KEY';

  return (
    <main
      className={`${display.className} min-h-screen`}
      style={{ background: C.canvas, color: C.ink }}
    >
      <div className="mx-auto max-w-[880px] px-5 pb-16 pt-6 md:px-10">
        <header
          className="flex items-center justify-between border-b pb-4"
          style={{ borderColor: C.rule }}
        >
          <Micro>BrandOS / Connect</Micro>
          <Link
            href="/studio"
            className="text-[13px] font-medium underline-offset-4 hover:underline"
          >
            Studio
          </Link>
        </header>

        <h1
          className="mt-10 font-extrabold leading-[0.95]"
          style={{ fontSize: 'clamp(40px, 6vw, 76px)', letterSpacing: '-0.045em' }}
        >
          Your brand, inside every AI you use.
        </h1>
        <p className="mt-5 max-w-[560px] text-[17px] leading-[1.45]" style={{ color: C.muted }}>
          Connect Claude, Cursor or any MCP client to BrandOS. Your AI can read your brand rules and
          check drafts against them. It suggests; you decide.
        </p>

        <section className="mt-10 border-t pt-6" style={{ borderColor: C.rule }}>
          <Micro>01 · Your key</Micro>
          {fresh ? (
            <div className="mt-3 p-4" style={{ background: '#fff', border: `1px solid ${C.blue}` }}>
              <div className="text-[13px] font-bold" style={{ color: C.blue }}>
                Copy it now. You won&apos;t see it again.
              </div>
              <div className="mt-2 break-all text-[14px]" style={{ fontFamily: CODE }}>
                {fresh}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={create}
              disabled={busy}
              className="mt-3 px-6 py-4 text-[15px] font-bold text-white disabled:opacity-50"
              style={{ background: C.blue }}
            >
              {busy ? 'Creating…' : 'Create a key'}
            </button>
          )}
          {error && <div className="mt-3 text-[13px] text-[#C62828]">{error}</div>}

          {keys.length > 0 && (
            <ul className="mt-6 border-t" style={{ borderColor: C.rule }}>
              {keys.map((k) => (
                <li
                  key={k.id}
                  className="flex items-center justify-between border-b py-3 text-[14px]"
                  style={{ borderColor: C.rule }}
                >
                  <span style={{ fontFamily: CODE }}>{k.prefix}…</span>
                  <span style={{ color: C.muted }}>
                    {k.lastUsedAt
                      ? `used ${new Date(k.lastUsedAt).toLocaleDateString()}`
                      : 'not used yet'}
                  </span>
                  <button
                    type="button"
                    onClick={() => revoke(k.id)}
                    className="text-[13px] underline-offset-4 hover:underline"
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10 border-t pt-6" style={{ borderColor: C.rule }}>
          <Micro>02 · Add it to your AI</Micro>
          <Snippet
            label="Claude Code"
            code={`claude mcp add --transport http brandos ${url} --header "Authorization: Bearer ${key}"`}
          />
          <Snippet
            label="Cursor (~/.cursor/mcp.json)"
            code={JSON.stringify(
              { mcpServers: { brandos: { url, headers: { Authorization: `Bearer ${key}` } } } },
              null,
              2
            )}
          />
          <Snippet
            label="Any MCP client"
            code={JSON.stringify(
              { brandos: { url, headers: { Authorization: `Bearer ${key}` } } },
              null,
              2
            )}
          />
        </section>

        <section className="mt-10 border-t pt-6" style={{ borderColor: C.rule }}>
          <Micro>03 · Try it</Micro>
          <ul className="mt-3 space-y-2 text-[15px]">
            <li>&ldquo;Scan @jbawsa on BrandOS.&rdquo; (works without a key)</li>
            <li>&ldquo;What are my brand rules?&rdquo;</li>
            <li>&ldquo;Check this draft against my brand: …&rdquo;</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
