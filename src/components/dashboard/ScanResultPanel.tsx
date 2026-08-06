'use client';

/**
 * Post-scan result panel for /dashboard.
 *
 * Renders the full payload /api/x-brand-score-enhanced returns — score card,
 * archetype, phase breakdown, strengths/improvements, next moves — instead of
 * the bare "Score: 72" line the dashboard used to show.
 *
 * Handles both response shapes: a fresh scan (profile present, phases are
 * { score, insights }) and the 24h-cache hit (profile null, phases is a plain
 * { define: number } map).
 */

import BrandScoreCard from '@/components/BrandScoreCard';

type PhaseKey = 'define' | 'check' | 'generate' | 'scale';

interface PhaseDetail {
  score: number;
  insights?: string[];
}

export interface ScanResponse {
  profile: {
    username: string;
    name?: string;
    profile_image_url?: string;
  } | null;
  brandScore: {
    overallScore: number;
    archetype?: { primary?: string | null } | null;
    phases?: Partial<Record<PhaseKey, number | PhaseDetail>> | null;
    topStrengths?: string[];
    topImprovements?: string[];
    summary?: string;
    influenceTier?: string;
    nextMoves?: string[];
    contentPillars?: string[];
  };
  voiceConsistency?: { overallScore?: number } | null;
  meta?: { cached?: boolean; scoreContext?: never } & Record<string, unknown>;
}

function phaseScore(
  phases: ScanResponse['brandScore']['phases'],
  key: PhaseKey,
): number {
  const p = phases?.[key];
  if (typeof p === 'number') return p;
  return p?.score ?? 0;
}

function InsightList({ title, items, accent }: { title: string; items: string[]; accent?: boolean }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3
        className="text-xs font-semibold uppercase tracking-wide mb-2 font-mono"
        style={{ color: accent ? 'var(--accent)' : 'var(--text-tertiary)' }}
      >
        {title}
      </h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="text-sm flex gap-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span style={{ color: accent ? 'var(--accent)' : 'var(--text-tertiary)' }}>
              {accent ? '→' : '·'}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ScanResultPanel({
  result,
  fallbackUsername,
}: {
  result: ScanResponse;
  fallbackUsername: string;
}) {
  const { brandScore, profile, voiceConsistency, meta } = result;
  const phases = brandScore.phases;
  const phaseScores = {
    define: phaseScore(phases, 'define'),
    check: phaseScore(phases, 'check'),
    generate: phaseScore(phases, 'generate'),
    scale: phaseScore(phases, 'scale'),
  };
  const archetype = brandScore.archetype?.primary;

  return (
    <div className="mt-4 space-y-4">
      <BrandScoreCard
        score={brandScore.overallScore}
        voiceConsistency={voiceConsistency?.overallScore ?? phaseScores.check}
        engagementScore={phaseScores.scale}
        profileImageUrl={profile?.profile_image_url?.replace('_normal', '_200x200') ?? ''}
        username={profile?.username ?? fallbackUsername}
        displayName={profile?.name ?? fallbackUsername}
        summary={brandScore.summary}
        phaseScores={phaseScores}
      />

      {(archetype || brandScore.influenceTier) && (
        <div className="flex flex-wrap gap-2">
          {archetype && (
            <span
              className="text-xs font-mono px-3 py-1.5 rounded-full border"
              style={{
                borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)',
                color: 'var(--accent)',
              }}
            >
              ARCHETYPE: {archetype.toUpperCase()}
            </span>
          )}
          {brandScore.influenceTier && (
            <span
              className="text-xs font-mono px-3 py-1.5 rounded-full border"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              TIER: {brandScore.influenceTier.toUpperCase()}
            </span>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <InsightList title="Top strengths" items={brandScore.topStrengths ?? []} />
        <InsightList title="Improvements" items={brandScore.topImprovements ?? []} />
      </div>

      <InsightList title="Next moves" items={brandScore.nextMoves ?? []} accent />

      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        {meta?.cached
          ? 'Returned from 24h cache — scan again tomorrow for a fresh read.'
          : 'Fresh analysis.'}
      </p>
    </div>
  );
}
