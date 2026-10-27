import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import ConnectExtension from './ConnectExtension';

/**
 * /extension-auth — BrandOS for Chrome connects here. Signed out: the normal
 * sign-in (so every rule that applies to signing in applies here too), then
 * back. Signed in: mint a scoped extension token (/api/extension/token) and
 * hand it to the extension. The member's session never leaves the site.
 */

export const metadata: Metadata = { title: 'Connect BrandOS for Chrome · BrandOS' };
export const dynamic = 'force-dynamic';

export default async function ExtensionAuthPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/signup?next=%2Fextension-auth');
  return <ConnectExtension extensionId={process.env.NEXT_PUBLIC_EXTENSION_ID ?? ''} />;
}
