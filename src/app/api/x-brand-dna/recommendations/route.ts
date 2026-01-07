// =============================================================================
// X BRAND DNA RECOMMENDATIONS API
// Generates actionable improvement roadmap from Brand DNA analysis
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// Types
// =============================================================================

interface BrandDNAInput {
  username: string;
  displayName: string;
  brandScore: number;
  archetype: string;
  voiceConsistency: number;
  personalitySummary: string;
  keywords: string[];
  contentPillars?: Array<{ name: string; frequency: number }>;
  performanceInsights?: {
    bestFormats: string[];
    optimalLength: { min: number; max: number };
    highEngagementTopics: string[];
    voiceConsistency: number;
  };
  phases: {
    define: { score: number; insights: string[] };
    check: { score: number; insights: string[] };
    generate: { score: number; insights: string[] };
    scale: { score: number; insights: string[] };
  };
  topStrengths: string[];
  topImprovements: string[];
  bio?: string;
  followersCount?: number;
}

interface Issue {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'define' | 'check' | 'generate' | 'scale';
}

interface QuickWin {
  action: string;
  timeEstimate: string;
  template?: string;
}

interface WeeklyFocus {
  challenge: string;
  metric: string;
  tips: string[];
}

export interface RecommendationsResponse {
  success: boolean;
  recommendations: {
    topIssues: Issue[];
    quickWins: QuickWin[];
    weeklyFocus: WeeklyFocus;
  } | null;
  error?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function identifyTopIssues(input: BrandDNAInput): Issue[] {
  const issues: Issue[] = [];
  const { phases, voiceConsistency, brandScore, bio, followersCount } = input;

  // Check DEFINE phase issues
  if (phases.define.score < 70) {
    if (!bio || bio.length < 50) {
      issues.push({
        title: 'Your bio lacks clarity',
        description: "Your bio doesn't clearly communicate what you do or who you help. Visitors can't quickly understand your value.",
        impact: 'high',
        category: 'define',
      });
    } else {
      issues.push({
        title: 'Brand identity needs sharpening',
        description: 'Your profile signals are scattered. People struggle to pin down what makes you unique.',
        impact: 'high',
        category: 'define',
      });
    }
  }

  // Check CHECK phase issues (consistency)
  if (voiceConsistency < 70) {
    issues.push({
      title: `Voice consistency at ${voiceConsistency}%`,
      description: 'You shift between different tones and topics. This makes your brand harder to remember and follow.',
      impact: 'high',
      category: 'check',
    });
  } else if (voiceConsistency < 85) {
    issues.push({
      title: 'Room to improve voice consistency',
      description: `At ${voiceConsistency}% consistency, there's opportunity to create stronger brand recall through more focused content.`,
      impact: 'medium',
      category: 'check',
    });
  }

  // Check GENERATE phase issues
  if (phases.generate.score < 70) {
    issues.push({
      title: 'Content strategy needs structure',
      description: 'Your posts lack a clear content pillar strategy. This makes it hard to build expertise perception.',
      impact: 'medium',
      category: 'generate',
    });
  }

  // Check SCALE phase issues
  if (phases.scale.score < 70) {
    issues.push({
      title: 'Growth signals are weak',
      description: 'Your profile isn\'t optimized for discovery. You\'re missing opportunities to expand your reach.',
      impact: 'medium',
      category: 'scale',
    });
  }

  // Engagement ratio issue
  if (followersCount && followersCount < 1000 && brandScore > 60) {
    issues.push({
      title: 'Quality without reach',
      description: 'Your brand is solid but your audience is small. Time to focus on strategic growth.',
      impact: 'medium',
      category: 'scale',
    });
  }

  // Sort by impact and return top 3
  const impactOrder = { high: 0, medium: 1, low: 2 };
  return issues
    .sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact])
    .slice(0, 3);
}

function generateQuickWins(input: BrandDNAInput, issues: Issue[]): QuickWin[] {
  const quickWins: QuickWin[] = [];
  const { archetype, keywords, contentPillars } = input;

  // Always start with bio optimization if it's an issue
  const hasBioIssue = issues.some(i => i.title.includes('bio'));
  if (hasBioIssue) {
    quickWins.push({
      action: 'Rewrite your bio with this structure',
      timeEstimate: '5 min',
      template: `[Who you are] | [What you do] | [Who you help]\n\nExample: "${archetype} | Building [your thing] | Helping [your audience] achieve [outcome]"`,
    });
  }

  // Pin best content suggestion
  quickWins.push({
    action: 'Pin your highest-performing thread to your profile',
    timeEstimate: '2 min',
    template: 'Go to your best thread > Click "..." > Pin to your profile. This becomes your brand\'s first impression.',
  });

  // Content pillar focus
  if (contentPillars && contentPillars.length > 0) {
    const topPillar = contentPillars[0].name;
    quickWins.push({
      action: `Double down on "${topPillar}" content this week`,
      timeEstimate: '10 min planning',
      template: `Your audience engages most with ${topPillar}. Plan 3 posts around this topic for the week.`,
    });
  } else if (keywords.length > 0) {
    quickWins.push({
      action: `Create a thread about "${keywords[0]}"`,
      timeEstimate: '15 min',
      template: `"${keywords[0]}" is core to your brand. A deep-dive thread will reinforce your expertise.`,
    });
  }

  // Profile completeness
  quickWins.push({
    action: 'Add a clear CTA link to your profile',
    timeEstimate: '2 min',
    template: 'Link to your newsletter, portfolio, or lead magnet. Give visitors a next step.',
  });

  return quickWins.slice(0, 4);
}

