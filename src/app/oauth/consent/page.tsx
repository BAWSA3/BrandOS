import { Suspense } from 'react';
import ConsentClient from './ConsentClient';

// "Sign in with BrandOS": the consent screen for the MCP connector. Supabase
// Auth (OAuth 2.1 server) sends Claude / ChatGPT / Cursor users here with an
// authorization_id; they sign in (or create their account) and approve.
export const metadata = { title: 'Connect BrandOS', robots: { index: false } };

export default function ConsentPage() {
  return (
    <Suspense>
      <ConsentClient />
    </Suspense>
  );
}
