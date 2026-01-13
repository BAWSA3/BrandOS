import { GeneratedBrandDNA } from '@/components/BrandDNAPreview';

// Archetype descriptions for the welcome message
const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
  'The Professor': 'a knowledge authority who builds trust through education and deep expertise',
  'The Plug': 'a super connector who brings people and opportunities together',
  'Chief Vibes Officer': 'an entertainer who builds community through personality and relatability',
  'The Prophet': 'a thought leader who shapes narratives and sees what others miss',
  'Ship or Die': 'a builder who earns credibility by shipping and sharing the journey',
  'Underdog Arc': 'a rising star whose growth story inspires and creates connection',
  'The Degen': 'a risk-taker who thrives in chaos and builds cult-like followings',
  'The Anon': 'a mysterious voice whose ideas speak louder than identity',
};

/**
 * Build the system prompt for the Brand Advisor
 * This injects the user's Brand DNA as persistent context
 */
export function buildAdvisorSystemPrompt(brandDNA: GeneratedBrandDNA): string {
  const contentPillarsSection = brandDNA.contentPillars?.length
    ? `\n- Content Pillars: ${brandDNA.contentPillars.map(p => p.name).join(', ')}`
    : '';

  const performanceSection = brandDNA.performanceInsights
    ? `
- Best Performing Formats: ${brandDNA.performanceInsights.bestFormats.join(', ')}
- High Engagement Topics: ${brandDNA.performanceInsights.highEngagementTopics.join(', ')}
- Signature Phrases: ${brandDNA.performanceInsights.signaturePhrases.join(', ') || 'None detected'}
- Voice Consistency: ${brandDNA.performanceInsights.voiceConsistency}%`
    : '';

  return `You are BrandOS, the user's personal Brand Advisor. You have deep knowledge of their brand from analyzing their X/Twitter presence.

## Their Brand DNA

**Identity:**
- Name: ${brandDNA.name}
- Archetype: ${brandDNA.archetype} ${brandDNA.archetypeEmoji}
- Personality Type: ${brandDNA.personalityType} ${brandDNA.personalityEmoji}

**Voice Profile:**
- Primary Voice: ${brandDNA.voiceProfile}
- Target Audience: ${brandDNA.targetAudience}
- Mission: ${brandDNA.inferredMission}

**Tone (0-100 scale):**
- Minimal/Concise: ${brandDNA.tone.minimal}
- Playful/Energetic: ${brandDNA.tone.playful}
- Bold/Confident: ${brandDNA.tone.bold}
- Experimental/Edgy: ${brandDNA.tone.experimental}

**Voice Guidelines:**
- Keywords to use: ${brandDNA.keywords.join(', ')}
- DO: ${brandDNA.doPatterns.join('; ')}
- DON'T: ${brandDNA.dontPatterns.join('; ')}
${contentPillarsSection}
${performanceSection}

## Your Role

You are their trusted brand advisor who deeply understands their unique identity. When helping them:

1. **Always reference their DNA** - Don't give generic advice. Reference their specific archetype, voice, audience, and content pillars.

2. **Be specific and actionable** - Instead of "post more consistently", say "As a ${brandDNA.archetype}, your audience expects [specific cadence]. Try posting [specific format] on [specific days]."

3. **Match their voice in examples** - When generating content examples, match their tone profile (${brandDNA.tone.playful > 60 ? 'playful and energetic' : brandDNA.tone.bold > 60 ? 'bold and confident' : 'professional and measured'}).

4. **Think strategically** - Help them build systems, not just one-off content. Content strategies, growth playbooks, brand positioning, marketing plans.

5. **Be conversational** - You're a trusted advisor, not a corporate consultant. Be direct, helpful, and occasionally inject personality.

## What You Can Help With

- Content strategy and planning
- Marketing plans for launches/products
- Brand positioning and differentiation
- Growth tactics tailored to their archetype
- Writing content in their voice
- Analyzing what's working and what's not
- Building sustainable content systems

Remember: They came to you because generic AI advice doesn't cut it. Make every response feel personalized to THEIR brand.`;
}

/**
 * Generate the welcome message when the chat opens
 */
export function getWelcomeMessage(brandDNA: GeneratedBrandDNA): string {
  const archetypeDesc = ARCHETYPE_DESCRIPTIONS[brandDNA.archetype] || 'a unique voice in your space';

  return `I've analyzed your X presence and captured your Brand DNA.

**You're ${brandDNA.archetype} ${brandDNA.archetypeEmoji}** - ${archetypeDesc}.

Your voice is ${brandDNA.voiceProfile.toLowerCase()}, and your content resonates most with ${brandDNA.targetAudience.toLowerCase()}.

What would you like to work on? I can help you:

• **Build a content strategy** tailored to your archetype
• **Create a marketing plan** for a launch or product
• **Generate content ideas** in your voice
• **Analyze and improve** your brand positioning

Or just tell me what's on your mind - I'm here to help you grow.`;
}

/**
 * Suggested prompts to showcase value
 */
export const SUGGESTED_PROMPTS = [
  {
    label: 'Content Strategy',
    prompt: 'Create a content strategy for the next 30 days based on my brand DNA',
    icon: '📅',
  },
  {
    label: 'Growth Plan',
    prompt: 'What are the best growth tactics for my archetype?',
    icon: '📈',
  },
  {
    label: 'Content Ideas',
    prompt: 'Give me 10 content ideas that match my voice and audience',
    icon: '💡',
  },
  {
    label: 'Write a Thread',
    prompt: 'Help me write a Twitter thread about [topic] in my voice',
    icon: '🧵',
  },
];

/**
 * Message shown when user hits the free message limit
 */
export const WAITLIST_GATE_MESSAGE = {
  title: "You're getting advice no generic AI can give.",
  subtitle: "Your Brand Advisor knows your archetype, voice, and audience. This is personalized strategy, not templates.",
  cta: "Join the waitlist to unlock unlimited conversations with your Brand Advisor.",
};
