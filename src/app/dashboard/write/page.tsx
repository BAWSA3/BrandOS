import { redirect } from 'next/navigation';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import { roomFormat } from '@/lib/article';
import { hasPro } from '@/lib/billing';
import { getColorway } from '@/lib/user-preferences';
import CopywriterChat from '@/components/dashboard/CopywriterChat';
import { dashboardV2For } from '@/lib/dashboard-v2';
import { loadBrands, loadOpenIdeas, loadStanding, loadTopPosts } from '@/lib/dashboard-v2-data';
import Shell from '@/components/dashboard-v2/Shell';
import WritingRoom from '@/components/dashboard-v2/WritingRoom';
import type { Variant } from '@/components/live-composer/types';

// The live composer (docs/LIVE-COMPOSER-SPEC.md) is off until LIVE_COMPOSER=1;
// LIVE_COMPOSER_VARIANT picks the reveal (a|b|c) until Bawsa chooses one.
function liveVariant(v: string | undefined): Variant {
  return v === 'b' || v === 'c' ? v : 'a';
}

// /dashboard/write — the copywriter chat (X posts, threads, emails, ads) in
// the creator's own voice. Pro (open access counts); free accounts land on
// the dashboard, which shows the paywall.
export const dynamic = 'force-dynamic';

export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string | string[]; mode?: string | string[] }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/signup?next=/dashboard/write');
  if (!hasPro(user)) redirect('/dashboard');
  const handle = (
    user.platformConnections.find((pc) => pc.platform === 'x')?.platformUsername ??
    user.xUsername ??
    ''
  ).replace(/^@/, '');
  const colorway = await getColorway(user.id);
  // ?prompt= pre-fills the box (dashboard v2: "Start writing" on today's move). Text only,
  // capped, never auto-sent; the copywriter route applies its own input guards on send.
  const sp = await searchParams;
  const raw = sp.prompt;
  const prompt = (typeof raw === 'string' ? raw : '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .slice(0, 400);
  // Dashboard v2 (testers): the writing room, with the copywriter and draft
  // scoring beside one draft. Same routes, same limits; nothing new is written.
  if (await dashboardV2For(user)) {
    const workspace = await getCurrentWorkspace(user).catch(() => null);
    const [brands, standing] = await Promise.all([
      workspace ? loadBrands(workspace.id) : Promise.resolve([]),
      loadStanding(user.id),
    ]);
    const own = brands.find((b) => b.handle.toLowerCase() === handle.toLowerCase()) ?? null;
    // Article mode's idea picker: open ideas on the member's own board and their
    // most-liked recent posts (own brand only; text only, capped).
    const [boardIdeas, topPosts] = own
      ? await Promise.all([loadOpenIdeas(own.id), loadTopPosts(own.id)])
      : [[], []];
    return (
      <Shell
        finish={colorway}
        place="playbook"
        brandId={null}
        brands={brands}
        standing={standing}
        focus
      >
        <WritingRoom
          idea={prompt.trim() || null}
          accountId={own?.id ?? null}
          handle={handle || null}
          initialFormat={roomFormat(sp.mode)}
          boardIdeas={boardIdeas}
          topPosts={topPosts}
          brands={brands}
          live={process.env.LIVE_COMPOSER === '1'}
          liveVariant={liveVariant(process.env.LIVE_COMPOSER_VARIANT)}
        />
      </Shell>
    );
  }
  return <CopywriterChat handle={handle || null} colorway={colorway} initialPrompt={prompt} />;
}
