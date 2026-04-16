/**
 * BrandOS Narrative Template Engine
 *
 * Turns raw report data into strategist-tone prescriptive text.
 * No Gemini calls — pure template logic using archetype data.
 * The report should feel like a brand strategist's briefing, not a dashboard.
 */

import { type ArchetypeInfo } from './archetype-descriptions';

// =============================================================================
// Archetype Identity Narratives
// =============================================================================

export function getArchetypeIdentityNarrative(info: ArchetypeInfo): string {
  const rarityText = info.rarity <= 8
    ? `Only ${info.rarity}% of creators are ${info.name} — one of the rarest archetypes in BrandOS.`
    : info.rarity <= 15
    ? `${info.rarity}% of creators share your archetype. ${info.name} is uncommon — and that's your edge.`
    : `${info.rarity}% of creators are ${info.name}. It's a common archetype, but the best ones stand out by leaning into it harder than anyone else.`;

  const traitsText = info.traits.join(', ').toLowerCase();

  return `${rarityText} Your type is defined by being ${traitsText}. ${info.description}`;
}

// =============================================================================
// Phase Narratives — prescriptive, archetype-aware
// =============================================================================

const PHASE_CONTEXT: Record<string, { strong: string; weak: string }> = {
  define: {
    strong: 'Your audience knows exactly what you stand for. Your niche is clear and your content pillars are established.',
    weak: 'Your timeline doesn\'t yet have a clear "this is what I\'m about" signal. People follow you, but they might not be able to explain why in one sentence.',
  },
  check: {
    strong: 'Your voice is consistent and recognizable. People can tell it\'s you without seeing the handle.',
    weak: 'Your voice drifts between posts. Some sound analytical, others casual, others like a different person. Consistency builds trust.',
  },
  generate: {
    strong: 'Your output is strong — consistent posting, quality content, effective formats.',
    weak: 'Your content output needs work — either volume, format variety, or originality. The ideas might be there but the execution isn\'t landing yet.',
  },
  scale: {
    strong: 'Your reputation signals are healthy — good follower ratio, authority indicators, and growth trajectory.',
    weak: 'Your growth signals are lagging — this usually means the content is good but not enough people are seeing it yet.',
  },
};

export function getPhaseNarrative(
  phase: string,
  score: number,
  archetypeName: string,
  cohortDelta: number | null
): string {
  const context = PHASE_CONTEXT[phase];
  if (!context) return '';

  const baseText = score >= 75 ? context.strong : context.weak;
  const label = phase.charAt(0).toUpperCase() + phase.slice(1);

  let cohortText = '';
  if (cohortDelta != null) {
    if (cohortDelta > 5) {
      cohortText = ` You're ${cohortDelta} points above the average ${archetypeName} here — this is a genuine strength.`;
    } else if (cohortDelta < -5) {
      cohortText = ` You're ${Math.abs(cohortDelta)} points below the average ${archetypeName}. This is the gap to close.`;
    } else {
      cohortText = ` You're right at the cohort average for ${archetypeName}s.`;
    }
  }

  return `${label} at ${score}. ${baseText}${cohortText}`;
}

// =============================================================================
// Critical Gap Narrative
// =============================================================================

export function getCriticalGapNarrative(
  strongest: string,
  strongestScore: number,
  weakest: string,
  weakestScore: number,
  gap: number,
  archetypeName: string
): string {
  if (gap <= 10) {
    return `Your phases are balanced — no single area is dragging you down. Focus on lifting everything gradually.`;
  }

  if (gap <= 20) {
    return `Your ${strongest} (${strongestScore}) outpaces your ${weakest} (${weakestScore}) by ${gap} points. Closing this gap is the fastest way to push your overall score up.`;
  }

  return `${strongest} at ${strongestScore} vs ${weakest} at ${weakestScore} — that's a ${gap}-point gap. This is the #1 thing holding your score back. ${archetypeName}s who break through almost always close their ${weakest} gap first.`;
}

// =============================================================================
// Evolution Narrative
// =============================================================================