function generateWeeklyFocus(input: BrandDNAInput, issues: Issue[]): WeeklyFocus {
  const { voiceConsistency, archetype, contentPillars, phases } = input;

  // Determine the primary focus based on weakest area
  const lowestPhase = Object.entries(phases)
    .map(([key, val]) => ({ phase: key, score: val.score }))
    .sort((a, b) => a.score - b.score)[0];

  const topPillar = contentPillars?.[0]?.name || 'your main topic';

  switch (lowestPhase.phase) {
    case 'define':
      return {
        challenge: 'Clarify your brand positioning',
        metric: 'Update bio + pin + banner to tell a cohesive story',
        tips: [
          'Write down 3 words you want people to associate with you',
          'Remove anything from your bio that doesn\'t support those words',
          'Your profile picture, banner, and bio should all reinforce the same message',
        ],
      };
    case 'check':
      return {
        challenge: `Boost voice consistency from ${voiceConsistency}% to ${Math.min(voiceConsistency + 10, 100)}%`,
        metric: 'Post 5 on-brand tweets this week',
        tips: [
          `Before posting, ask: "Does this sound like ${archetype}?"`,
          'Save off-brand thoughts as drafts, not tweets',
          'Use the same opening hook style for consistency',
        ],
      };
    case 'generate':
      return {
        challenge: `Create a content pillar series around "${topPillar}"`,
        metric: 'Publish 3 connected posts on the same theme',
        tips: [
          'Start with a problem your audience faces',
          'Break down your solution into bite-sized tweets',
          'End each post with a teaser for the next one',
        ],
      };
    case 'scale':
    default:
      return {
        challenge: 'Expand your reach through strategic engagement',
        metric: 'Reply thoughtfully to 5 accounts larger than yours daily',
        tips: [
          'Find 10 accounts in your niche with 10x your followers',
          'Add value in their replies, don\'t just agree',
          'Your best content often starts as a reply that deserves its own post',
        ],
      };
  }
}

// =============================================================================
// AI-Enhanced Recommendations
// =============================================================================

async function generateAIRecommendations(input: BrandDNAInput): Promise<RecommendationsResponse['recommendations']> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `You are BrandOS, a Brand Guardian AI. Analyze this brand data and provide specific, actionable recommendations.

Brand Data:
- Username: @${input.username}
- Brand Score: ${input.brandScore}/100
- Archetype: ${input.archetype}
- Voice Consistency: ${input.voiceConsistency}%
- Keywords: ${input.keywords.join(', ')}
- Top Strengths: ${input.topStrengths.join(', ')}
- Areas to Improve: ${input.topImprovements.join(', ')}
- Phase Scores: Define ${input.phases.define.score}, Check ${input.phases.check.score}, Generate ${input.phases.generate.score}, Scale ${input.phases.scale.score}

Respond with a JSON object (no markdown, just raw JSON) with this exact structure:
{
  "topIssues": [
    {"title": "Issue title (max 6 words)", "description": "2-sentence explanation of why this matters", "impact": "high|medium|low", "category": "define|check|generate|scale"}
  ],
  "quickWins": [
    {"action": "Specific action they can take", "timeEstimate": "X min", "template": "Optional template or example"}
  ],
  "weeklyFocus": {
    "challenge": "One clear goal for the week",
    "metric": "How to measure success",
    "tips": ["Tip 1", "Tip 2", "Tip 3"]
  }
}

Rules:
- Be specific to THIS user's data, not generic advice
- Top Issues: max 3, sorted by impact
- Quick Wins: max 4, all doable in under 15 minutes
- Weekly Focus: ONE clear, achievable goal
- Use their archetype (${input.archetype}) to frame advice
- No fluff, no generic platitudes`,
          },
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.content?.[0]?.text;

      if (content) {
        try {
          const parsed = JSON.parse(content);
          return parsed;
        } catch {
          console.error('Failed to parse AI response as JSON');
        }
      }
    }
  } catch (error) {
    console.error('AI recommendations error:', error);
  }

  // Return null to fall back to rule-based recommendations
  return null;
}

// =============================================================================
// Main Handler
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: BrandDNAInput = await request.json();

    if (!body.username || !body.phases) {
      return NextResponse.json(
        { success: false, error: 'Missing required brand data' },
        { status: 400 }
      );
    }

    // Try AI-enhanced recommendations first
    let recommendations = await generateAIRecommendations(body);

    // Fall back to rule-based if AI fails
    if (!recommendations) {
      const topIssues = identifyTopIssues(body);
      const quickWins = generateQuickWins(body, topIssues);
      const weeklyFocus = generateWeeklyFocus(body, topIssues);

      recommendations = {
        topIssues,
        quickWins,
        weeklyFocus,
      };
    }

    return NextResponse.json({
      success: true,
      recommendations,
    } as RecommendationsResponse);

  } catch (error) {
    console.error('Recommendations API Error:', error);
    return NextResponse.json(
      {
        success: false,
        recommendations: null,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as RecommendationsResponse,
      { status: 500 }
    );
  }
}
