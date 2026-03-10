export interface GrowthPlanData {
  currentFollowers: number;
  targetFollowers: number;
  deadlineMonths: number;
  dailyNeeded: number;
  monthlyNeeded: number;
  engagementRate7d: number | null;
  engagementRate3d: number | null;

  gapScores: {
    hookStrength: number;
    formatMatch: number;
    toneAlignment: number;
    ctaEffectiveness: number;
    engagementVelocity: number;
    postingConsistency: number;
    overall: number;
  } | null;

  strengths: Array<{
    metric: string;
    value: string;
    benchmark: string;
    verdict: string;
  }>;

  bottleneck: {
    title: string;
    description: string;
    keyMetrics: Array<{
      metric: string;
      current: string;
      target: string;
    }>;
  };

  levers: Array<{
    title: string;
    impact: 'highest' | 'high' | 'medium-high' | 'medium';
    score: number;
    description: string;
    actionItems: string[];
    target: string;
  }>;

  weeklyPlan: Array<{
    day: string;
    content: string;
    format: string;
    ctaType: string;
  }>;

  milestones: Array<{
    month: string;
    targetFollowers: number;
    growth: number;
    focus: string;
    metric: string;
  }>;

  stopDoing: string[];
  dailyNonNegotiables: string[];
  oneThingThatMatters: string;
}
