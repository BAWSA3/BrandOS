import RevealScoreCard from '@/components/RevealScoreCard';

// Sign-in-free preview of the free scan's shareable card (design review).
export default function RevealCardPreview() {
  return (
    <main className="min-h-screen bg-[#F2EFE8] px-4 py-12">
      <div
        className="mb-6 text-center text-[11px] uppercase tracking-[0.16em] text-black/50"
        style={{ fontFamily: "'VCR OSD Mono', monospace" }}
      >
        {'// your brand score'}
      </div>
      <RevealScoreCard
        handle="jbawsa"
        avatarUrl={null}
        score={72}
        archetype="BUILD.EXE"
        phases={{ define: 78, check: 75, generate: 68, scale: 68 }}
      />
    </main>
  );
}
