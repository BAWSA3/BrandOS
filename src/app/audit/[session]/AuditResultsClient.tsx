'use client';

/**
 * Score Boost Audit Results — client component
 *
 * - Fetches audit via /api/audit/run (verifies Stripe payment first)
 * - Renders phase scores, archetype, flagged tweets, actions
 * - Download button generates MD file client-side
 */

import { useEffect, useState } from 'react';
import type { ScoreBoostAuditResult } from '@/prompts/score-boost-audit';
import { generateAuditMarkdown } from '@/lib/generate-audit-md';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; audit: ScoreBoostAuditResult; email: string | null }
  | { kind: 'error'; message: string };

export default function AuditResultsClient({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let canceled = false;
    async function run() {
      try {
        const res = await fetch('/api/audit/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (!canceled) setState({ kind: 'error', message: data.error || 'Failed' });
          return;
        }
        if (!canceled) setState({ kind: 'ready', audit: data.audit, email: data.email });
      } catch (err) {
        if (!canceled) setState({ kind: 'error', message: (err as Error).message });
      }
    }
    run();
    return () => {
      canceled = true;
    };
  }, [sessionId]);

  if (state.kind === 'loading') {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="text-2xl font-bold">Running your audit...</h1>
        <p className="mt-2 text-sm text-neutral-600">
          This takes about 30 seconds. Pulling your last 50 tweets and running deep analysis.
        </p>
        <div className="mt-8 font-mono text-xs text-neutral-500">
          [████░░░░░░░░] fetching tweets<br />
          [░░░░░░░░░░░░] analyzing phases<br />
          [░░░░░░░░░░░░] generating rewrites<br />
          [░░░░░░░░░░░░] finalizing report
        </div>
      </main>
    );
  }

  if (state.kind === 'error') {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-neutral-600">{state.message}</p>
        <p className="mt-6 text-sm">
          Your payment succeeded — reach out to{' '}
          <a className="underline" href="mailto:hey@mybrandos.app">
            hey@mybrandos.app
          </a>{' '}
          with your session ID and we&apos;ll regenerate manually.
        </p>
        <p className="mt-2 font-mono text-xs text-neutral-500">session: {sessionId}</p>
      </main>
    );
  }

  const { audit } = state;

  function handleDownload() {
    const md = generateAuditMarkdown(audit);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().slice(0, 10);
    a.download = `brandos-audit-${audit.handle}-${today}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="border-b border-neutral-200 pb-6">
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-500">
          // score boost audit
        </p>
        <h1 className="mt-2 text-3xl font-bold">@{audit.handle}</h1>
        <div className="mt-4 flex items-baseline gap-4">
          <span className="text-5xl font-bold tabular-nums">{audit.overallScore}</span>
          <span className="text-neutral-500">/ 100</span>
        </div>
      </header>

      <section className="mt-8">
        <h2 className="font-mono text-xs uppercase tracking-wider text-neutral-500">
          // phase breakdown
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(['define', 'check', 'generate', 'scale'] as const).map((phase) => {
            const p = audit.phaseScores[phase];
            const isWeakest = audit.weakestPhase === phase;
            return (
              <div
                key={phase}
                className={`rounded border p-3 ${
                  isWeakest ? 'border-red-300 bg-red-50' : 'border-neutral-200'
                }`}
              >
                <p className="font-mono text-[10px] uppercase text-neutral-500">{phase}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{p.score}</p>
                <p className="mt-1 font-mono text-[10px] text-neutral-500">{p.status}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 space-y-3 text-sm">
          {(['define', 'check', 'generate', 'scale'] as const).map((phase) => (
            <div key={phase}>
              <p className="font-mono text-xs uppercase text-neutral-500">{phase}</p>
              <p className="mt-1">{audit.phaseScores[phase].insight}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded border border-neutral-200 p-5">
        <h2 className="font-mono text-xs uppercase tracking-wider text-neutral-500">
          // your archetype
        </h2>
        <p className="mt-2 text-xl font-bold">
          {audit.archetype.emoji} {audit.archetype.name}
        </p>
        <p className="mt-2 text-sm">{audit.archetype.description}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="font-mono text-[10px] uppercase text-neutral-500">strengths</p>
            <ul className="mt-1 space-y-1 text-sm">
              {audit.archetype.strengths.map((s, i) => (
                <li key={i}>&gt; {s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase text-neutral-500">misalignments</p>
            <ul className="mt-1 space-y-1 text-sm">
              {audit.archetype.misalignments.map((m, i) => (
                <li key={i}>&gt; {m}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-wider text-neutral-500">
          // tweet-by-tweet
        </h2>
        <div className="mt-3 space-y-5">
          {audit.flaggedTweets.map((t, i) => (
            <div key={i} className="rounded border border-neutral-200 p-4">
              <p className="font-mono text-[10px] uppercase text-neutral-500">
                original
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{t.original}</p>
              <p className="mt-3 font-mono text-[10px] uppercase text-red-600">issue</p>
              <p className="mt-1 text-sm">{t.issue}</p>
              <p className="mt-3 font-mono text-[10px] uppercase text-green-700">rewrite</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{t.rewrite}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded border border-neutral-900 bg-neutral-900 p-5 text-white">
        <h2 className="font-mono text-xs uppercase tracking-wider text-neutral-400">
          // top 3 actions this week
        </h2>
        <ol className="mt-3 space-y-2 text-sm">
          {audit.topActions.map((a, i) => (
            <li key={i}>
              {i + 1}. {a}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleDownload}
          className="rounded bg-black px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Download .md file
        </button>
        {state.email && (
          <p className="self-center text-xs text-neutral-500">
            A copy has been emailed to {state.email}.
          </p>
        )}
      </section>
    </main>
  );
}
