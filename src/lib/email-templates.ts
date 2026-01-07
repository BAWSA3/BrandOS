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
  name: 'Thanks for trying BrandOS',
  sendDelay: 'immediate',
  subjectLines: [
    'Thanks for trying BrandOS, {{username}}!',
    'You scored {{score}}/100 — here\'s what\'s next',
    'Hey {{username}}, thanks for checking out BrandOS',
  ],
  body: (data) => {
    return `Hey ${data.name}!

This is Bawsa, the man behind BrandOS. I just wanted to say thank you for trying my first ever vibe coded product. What you just experienced is simply the tip of the iceberg. I have a ton of new ideas I already wanted to implement, but it's important for me to gauge interest at first right?

By the way, you scored ${data.score}/100 on your Brand Score — not bad! Your archetype is ${data.archetype} ${data.archetypeEmoji}

Anyways, expect updates from me and how we can better and improve your brand.

Have a good one!

- Bawsa

"brick by brick"`;
  }
};

// =============================================================================
// Email 2: How to Improve (Clarity Focus)
// =============================================================================

export const email2ClarityFix: EmailTemplate = {
  id: 'clarity-fix',
  name: 'Quick tip for your brand',
  sendDelay: '24h',
  subjectLines: [
    'Quick thought about your brand, {{username}}',
    'Hey {{username}}, one thing I noticed',
    'A small tip that could help your brand',
  ],
  body: (data) => `Hey ${data.name}!

It's Bawsa again. I was thinking about your Brand Score and wanted to share a quick thought.

One thing I've noticed with a lot of creators is that their bio doesn't really tell people what they're about. Like, if someone lands on your profile for the first time, would they instantly get what you do?

Here's a simple format that works:
- What you do
- Who you help
- Something that shows you're legit

Just something to think about. Small tweaks can make a big difference.

Anyway, I'm working on some new features for BrandOS that I think you'll love. Stay tuned!

- Bawsa

"brick by brick"`
};

// =============================================================================
// Email 3: Time-Saving Angle (Overwhelm Focus)
// =============================================================================

export const email3TimeSaver: EmailTemplate = {
  id: 'time-saver',
  name: 'What I\'m building next',
  sendDelay: '48h',
  subjectLines: [
    'What I\'m working on next, {{username}}',
    'Sneak peek at what\'s coming',
    'You\'re gonna love this, {{username}}',
  ],
  body: (data) => `Hey ${data.name}!

Bawsa here. Just wanted to give you a quick update on what I'm cooking up.

So BrandOS right now just shows you your score, right? But I'm working on something way bigger. Imagine being able to:

- Check if your tweets are on-brand before you post
- Get AI rewrites that actually sound like YOU
- Track how consistent your brand is over time

That's the vision. And honestly, I'm building this because I needed it myself. Figuring out your brand is hard, and I want to make it easier for everyone.

You're one of the early people who tried BrandOS, so you'll be first to know when the new stuff drops.

Thanks for being here!

- Bawsa

"brick by brick"`
};

// =============================================================================
// Email 4: Social Proof + Upgrade CTA (Budget Focus)
// =============================================================================

export const email4UpgradeCTA: EmailTemplate = {
  id: 'upgrade-cta',
  name: 'Stay connected',
  sendDelay: '72h',
  subjectLines: [
    'Let\'s stay connected, {{username}}',
    'One last thing from me',
    'Thanks again, {{username}}!',
  ],
  body: (data) => {
    return `Hey ${data.name}!

Last email from me for now, I promise haha.

I just wanted to say thanks again for checking out BrandOS. It means a lot that you took the time to try something I built.

If you want to stay in the loop on updates, new features, or just see what I'm building next, feel free to follow me on X: @baborismus

And hey, if you ever have feedback or ideas for BrandOS, just reply to this email. I read everything and I'm always looking to make this better.

Alright, that's it from me. Go build something great!

- Bawsa

"brick by brick"

P.S. You can always check your brand score again at mybrandos.app`;
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




