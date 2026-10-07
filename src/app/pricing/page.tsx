import type { Metadata } from 'next';
import Link from 'next/link';

// Holding page until BrandOS Studio opens (no fixed date; first 30 days free). The old Free/Pro/Agency/
// Enterprise grid ($29/$99/$500) no longer matches the launch tiers and is in
// git history if anything needs it. Dashboard "upgrade" links and the usage
// gate still point here, so this stays a real page rather than a redirect.
// No prices on purpose until the studio opens.

export const metadata: Metadata = {
  title: 'BrandOS Studio is opening soon · BrandOS',
  description: 'BrandOS Studio is opening soon. Reserve your brand station to be first in.',
};

const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#F2F0EF] px-4 py-16 flex flex-col items-center justify-center">
      <div className="w-full max-w-[480px] text-center" style={{ fontFamily: MONO }}>
        <span className="inline-block px-2 py-1 rounded-[2px] bg-[#0A84FF] text-white text-[11px] tracking-[0.15em] uppercase">
          Opening soon
        </span>
        <h1 className="mt-5 text-[22px] leading-snug tracking-wider text-[#1D1D1F] uppercase">
          Studio plans aren&apos;t open yet
        </h1>
        <p className="mt-3 text-[12px] leading-relaxed tracking-wide text-[#6E6E73]">
          Scan your handle, see your brand station, and reserve your plot. Reservers get first
          access when the studio opens.
        </p>
        <Link
          href="/"
          className="mt-8 block w-full px-4 py-3.5 rounded-[6px] bg-[#0A84FF] hover:bg-[#0070E0] text-white text-[12px] tracking-[0.15em] uppercase transition-colors"
        >
          Reserve your brand station →
        </Link>
      </div>
    </main>
  );
}
