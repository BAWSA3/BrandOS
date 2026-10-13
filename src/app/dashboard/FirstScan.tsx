import Link from 'next/link';

// Shown behind the first-scan overlay (and if that scan fails): the dashboard
// fills in from the scan, so there's nothing else to show yet.

const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";
const BLUE = '#0047FF';

export default function FirstScan({ handle }: { handle: string }) {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center"
      style={{ background: '#F2EFE8', color: '#0E0E0E' }}
    >
      <div className="text-[11px] uppercase tracking-[0.14em]" style={{ fontFamily: MONO }}>
        Dashboard · @{handle}
      </div>
      <h1
        className="max-w-[18ch] text-[40px] leading-[1.02] md:text-[56px]"
        style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 500 }}
      >
        Your dashboard starts with your first scan.
      </h1>
      <Link
        href="/dashboard?rescan=1"
        className="px-5 py-3 text-[12px] uppercase tracking-[0.14em] text-white"
        style={{ fontFamily: MONO, background: BLUE }}
      >
        Run my first scan
      </Link>
      <Link
        href="/home"
        className="text-[11px] uppercase tracking-[0.14em] hover:underline"
        style={{ fontFamily: MONO, color: '#6B6B6B' }}
      >
        ◀ Main menu
      </Link>
    </main>
  );
}
