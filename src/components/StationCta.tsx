'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

/**
 * The bottom CTA on a public /station page. The page is cached for everyone,
 * so who's looking is checked here: the owner (signed in with the station's
 * X handle) gets their dashboard; visitors get "reserve / get your own".
 */
const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";

export default function StationCta({
  handle,
  claimed,
}: {
  handle: string | null;
  claimed: boolean;
}) {
  const [owner, setOwner] = useState(false);

  useEffect(() => {
    if (!handle) return;
    let live = true;
    void (async () => {
      try {
        const { data } = await getSupabaseBrowser().auth.getSession();
        const meta = data.session?.user?.user_metadata;
        const mine = String(meta?.user_name || meta?.preferred_username || '').toLowerCase();
        if (live && mine && mine === handle.toLowerCase()) setOwner(true);
      } catch {
        // signed out / no client: visitor CTA
      }
    })();
    return () => {
      live = false;
    };
  }, [handle]);

  const [href, label] = owner
    ? ['/home', 'Open my dashboard →']
    : handle
      ? ['/', claimed ? 'Get your own brand station →' : 'Reserve your own brand station →']
      : ['/', 'Reserve your brand station →'];

  return (
    <Link
      href={href}
      className="mt-6 w-full max-w-[480px] text-center px-4 py-3.5 rounded-[6px] bg-[#0A84FF] hover:bg-[#0070E0] text-white text-[12px] tracking-[0.15em] uppercase transition-colors"
      style={{ fontFamily: MONO }}
    >
      {label}
    </Link>
  );
}
