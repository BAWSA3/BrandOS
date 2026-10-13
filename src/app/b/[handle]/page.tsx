import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { profileCard, publicRead } from '@/lib/mcp/profile-read';
import { HANDLE_RE } from '@/lib/public-brand';
import PublicBrand from './PublicBrand';

// The public brand page, served at mybrandos.app/@handle (middleware rewrite).
// The MCP's links land here: the same read as the BrandOS card in Claude /
// ChatGPT, from the public scan only, then "Compare your brand to @handle"
// (scan yours -> side by side -> create your account).
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ handle: string }> };

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

export default async function PublicBrandPage({ params }: Props) {
  const handle = (await params).handle.replace(/^(@|%40)/, '');
  const valid = HANDLE_RE.test(handle);
  const [read, user] = await Promise.all([
    valid ? publicRead(handle) : null,
    getCurrentUser().catch(() => null),
  ]);
  const mine =
    user?.platformConnections.find((pc) => pc.platform === 'x')?.platformUsername ??
    user?.xUsername ??
    null;
  return (
    <PublicBrand
      handle={handle}
      valid={valid}
      initial={read ? profileCard(read) : null}
      viewer={user ? { handle: mine } : null}
    />
  );
}