export function getEvolutionNarrative(
  info: ArchetypeInfo,
  currentScore: number,
  daysSinceChange: number | null
): string {
  if (info.evolutionPaths.length === 0) {
    return `${info.name} is a peak archetype — there's no "next level." Your path is to deepen your mastery and solidify your position as ${info.tagline.toLowerCase()}.`;
  }

  const paths = info.evolutionPaths;
  const pathText = paths.length === 1
    ? `Your next evolution is ${paths[0]}.`
    : `Your potential evolutions are ${paths.slice(0, -1).join(', ')} or ${paths[paths.length - 1]}.`;

  let readinessText = '';
  if (currentScore >= 80) {
    readinessText = ' Your score suggests you\'re approaching evolution territory.';
  } else if (currentScore >= 65) {
    readinessText = ' Keep building — evolution typically happens when your score consistently hits 80+.';
  } else {
    readinessText = ' Focus on strengthening your current archetype before thinking about evolution.';
  }

  let timeText = '';
  if (daysSinceChange != null) {
    if (daysSinceChange < 30) {
      timeText = ` Your archetype was assigned ${daysSinceChange} days ago — evolution requires at least 30 days of consistent growth.`;
    } else if (daysSinceChange > 90) {
      timeText = ` You've been ${info.name} for ${daysSinceChange} days — if your score is growing, evolution could be close.`;
    }
  }

  return `${pathText}${readinessText}${timeText}`;
}

// =============================================================================
// Empty State Messages
// =============================================================================

export function getEmptyStateMessage(section: string, totalScans: number): string {
  const messages: Record<string, string> = {
    phases: totalScans <= 1
      ? 'Run a fresh scan to generate your phase analysis. Your first scan captures the baseline.'
      : 'Phase data not available for this scan. Run a new scan to generate it.',
    strengths: 'Strengths are detected during scanning. Run a new scan to identify yours.',
    nextMoves: 'Your next moves are generated during scanning. Run a fresh scan to get personalized action items.',
    contentPillars: 'Content pillars are detected by analyzing your timeline. Run a scan to identify your recurring themes.',
    patterns: 'Pattern intelligence needs more data from your archetype cohort. As more creators scan, this section gets smarter.',
    trajectory: totalScans <= 1
      ? 'One scan = one data point. Scan again in a week to start tracking your trajectory.'
      : 'Score history is available after multiple scans.',
    evolution: 'Evolution tracking activates after your profile is established. Keep scanning to build your history.',
  };

  return messages[section] || 'Data not yet available. Run a scan to populate this section.';
}

// =============================================================================
// Stale Data Message
// =============================================================================

export function getStaleDataMessage(daysSinceLastScan: number): string {
  if (daysSinceLastScan <= 7) return '';

  if (daysSinceLastScan <= 14) {
    return `Your last scan was ${daysSinceLastScan} days ago. Your brand may have evolved — scan again for an updated report.`;
  }

  if (daysSinceLastScan <= 30) {
    return `This report is ${daysSinceLastScan} days old. A lot can change in that time. Scan again to refresh your intelligence.`;
  }

  return `Your last scan was over a month ago. This report is a snapshot of who you were then — scan again to see who you are now.`;
}

// =============================================================================
// Score Context Narrative
// =============================================================================

export function getScoreContextNarrative(
  score: number,
  percentile: number | null,
  cohortAvg: number | null,
  archetypeName: string,
  influenceTier: string
): string {
  let text = '';

  if (percentile != null) {
    const topPercent = 100 - percentile;
    if (topPercent <= 10) {
      text += `Top ${topPercent}% of all ${archetypeName}s — elite territory. `;
    } else if (topPercent <= 25) {
      text += `Top ${topPercent}% of ${archetypeName}s — above most of your cohort. `;
    } else if (topPercent <= 50) {
      text += `Top ${topPercent}% of ${archetypeName}s — room to climb. `;
    } else {
      text += `Bottom half of ${archetypeName}s by score — significant room for growth. `;
    }
  }

  if (cohortAvg != null) {
    const diff = score - cohortAvg;
    if (diff > 10) {
      text += `You're ${diff} points above the ${archetypeName} average of ${cohortAvg}.`;
    } else if (diff < -10) {
      text += `The ${archetypeName} average is ${cohortAvg} — you're ${Math.abs(diff)} points below. The gap is closeable.`;
    } else {
      text += `Right around the ${archetypeName} average of ${cohortAvg}.`;
    }
  }

  return text || `Influence tier: ${influenceTier}.`;
}
