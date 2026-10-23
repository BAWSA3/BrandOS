import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { profileCard, publicRead } from '@/lib/mcp/profile-read';
import { HANDLE_RE } from '@/lib/public-brand';
import { colorwayForHandle } from '@/lib/user-preferences';
import { isColorway, type Colorway } from '@/lib/colorways';
import { indexOpenFor } from '@/lib/index-rules';
import { getEntry, memberProfile } from '@/lib/creator-index';
import PublicBrand from './PublicBrand';

// The public brand page, served at mybrandos.app/@handle (middleware rewrite).
// The MCP's links land here: the same read as the BrandOS card in Claude /
// ChatGPT, from the public scan only, then "Compare your brand to @handle"
// (scan yours -> side by side -> create your account).
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ skin?: string }>;
};

const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const handle = (await params).handle.replace(/^(@|%40)/, '');
  if (!HANDLE_RE.test(handle)) return { title: 'BrandOS', robots: { index: false } };
  const title = `@${handle}'s brand · BrandOS`;
  const description = `@${handle}'s BrandOS brand read: score, archetype, phases and next moves. Compare your brand to theirs.`;
  const image = `${APP}/api/og?u=${handle.toLowerCase()}`;
  return {
    title,
    description,
    openGraph: { title, description, images: [image], url: `${APP}/@${handle}` },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function PublicBrandPage({ params, searchParams }: Props) {
  const handle = (await params).handle.replace(/^(@|%40)/, '');
  const valid = HANDLE_RE.test(handle);
  const [read, user, skin] = await Promise.all([
    valid ? publicRead(handle) : null,
    getCurrentUser().catch(() => null),
    valid ? colorwayForHandle(handle) : ('bone' as const),
  ]);
  const mine =
    user?.platformConnections.find((pc) => pc.platform === 'x')?.platformUsername ??
    user?.xUsername ??
    null;
  // The Creator Index (closed until INDEX_ENABLED; admins preview): the
  // member strip for listed members, "Join the Index" for the page's owner.
  const indexOpen = valid && indexOpenFor(user);
  const owner = !!mine && mine.replace(/^@/, '').toLowerCase() === handle.toLowerCase();
  const [member, ownEntry] = indexOpen
    ? await Promise.all([memberProfile(handle), owner && user ? getEntry(user.id) : null])
    : [null, null];
  return (
    <PublicBrand
      handle={handle}
      valid={valid}
      initial={read ? profileCard(read) : null}
      viewer={user ? { handle: mine } : null}
      index={indexOpen ? { member, ownerCanJoin: owner && !ownEntry?.listed } : null}
      // local dev only: ?skin= previews another skin
      skin={
        process.env.NODE_ENV !== 'production' && isColorway((await searchParams).skin)
          ? ((await searchParams).skin as Colorway)
          : skin
      }
    />
  );
}
