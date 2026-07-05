import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import { getOrGenerateTodayBrief, getCurrentStreak, todayUtcDate } from '@/lib/daily-brief';
import TodayClient from './TodayClient';

export const dynamic = 'force-dynamic';

const PHASE_LABELS: Record<string, string> = {
  define: 'DEFINE',
  check: 'CHECK',
  generate: 'GENERATE',
  scale: 'SCALE',
};

export default async function TodayPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/signup?next=/today');
  }

  if (user.accountMigrationStatus === 'legacy') {
    redirect('/migrate-account');
  }

  const workspace = await getCurrentWorkspace(user);
  if (!workspace) {
    redirect('/dashboard');
  }

  const result = await getOrGenerateTodayBrief(user.id, workspace.id);
  const streak = await getCurrentStreak(user.id);

  if ('error' in result) {
    if (result.error.kind === 'no_scan') {
      return (
        <main className="min-h-screen bg-white text-black p-6 font-mono">
          <div className="max-w-xl mx-auto pt-16 space-y-6">
            <p className="text-xs text-gray-500">// brandos / today</p>
            <h1 className="text-2xl font-bold">No scan on file yet.</h1>
            <p className="text-sm text-gray-700">
              Your daily brief is generated from your most recent BrandOS scan. Run one first
              and your brief will be ready in seconds.
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 border border-black text-sm hover:bg-black hover:text-white transition"
            >
              Run a scan
            </Link>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-white text-black p-6 font-mono">
        <div className="max-w-xl mx-auto pt-16 space-y-4">
          <p className="text-xs text-gray-500">// brandos / today</p>
          <h1 className="text-2xl font-bold">Couldn&apos;t build today&apos;s brief.</h1>
          <p className="text-sm text-gray-700">
            Try refreshing in a moment. If this keeps happening, ping support.
          </p>
          {result.error.kind === 'generation_failed' && (
            <p className="text-xs text-gray-400">{result.error.reason}</p>
          )}
        </div>
      </main>
    );
  }

  const brief = result.brief;
  const dateLabel = todayUtcDate().toISOString().slice(0, 10);
  const completed = brief.completedAt !== null;

  return (
    <main className="min-h-screen bg-white text-black p-6 font-mono">
      <div className="max-w-2xl mx-auto pt-12 space-y-8">
        <header className="flex items-end justify-between border-b border-black/10 pb-4">
          <div>
            <p className="text-xs text-gray-500">// brandos / today / {dateLabel}</p>
            <h1 className="text-3xl font-bold mt-1">Today&apos;s brief</h1>
            <p className="text-xs text-gray-500 mt-1">
              archetype: {brief.archetype} · score: {brief.scoreAtGeneration}/100
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">streak</p>
            <p className="text-2xl font-bold tabular-nums">{streak}</p>
          </div>
        </header>

        {streak === 3 && (
          <p className="text-xs px-3 py-2 bg-black text-white inline-block">3 days. you&apos;re in.</p>
        )}
        {streak === 7 && (
          <p className="text-xs px-3 py-2 bg-black text-white inline-block">7 days straight. real shift.</p>
        )}
        {streak === 30 && (
          <p className="text-xs px-3 py-2 bg-black text-white inline-block">30 days. you&apos;re built different now.</p>
        )}

        <section className="border border-black/10 p-5 space-y-2">
          <p className="text-xs uppercase tracking-wider text-gray-500">1 / idea</p>
          <p className="text-base leading-relaxed">{brief.idea}</p>
        </section>

        <section className="border border-black/10 p-5 space-y-2">
          <p className="text-xs uppercase tracking-wider text-gray-500">2 / metric</p>
          <p className="text-base">
            <span className="font-bold">{PHASE_LABELS[brief.weakestPhase] ?? brief.weakestPhase}</span>{' '}
            = {brief.weakestPhaseScore}/100
          </p>
          <p className="text-sm text-gray-700">
            This is your lowest brand phase. Today&apos;s action targets it.
          </p>
        </section>

        <section className="border border-black p-5 space-y-3 bg-black text-white">
          <p className="text-xs uppercase tracking-wider text-gray-400">3 / action</p>
          <p className="text-base leading-relaxed">{brief.action}</p>
          <TodayClient briefId={brief.id} initiallyCompleted={completed} />
        </section>

        <footer className="text-xs text-gray-500 pt-4">
          New brief tomorrow at 00:00 UTC.
        </footer>
      </div>
    </main>
  );
}
