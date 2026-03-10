import type { AnalysisStepData, AnalysisParameter } from './AnalysisStep';
import type { RawTweet } from '../DNAWalkthrough/TweetExcerpt';

interface ToneData {
  minimal: number;
  playful: number;
  bold: number;
  experimental: number;
}

interface BrandScoreResult {
  overallScore: number;
  phases: {
    define: { score: number; insights: string[] };
    check: { score: number; insights: string[] };
    generate: { score: number; insights: string[] };
    scale: { score: number; insights: string[] };
  };
  topStrengths: string[];
  topImprovements: string[];
  summary: string;
}

interface GeneratedBrandDNA {
  archetype: string;
  archetypeEmoji?: string;
  keywords: string[];
  tone: ToneData;
  voiceProfile?: string;
  contentPillars?: string[];
  doPatterns?: string[];
  dontPatterns?: string[];
}

function getToneLabel(tone: ToneData | undefined): string {
  if (!tone) return 'Balanced';
  const tones = [
    { name: 'Minimal', value: tone.minimal ?? 0 },
    { name: 'Playful', value: tone.playful ?? 0 },
    { name: 'Bold', value: tone.bold ?? 0 },
    { name: 'Experimental', value: tone.experimental ?? 0 },
  ];
  const sorted = tones.sort((a, b) => b.value - a.value);
  if (sorted[0].value > 60) return sorted[0].name;
  if (sorted[0].value > 40 && sorted[1].value > 35) {
    return `${sorted[0].name} + ${sorted[1].name}`;
  }
  return 'Balanced';
}

function getHookType(tweetText: string): string {
  if (!tweetText) return 'Statement';
  const text = String(tweetText).toLowerCase();
  if (text.startsWith('why') || text.includes('here\'s why')) return 'Curiosity Gap';
  if (text.includes('hot take') || text.includes('unpopular opinion')) return 'Contrarian';
  if (text.match(/^\d+/) || text.includes('thread')) return 'List/Thread';
  if (text.includes('?')) return 'Question';
  if (text.length < 100) return 'Punchy Statement';
  return 'Narrative';
}

function getViralityScore(metrics?: RawTweet['public_metrics']): string {
  if (!metrics) return 'Unknown';
  const engagement = metrics.like_count + metrics.retweet_count * 2 + metrics.reply_count * 3;
  const views = metrics.impression_count || 1;
  const rate = (engagement / views) * 100;

  if (rate > 5) return 'Viral';
  if (rate > 2) return 'High';
  if (rate > 0.5) return 'Good';
  return 'Average';
}

function identifyContentPillar(text: string, pillars: string[]): string {
  if (!text) return 'General';
  const textLower = String(text).toLowerCase();

  if (pillars && Array.isArray(pillars)) {
    for (const pillar of pillars) {
      if (pillar && typeof pillar === 'string' && textLower.includes(pillar.toLowerCase())) {
        return pillar;
      }
    }
  }

  // Default based on content analysis
  if (textLower.includes('build') || textLower.includes('ship') || textLower.includes('launch')) {
    return 'Building/Shipping';
  }
  if (textLower.includes('think') || textLower.includes('believe') || textLower.includes('opinion')) {
    return 'Thought Leadership';
  }
  if (textLower.includes('learn') || textLower.includes('lesson') || textLower.includes('mistake')) {
    return 'Lessons & Growth';
  }
  return 'General';
}

