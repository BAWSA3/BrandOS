import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import ConnectClient from './ConnectClient';

// Connect your AI tools to BrandOS (the BrandOS MCP): create a key, copy setup.
export const dynamic = 'force-dynamic';

export default async function ConnectPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/signup?next=/connect');
  return <ConnectClient />;
}
