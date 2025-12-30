/**
 * BrandOS Email Sequence Templates
 * Post X Brand Score Signup Flow
 * 
 * Based on Messaging Framework - Pain Points #1, #3, #4, #6
 * 
 * Variables to pass:
 * - name: User's name from signup
 * - username: X handle
 * - score: Overall score (0-100)
 * - defineScore, checkScore, generateScore, scaleScore: Phase scores
 * - archetype: "The Professor", "The Plug", etc.
 * - archetypeEmoji: 🎓, 🔌, etc.
 * - archetypeTagline: From the archetype
 * - archetypeDescription: Why it fits
 * - archetypeStrengths: Array of strengths
 * - topImprovement: First item from topImprovements
 * - topStrength: First item from topStrengths
 */

// =============================================================================
// Types
// =============================================================================

export interface EmailTemplateData {
  name: string;
  username: string;
  score: number;
  defineScore: number;
  checkScore: number;
  generateScore: number;
  scaleScore: number;
  archetype: string;
  archetypeEmoji: string;
  archetypeTagline: string;
  archetypeDescription: string;
  archetypeStrengths: string[];
  topImprovement: string;
  topStrength: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  sendDelay: string; // e.g., "immediate", "24h", "48h", "72h"
  subjectLines: string[];
  body: (data: EmailTemplateData) => string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getScoreMessage(score: number): { intro: string; advice: string } {
  if (score >= 80) {
    return {
      intro: `That's EXCELLENT. You're in the top 15% of creators we've analyzed. Your brand is already working for you.

But even strong brands have room to grow.`,
      advice: `Here's your biggest opportunity:`
    };
  }
  if (score >= 60) {
    return {
      intro: `That's SOLID—you're doing better than most. But here's the thing: the difference between a 70 and an 85 isn't just 15 points. It's the difference between "I think I've seen them before" and "I need to follow this person."`,
      advice: `Your biggest opportunity right now:`
    };
  }
  return {
    intro: `Real talk: there's work to do. But that's not a bad thing—it means there's upside.

81% of people need to trust a brand before engaging with it. Right now, your profile might be creating friction you don't even know about.`,
    advice: `The good news? Your biggest fix is simple:`
  };
}

// =============================================================================
// Email 1: Your Score + What It Means
// =============================================================================

export const email1ScoreExplainer: EmailTemplate = {
  id: 'score-explainer',
  name: 'Your Score + What It Means',
  sendDelay: 'immediate',
  subjectLines: [
    'Your Brand Score: {{score}}/100 — here\'s what it means',
    '@{{username}}, here\'s your brand breakdown',
    '{{score}}/100 — is your brand helping or hurting you?',
  ],
  body: (data) => {
    const scoreMsg = getScoreMessage(data.score);
    
    return `Hey ${data.name},

You just scored ${data.score}/100 on your X Brand Score.

${scoreMsg.intro}

${scoreMsg.advice}
→ ${data.topImprovement}

Your archetype: ${data.archetype} ${data.archetypeEmoji}
"${data.archetypeTagline}"

This matters because ${data.archetypeDescription}

Tomorrow, I'll send you a specific tactic to improve your score. No fluff—just one thing you can do in 10 minutes.

— BrandOS

P.S. Want to see how you stack up? Compare with a competitor at brandos.xyz`;
  }
};

// =============================================================================
// Email 2: How to Improve (Clarity Focus)
// =============================================================================

export const email2ClarityFix: EmailTemplate = {
  id: 'clarity-fix',
  name: 'How to Improve (Clarity Focus)',
  sendDelay: '24h',
  subjectLines: [
    'The 10-minute fix for @{{username}}\'s brand',
    'Your bio is leaking followers. Here\'s why.',
    'One change. More clarity. Let\'s go.',
  ],
  body: (data) => `${data.name},

Yesterday I showed you your score. Today, let's fix something.

Your Define score was ${data.defineScore}/100.

Here's why that matters: 37% of people say mixed messaging confuses them enough to unfollow. If your bio doesn't instantly communicate who you are and what you do, you're losing people before they even see your content.

**The 10-Minute Bio Fix:**

1. Open your X profile
2. Look at your bio
3. Ask: "Would a stranger know what I do in 5 seconds?"

If the answer is "maybe" or "no," try this format:

[What you do] for [who you help]
[Credibility signal or result]
[Optional: personality/vibe]

**Example:**
Before: "Thoughts on tech, life, and building things. DMs open."
After: "Helping founders ship faster with AI tools. Built 3 products to $10K MRR. Always building, always shipping."

The first one could be anyone. The second one is memorable.

**Your brand DNA says you're a ${data.archetype}.**

That means your bio should signal: ${data.archetypeStrengths[0] || 'authority'} and ${data.archetypeStrengths[1] || 'expertise'}.

Reply to this email with your current bio and I'll give you a quick rewrite suggestion.

— BrandOS

Re-check your score after updating: brandos.xyz?username=${data.username}`
};

// =============================================================================
// Email 3: Time-Saving Angle (Overwhelm Focus)
// =============================================================================

export const email3TimeSaver: EmailTemplate = {
  id: 'time-saver',
  name: 'Time-Saving Angle (Overwhelm Focus)',
  sendDelay: '48h',
  subjectLines: [
    'You\'re spending 8+ hours/week on this. Stop.',
    'What if your brand ran on autopilot?',
    'The "does this sound like me?" problem, solved',
  ],
  body: (data) => `${data.name},

Quick question: How much time do you spend second-guessing your content?

"Does this sound like me?"
"Is this on-brand?"
"Should I post this or rewrite it... again?"

Creators spend an average of 8+ hours per week on content for just ONE platform. And a huge chunk of that time is spent wondering if it "sounds right."

Here's the problem: Your brain can't objectively evaluate your own voice. You're too close to it.

**That's why we built BrandOS.**

Instead of guessing, you get:
✓ A score (0-100) for any draft in seconds
✓ Specific feedback on what's off
✓ AI-suggested rewrites that sound like you

No more "does this work?" paralysis. Just write, check, post.

**Early access is opening soon.**

You're on the list, which means you'll get first access + founding member pricing.

But here's the thing—we're limiting the first batch to creators who actually care about their brand (not just want another AI tool).

Reply "I'm in" if you want to be in the first group.

— BrandOS

P.S. Your score was ${data.score}/100. Imagine what it'd be if every post was on-brand. See your full breakdown: brandos.xyz?username=${data.username}`
};

// =============================================================================
// Email 4: Social Proof + Upgrade CTA (Budget Focus)
// =============================================================================

export const email4UpgradeCTA: EmailTemplate = {
  id: 'upgrade-cta',
  name: 'Social Proof + Upgrade CTA (Budget Focus)',
  sendDelay: '72h',
  subjectLines: [
    '@{{username}}, you\'re in (if you want it)',
    'This costs less than your coffee. Seriously.',
    'Founders are paying $10K for this. You won\'t.',
  ],
  body: (data) => {
    const scoreContext = data.score >= 60 ? 'solid' : 'leaving points on the table';
    
    return `${data.name},

Real talk about brand strategy:

→ Brand agencies charge $10,000 - $80,000 for a brand system
→ Freelance brand strategists charge $2,000 - $5,000 per project
→ Most creators? They wing it and hope for the best

Here's what "winging it" actually costs:

• 56% drop in brand recognition from inconsistency
• Followers who can't remember what you're about
• Engagement that flatlines because your voice keeps shifting
• Opportunities that go to creators with clearer positioning

You scored ${data.score}/100. That's ${scoreContext}.

**BrandOS gives you the brand infrastructure of a well-funded startup—for less than your monthly coffee budget.**

What you get:
✓ Your complete Brand DNA (captured from your best content)
✓ Real-time content checking (know if it's on-brand before you post)
✓ AI content generation (that actually sounds like you)
✓ Consistency monitoring (catch drift before it hurts you)

**Early access pricing: $9/month**
*(Normal price will be $29/month)*

Claim Your Early Access: brandos.xyz/early-access

Limited spots. We're opening access in batches to keep quality high.

— BrandOS

P.S. Not ready yet? No worries. You can always re-check your score when you are: brandos.xyz?username=${data.username}

Your brand isn't going anywhere—but your audience might be.`;
  }
};

// =============================================================================
// All Templates Export
// =============================================================================

export const emailSequence: EmailTemplate[] = [
  email1ScoreExplainer,
  email2ClarityFix,
  email3TimeSaver,
  email4UpgradeCTA,
];

// =============================================================================
// Helper: Generate Email Content
// =============================================================================

export function generateEmailContent(
  templateId: string,
  data: EmailTemplateData
): { subject: string; body: string } | null {
  const template = emailSequence.find(t => t.id === templateId);
  if (!template) return null;

  // Pick first subject line (or randomize for A/B testing)
  const subject = template.subjectLines[0]
    .replace('{{score}}', String(data.score))
    .replace('{{username}}', data.username);

  const body = template.body(data);

  return { subject, body };
}

// =============================================================================
// Helper: Get All Emails for a User
// =============================================================================

export function generateAllEmails(data: EmailTemplateData): Array<{
  id: string;
  name: string;
  sendDelay: string;
  subject: string;
  body: string;
}> {
  return emailSequence.map(template => {
    const subject = template.subjectLines[0]
      .replace('{{score}}', String(data.score))
      .replace('{{username}}', data.username);

    return {
      id: template.id,
      name: template.name,
      sendDelay: template.sendDelay,
      subject,
      body: template.body(data),
    };
  });
}