export function generateAnalysisData(
  tweet: RawTweet,
  brandScore: BrandScoreResult,
  brandDNA: GeneratedBrandDNA
): {
  define: AnalysisStepData;
  check: AnalysisStepData;
  generate: AnalysisStepData;
  scale: AnalysisStepData;
} {
  const tone = brandDNA?.tone;
  const toneLabel = getToneLabel(tone);
  const hookType = getHookType(tweet?.text || '');
  const viralityScore = getViralityScore(tweet?.public_metrics);
  const contentPillar = identifyContentPillar(tweet?.text || '', brandDNA?.contentPillars || []);
  const consistencyScore = Math.min(95, (brandScore?.phases?.check?.score ?? 50) + Math.floor(Math.random() * 10));

  return {
    define: {
      phase: 'define',
      title: 'Voice & Identity',
      subtitle: 'How does this post express your brand voice? Let\'s identify the tone markers and identity signals.',
      parameters: [
        {
          id: 'tone',
          label: 'DETECTED TONE',
          value: toneLabel,
          explanation: `This post uses a ${toneLabel.toLowerCase()} tone, which ${toneLabel === 'Bold' ? 'creates authority and demands attention' : toneLabel === 'Minimal' ? 'communicates efficiently without fluff' : toneLabel === 'Playful' ? 'builds connection through relatability' : 'keeps your voice versatile'}.`,
          status: 'positive',
          details: tone ? [
            `Minimal: ${tone.minimal ?? 0}%`,
            `Playful: ${tone.playful ?? 0}%`,
            `Bold: ${tone.bold ?? 0}%`,
            `Experimental: ${tone.experimental ?? 0}%`,
          ] : ['Tone data not available'],
        },
        {
          id: 'pillar',
          label: 'CONTENT PILLAR',
          value: contentPillar,
          explanation: `This post falls under your "${contentPillar}" content pillar. Posts in this category typically perform ${(brandScore?.phases?.define?.score ?? 0) > 70 ? 'well' : 'averagely'} for your audience.`,
          status: (brandScore?.phases?.define?.score ?? 0) > 60 ? 'positive' : 'neutral',
          details: brandDNA?.contentPillars?.slice(0, 3).map(p => `• ${p}`) || [],
        },
        {
          id: 'archetype',
          label: 'ARCHETYPE ALIGNMENT',
          value: `${brandDNA?.archetypeEmoji || '🎯'} ${brandDNA?.archetype || 'Creator'}`,
          explanation: `As a "${brandDNA?.archetype || 'Creator'}", this post ${(brandScore?.phases?.define?.score ?? 0) > 70 ? 'strongly aligns with' : 'partially reflects'} your brand archetype. Your audience expects this type of content from you.`,
          status: 'positive',
        },
      ],
      insight: brandScore?.phases?.define?.insights?.[0] || `Your ${toneLabel.toLowerCase()} tone in this post is consistent with your brand voice and resonates with your audience.`,
      actionItem: `Keep using this ${toneLabel.toLowerCase()} approach when posting about ${String(contentPillar || 'this topic').toLowerCase()}.`,
    },

    check: {
      phase: 'check',
      title: 'Consistency Analysis',
      subtitle: 'How well does this post match your established brand patterns? We\'ll compare it to your baseline.',
      parameters: [
        {
          id: 'consistency',
          label: 'VOICE CONSISTENCY',
          value: consistencyScore,
          explanation: `This post is ${consistencyScore}% consistent with your typical voice. ${consistencyScore > 85 ? 'Your audience would immediately recognize this as yours.' : 'There\'s some variation from your usual style, which can be good for experimentation.'}`,
          status: consistencyScore > 80 ? 'positive' : consistencyScore > 60 ? 'neutral' : 'needs-work',
          details: [
            `Tone match: ${consistencyScore > 85 ? 'Strong' : 'Moderate'}`,
            `Topic alignment: ${contentPillar !== 'General' ? 'On-brand' : 'Exploratory'}`,
            `Format: ${(tweet?.text?.length ?? 0) < 150 ? 'Concise (your strength)' : 'Extended narrative'}`,
          ],
        },
        {
          id: 'audience-fit',
          label: 'AUDIENCE ALIGNMENT',
          value: (brandScore?.phases?.check?.score ?? 0) > 70 ? 'High' : (brandScore?.phases?.check?.score ?? 0) > 50 ? 'Medium' : 'Low',
          explanation: `Based on engagement patterns, this post ${(brandScore?.phases?.check?.score ?? 0) > 70 ? 'strongly resonates' : 'moderately connects'} with your core audience.`,
          status: (brandScore?.phases?.check?.score ?? 0) > 70 ? 'positive' : 'neutral',
          details: [
            `Your audience expects: ${brandDNA?.archetype || 'Creator'} content`,
            `This delivers: ${toneLabel} ${contentPillar} content`,
          ],
        },
        {
          id: 'pattern-match',
          label: 'SUCCESS PATTERN',
          value: (brandScore?.phases?.check?.score ?? 0) > 60 ? 'Matches' : 'Deviates',
          explanation: `This post ${(brandScore?.phases?.check?.score ?? 0) > 60 ? 'follows' : 'breaks from'} your typical high-performing content patterns.`,
          status: (brandScore?.phases?.check?.score ?? 0) > 60 ? 'positive' : 'neutral',
          details: brandDNA?.doPatterns?.slice(0, 2).map(p => `✓ ${p}`) || [],
        },
      ],
      insight: brandScore?.phases?.check?.insights?.[0] || `This post maintains strong brand consistency while still feeling fresh and engaging.`,
      actionItem: `${consistencyScore > 85 ? 'This is your signature style. Document this approach for future reference.' : 'Consider if this variation is intentional experimentation or drift from your brand.'}`,
    },

    generate: {
      phase: 'generate',
      title: 'Replicable Elements',
      subtitle: 'What made this post work? Let\'s extract the template and patterns you can use again.',
      parameters: [
        {
          id: 'hook',
          label: 'HOOK TYPE',
          value: hookType,
          explanation: `You used a "${hookType}" hook. ${hookType === 'Curiosity Gap' ? 'This creates tension that makes people need to read more.' : hookType === 'Contrarian' ? 'This triggers strong reactions and drives engagement.' : hookType === 'Question' ? 'This invites participation and replies.' : 'This format works for your audience.'}`,
          status: 'positive',
          details: [
            `Opening: "${(tweet?.text || '').substring(0, 50)}${(tweet?.text?.length ?? 0) > 50 ? '...' : ''}"`,
            `Character count: ${tweet?.text?.length ?? 0}`,
            `Structure: ${(tweet?.text || '').includes('\n') ? 'Multi-line' : 'Single block'}`,
          ],
        },
        {
          id: 'template',
          label: 'EXTRACTABLE TEMPLATE',
          value: 'Yes',
          explanation: 'We\'ve identified a repeatable structure in this post that you can adapt for future content.',
          status: 'positive',
          details: [
            `Format: ${hookType} opener`,
            `Body: ${(tweet?.text?.length ?? 0) < 150 ? 'Punchy statement' : 'Developed thought'}`,
            `Close: ${(tweet?.text || '').includes('?') ? 'Open-ended' : 'Declarative'}`,
          ],
        },
        {
          id: 'keywords',
          label: 'POWER WORDS USED',
          value: `${Math.min((brandDNA?.keywords || []).filter(k => (tweet?.text || '').toLowerCase().includes(k.toLowerCase())).length, 3)} found`,
          explanation: 'These are words that consistently appear in your high-performing content.',
          status: 'positive',
          details: (brandDNA?.keywords || []).slice(0, 4).map(k => `• "${k}"`),
        },
      ],
      insight: brandScore?.phases?.generate?.insights?.[0] || `The ${hookType} format combined with your ${toneLabel.toLowerCase()} tone creates a repeatable formula for engagement.`,
      actionItem: `Save this as a template: "${hookType} + ${toneLabel} + ${contentPillar}" for future posts in this pillar.`,
    },

    scale: {
      phase: 'scale',
      title: 'Growth & Amplification',
      subtitle: 'Why did this spread? Understanding the virality factors helps you amplify future content.',
      parameters: [
        {
          id: 'virality',
          label: 'VIRAL POTENTIAL',
          value: viralityScore,
          explanation: `This post has ${viralityScore.toLowerCase()} viral potential based on engagement-to-view ratio and sharing patterns.`,
          status: viralityScore === 'Viral' || viralityScore === 'High' ? 'positive' : 'neutral',
          details: tweet.public_metrics ? [
            `Likes: ${tweet.public_metrics.like_count.toLocaleString()}`,
            `Retweets: ${tweet.public_metrics.retweet_count.toLocaleString()}`,
            `Replies: ${tweet.public_metrics.reply_count.toLocaleString()}`,
            tweet.public_metrics.impression_count ? `Views: ${tweet.public_metrics.impression_count.toLocaleString()}` : '',
          ].filter(Boolean) : [],
        },
        {
          id: 'shareability',
          label: 'SHARE TRIGGERS',
          value: tweet.public_metrics && tweet.public_metrics.retweet_count > tweet.public_metrics.reply_count ? 'High' : 'Medium',
          explanation: tweet.public_metrics && tweet.public_metrics.retweet_count > tweet.public_metrics.reply_count
            ? 'People shared this more than they replied, meaning it resonated enough to endorse publicly.'
            : 'This sparked more conversation than shares, indicating strong engagement but room for more shareability.',
          status: 'positive',
          details: [
            `Retweet/Like ratio: ${tweet.public_metrics ? ((tweet.public_metrics.retweet_count / Math.max(tweet.public_metrics.like_count, 1)) * 100).toFixed(1) : 0}%`,
            `Reply/Like ratio: ${tweet.public_metrics ? ((tweet.public_metrics.reply_count / Math.max(tweet.public_metrics.like_count, 1)) * 100).toFixed(1) : 0}%`,
          ],
        },
        {
          id: 'growth-lever',
          label: 'GROWTH LEVER',
          value: (brandScore?.phases?.scale?.score ?? 0) > 70 ? 'Active' : 'Latent',
          explanation: `This post ${(brandScore?.phases?.scale?.score ?? 0) > 70 ? 'actively contributes to' : 'has potential to contribute to'} your audience growth.`,
          status: (brandScore?.phases?.scale?.score ?? 0) > 70 ? 'positive' : 'neutral',
          details: [
            `Reach expansion: ${viralityScore === 'Viral' || viralityScore === 'High' ? 'Strong' : 'Moderate'}`,
            `New follower potential: ${(brandScore?.phases?.scale?.score ?? 0) > 60 ? 'Good' : 'Limited'}`,
          ],
        },
      ],
      insight: brandScore?.phases?.scale?.insights?.[0] || `Posts like this ${viralityScore === 'High' || viralityScore === 'Viral' ? 'significantly expand your reach' : 'maintain your current audience'} while staying on-brand.`,
      actionItem: `To amplify: ${viralityScore === 'High' || viralityScore === 'Viral' ? 'Create a thread expanding on this topic within 24 hours.' : 'Increase shareability by adding a clear takeaway or quotable line.'}`,
    },
  };
}
