import { redirect } from 'next/navigation';

// /index/claim (rewritten here): the link in the "your number is reserved"
// email. Claiming IS joining as your own X handle, so this forwards to the
// join flow (which signs you in first and shows your reserved number), keeping
// the UTM parameters for the funnel.
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ClaimIndexNumberPage({ searchParams }: Props) {
  const sp = await searchParams;
  const keep = new URLSearchParams();
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
    const v = sp[k];
    if (typeof v === 'string' && /^[\w.-]{1,64}$/.test(v)) keep.set(k, v);
  }
  // keep the Direction 03 preview switch (src/lib/field/switch.ts) through the redirect
  if (sp.field === '1' || sp.field === '0') keep.set('field', sp.field);
  const q = keep.toString();
  redirect(`/index/join${q ? `?${q}` : ''}`);
}
