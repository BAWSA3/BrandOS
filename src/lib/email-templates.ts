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
 * - archetype: "SOURCE", "RELAY", etc.
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
  scoreCardImage?: string;
  // Data-driven analysis fields
  defineInsights: string[];
  checkInsights: string[];
  generateInsights: string[];
  scaleInsights: string[];
  summary: string;
  topImprovements: string[];
  topStrengths: string[];
  voiceConsistency?: number;
  bestContentFormat?: string;
  contentPillars?: { name: string; frequency: number }[];
  // Content-derived identity fields
  identitySignature?: string;
  contentPillarNames?: string[];
  topicConcentration?: number;
  audienceSignal?: string;
  // Archetype visual
  archetypeIconUrl?: string;
  // Post diagnosis - specific examples of good/bad posts tied to score dimensions
  postDiagnosis?: {
    strongPosts: { text: string; metrics: { likes: number; retweets: number; replies: number }; why: string; dimension: string }[];
    weakPosts: { text: string; metrics: { likes: number; retweets: number; replies: number }; why: string; fix: string; dimension: string }[];
    brandStrengths: { strength: string; why: string; evidence: string }[];
    brandWeaknesses: { weakness: string; why: string; steps: string[] }[];
    overallDiagnosis: string;
  } | null;
}

// =============================================================================
// Segment Types
// =============================================================================

export type Segment = 'startup' | 'dtc' | 'b2b-saas' | 'agency' | 'general';

export interface SegmentIndicators {
  role: 'founder' | 'marketer' | 'agency' | 'other';
  companySize: '1-10' | '11-50' | '51-200' | '201+';
  industry: 'ecommerce' | 'saas' | 'agency' | 'other';
}

export function detectSegment(indicators: SegmentIndicators): Segment {
  if (indicators.role === 'agency' || indicators.industry === 'agency') return 'agency';
  if (indicators.industry === 'ecommerce') return 'dtc';
  if (indicators.industry === 'saas' && indicators.companySize !== '1-10') return 'b2b-saas';
  if (
    indicators.role === 'founder' ||
    indicators.companySize === '1-10' ||
    indicators.companySize === '11-50'
  )
    return 'startup';
  return 'general';
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

/** Strip prompt instruction fragments that sometimes leak through LLM output */
function sanitizeAIText(text: string): string {
  const leakPatterns = [
    /Sentence \d+:\s*/gi,
    /Point out ONE specific\b[^.]*?[.:]\s*/gi,
    /Be direct about what'?s holding them back[.:]\s*/gi,
    /Give ONE concrete,? actionable step\b[^.]*?[.:]\s*/gi,
    /Structure your \d+ sentences exactly like this[.:]\s*/gi,
    /Write in second person\b[^.]*?\.\s*/gi,
    /A positive observation about their\b[^.]*?[.:]\s*/gi,
    /Reference their actual content patterns[^.]*?\.\s*/gi,
    /No quotes around the response\.?\s*/gi,
  ];

  let cleaned = text;
  for (const pattern of leakPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  return cleaned.replace(/ {2,}/g, ' ').trim();
}

function getScoreMessage(score: number): { intro: string; advice: string } {
  if (score >= 80) {
    return {
      intro: `That's EXCELLENT. You're in the top 15% of creators we've analyzed. Your brand is already working for you.

But even strong brands have room to grow.`,
      advice: `Here's your biggest opportunity:`,
    };
  }
  if (score >= 60) {
    return {
      intro: `That's SOLID—you're doing better than most. But here's the thing: the difference between a 70 and an 85 isn't just 15 points. It's the difference between "I think I've seen them before" and "I need to follow this person."`,
      advice: `Your biggest opportunity right now:`,
    };
  }
  return {
    intro: `Real talk: there's work to do. But that's not a bad thing—it means there's upside.

81% of people need to trust a brand before engaging with it. Right now, your profile might be creating friction you don't even know about.`,
    advice: `The good news? Your biggest fix is simple:`,
  };
}

// =============================================================================
// Launch Announcement Email (Manual Send)
// =============================================================================

export const launchAnnouncementEmail: EmailTemplate = {
  id: 'launch-announcement',
  name: 'BrandOS Public Launch Announcement',
  sendDelay: 'manual', // Not part of auto sequence
  subjectLines: [
    'BrandOS is live. Discover your Brand DNA.',
    "It's here, {{name}}. BrandOS just launched.",
    'You got early access. Now everyone can see what you discovered.',
  ],
  body: (data) => `Hey ${data.name}!

Big news: BrandOS is officially live.

You were one of the first to discover your Brand DNA. Now the world can too.

Your stats:
→ Brand DNA Score: ${data.score}/100
→ Archetype: ${data.archetype} ${data.archetypeEmoji}

Here's what's new since you last visited:
→ Shareable score cards (flex your archetype)
→ 5 AI agents trained on YOUR Brand DNA
→ Archetype evolution tracking

As an Inner Circle member, you have Founding Member status forever. That means free access to features we'll charge for later.

Share your score card and let's make some noise: mybrandos.app

Thanks for being early.

- Bawsa

"brick by brick"

P.S. Know someone who needs to discover their Brand DNA? Send them to mybrandos.app`,
};

// =============================================================================
// Email 1: Your Score + What It Means
// =============================================================================

export const email1ScoreExplainer: EmailTemplate = {
  id: 'score-explainer',
  name: 'Your Brand Breakdown',
  sendDelay: 'immediate',
  subjectLines: [
    'Your brand breakdown is here, @{{username}}',
    '@{{username}}, your Brand Score: {{score}}/100',
    'Your brand breakdown — {{score}}/100',
  ],
  body: (data) => {
    const defineInsights = (data.defineInsights || []).map((i) => `→ ${i}`).join('\n');
    const checkInsights = (data.checkInsights || []).map((i) => `→ ${i}`).join('\n');
    const generateInsights = (data.generateInsights || []).map((i) => `→ ${i}`).join('\n');
    const scaleInsights = (data.scaleInsights || []).map((i) => `→ ${i}`).join('\n');

    const voiceLine =
      data.voiceConsistency != null ? `\n→ Voice Consistency Score: ${data.voiceConsistency}%` : '';

    const contentExtras: string[] = [];
    if (data.bestContentFormat) {
      contentExtras.push(`→ Best Performing Format: ${data.bestContentFormat}`);
    }
    if (data.contentPillars && data.contentPillars.length > 0) {
      contentExtras.push(`→ Content Pillars: ${data.contentPillars.map((p) => p.name).join(', ')}`);
    }
    const contentExtrasStr = contentExtras.length > 0 ? '\n' + contentExtras.join('\n') : '';

    const strengths = (data.topStrengths || (data.topStrength ? [data.topStrength] : []))
      .map((s) => `→ ${s}`)
      .join('\n');
    const improvements = (
      data.topImprovements || (data.topImprovement ? [data.topImprovement] : [])
    )
      .map((i) => `→ ${i}`)
      .join('\n');

    const summaryBlock = data.summary ? `\n${sanitizeAIText(data.summary)}\n` : '';

    // Build post diagnosis section (the new personalized content)
    const diagnosis = data.postDiagnosis;
    let postDiagnosisBlock = '';

    const dimensionLabels: Record<string, string> = {
      identity: 'IDENTITY',
      consistency: 'CONSISTENCY',
      content: 'CONTENT',
      growth: 'GROWTH',
    };

    const dimensionScores: Record<string, number> = {
      identity: data.defineScore,
      consistency: data.checkScore,
      content: data.generateScore,
      growth: data.scaleScore,
    };

    if (diagnosis && (diagnosis.weakPosts?.length || diagnosis.strongPosts?.length)) {
      const formatPost = (p: { text: string; metrics: { likes: number; retweets: number; replies: number }; dimension?: string }) => {
        const truncated = p.text.length > 180 ? p.text.substring(0, 180) + '...' : p.text;
        return `"${truncated}"
→ ${p.metrics.likes} likes | ${p.metrics.retweets} RTs | ${p.metrics.replies} replies`;
      };

      // Group posts by dimension for the score breakdown
      const dimensions = ['identity', 'consistency', 'content', 'growth'] as const;
      const dimensionSections = dimensions.map((dim) => {
        const strong = (diagnosis.strongPosts || []).filter((p) => p.dimension === dim);
        const weak = (diagnosis.weakPosts || []).filter((p) => p.dimension === dim);
        if (strong.length === 0 && weak.length === 0) return '';

        let section = `**${dimensionLabels[dim]} (${dimensionScores[dim]}/100)**\n`;

        for (const p of strong.slice(0, 2)) {
          section += `\n✓ This post HELPED your score:\n${formatPost(p)}\n→ ${sanitizeAIText(p.why)}\n`;
        }
        for (const p of weak.slice(0, 2)) {
          section += `\n✗ This post HURT your score:\n${formatPost(p)}\n→ ${sanitizeAIText(p.why)}\n→ Fix: ${sanitizeAIText(p.fix)}\n`;
        }

        return section;
      }).filter(Boolean).join('\n');

      // Brand strengths section
      const brandStrengthsSection = (diagnosis.brandStrengths || [])
        .slice(0, 3)
        .map(
          (s) =>
            `✓ ${sanitizeAIText(s.strength)}
→ Why it matters: ${sanitizeAIText(s.why)}
→ Evidence: ${sanitizeAIText(s.evidence)}`
        )
        .join('\n\n');

      // Brand weaknesses section with action steps
      const brandWeaknessesSection = (diagnosis.brandWeaknesses || [])
        .slice(0, 3)
        .map(
          (w) =>
            `✗ ${sanitizeAIText(w.weakness)}
→ Why it's hurting you: ${sanitizeAIText(w.why)}
→ How to fix it:
${(w.steps || []).map((step) => `  ${step}`).join('\n')}`
        )
        .join('\n\n');

      postDiagnosisBlock = `
We analyzed your recent posts to show you exactly how we got to your score. Here's the evidence:

${dimensionSections}
${brandStrengthsSection ? `
**WHAT'S STRONG ABOUT YOUR BRAND**

${brandStrengthsSection}
` : ''}${brandWeaknessesSection ? `
**WHAT'S WEAK ABOUT YOUR BRAND**

${brandWeaknessesSection}
` : ''}
**THE BOTTOM LINE**

${sanitizeAIText(diagnosis.overallDiagnosis)}
`;
    }

    return `Hey @${data.username}!

Bawsa here. Thanks for signing up for early access on BrandOS. I don't just want to give you a score — I want to show you exactly what's strong, what's weak, and how to fix it. Everything below is backed by your actual posts.

Let's get into it.

{{SCORE_CARD_IMAGE}}

**YOUR BRAND SCORE: ${data.score}/100**
${postDiagnosisBlock || `
We analyzed your profile and content across 4 dimensions. Here's what we found:

→ Identity: ${data.defineScore}/100${data.identitySignature ? ` — Known for: ${data.identitySignature}` : ''}
→ Consistency: ${data.checkScore}/100${data.voiceConsistency != null ? ` — Voice consistency: ${data.voiceConsistency}%` : ''}
→ Content: ${data.generateScore}/100${data.bestContentFormat ? ` — Best format: ${data.bestContentFormat}` : ''}
→ Growth: ${data.scaleScore}/100
`}
**WHAT TO FIX FIRST**
${improvements || "→ Keep creating — we'll identify opportunities as your brand grows"}

${data.archetypeIconUrl ? `{{ARCHETYPE_IMAGE:${data.archetypeIconUrl}}}` : ''}

**YOUR ARCHETYPE: ${data.archetype}**
${data.archetypeTagline ? `"${data.archetypeTagline}"` : ''}
${sanitizeAIText(data.archetypeDescription) || 'A unique brand identity we detected from your content.'}
${summaryBlock}
This is just the start — BrandOS is building something much bigger. Expect updates from me on how we can better improve your brand.

- Bawsa

"brick by brick"

P.S. Want to check another handle? Head back to mybrandos.app`;
  },
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

"brick by brick"`,
};

// =============================================================================
// Email 3: Time-Saving Angle (Overwhelm Focus)
// =============================================================================

export const email3TimeSaver: EmailTemplate = {
  id: 'time-saver',
  name: "What I'm building next",
  sendDelay: '48h',
  subjectLines: [
    "What I'm working on next, {{username}}",
    "Sneak peek at what's coming",
    "You're gonna love this, {{username}}",
  ],
  body: (data) => `Hey ${data.name}!

Bawsa here. Just wanted to give you a quick update on what I'm cooking up.

So BrandOS right now just shows you your score, right? But I'm working on something way bigger. Imagine being able to:

- Check if your tweets are on-brand before you post
- Get evidence-backed suggestions that sharpen your voice without replacing it
- Track how consistent your brand is over time

That's the vision. And honestly, I'm building this because I needed it myself. Figuring out your brand is hard, and I want to make it easier for everyone.

You're one of the early people who tried BrandOS, so you'll be first to know when the new stuff drops.

Thanks for being here!

- Bawsa

"brick by brick"`,
};

// =============================================================================
// Email 4: Social Proof + Upgrade CTA (Budget Focus)
// =============================================================================

export const email4UpgradeCTA: EmailTemplate = {
  id: 'upgrade-cta',
  name: 'Your brand deserves more than a free scan',
  sendDelay: '72h',
  subjectLines: [
    'your ${data.phases?.define?.score || "brand"} score doesn\'t have to stay there',
    "here's the tool that fixes what your scan found",
    '${data.name}, ready to fix what we found?',
  ],
  body: (data) => {
    const weakestPhase = ['define', 'check', 'generate', 'scale'].reduce((a, b) => {
      const phases = data as any;
      return (phases[a + 'Score'] || 50) < (phases[b + 'Score'] || 50) ? a : b;
    });

    const featureMap: Record<string, string> = {
      define: 'Voice Fingerprint — maps your unique voice DNA and catches drift',
      check: 'AI Agents — audit every post against your brand DNA before publishing',
      generate: 'Content Engine — generates on-brand posts, threads, and campaigns at scale',
      scale: 'Growth Plan — expand your reach while keeping your voice intact',
    };

    return `Hey ${data.name}!

Remember your Brand Score of ${data.score}? Here's something most people miss:

The scan shows you *what's wrong*. But fixing it requires the right tools.

Your weakest area was ${weakestPhase.toUpperCase()} — and the tool built specifically for that is:

→ ${featureMap[weakestPhase] || featureMap.define}

This is part of BrandOS Pro ($29/mo), which also includes:
• Voice Fingerprint
• AI Agents
• Content Engine & Calendar
• Conductor (AI orchestration)
• Growth Plan

Every feature is designed to move the specific scores we showed you in your scan.

🔗 Upgrade to Pro: https://mybrandos.app/pricing

14-day money-back guarantee. Cancel anytime.

If you have any questions, just reply to this email — I read everything.

- Bawsa

P.S. Early adopters lock in their rate forever, even as we add features and raise prices.`;
  },
};

// =============================================================================
// SEGMENT-SPECIFIC SEQUENCES
// =============================================================================

// =============================================================================
// Startup Founder Sequence (4 emails)
// =============================================================================

export const startupEmail1FounderBottleneck: EmailTemplate = {
  id: 'startup-founder-bottleneck',
  name: 'The founder bottleneck is real',
  sendDelay: 'immediate',
  subjectLines: [
    "You're probably the brand police right now, {{name}}",
    'The thing killing your productivity, {{name}}',
    "10 hours/week on brand reviews? Let's fix that",
  ],
  body: (data) => `Hey ${data.name}!

Bawsa here. I built BrandOS because I was living the same nightmare you probably are.

Every piece of content. Every tweet. Every slide deck. It all had to go through ME because no one else "got" the brand. I was spending 10+ hours a week just being the brand police.

Sound familiar?

Here's the thing: that bottleneck isn't about your team being bad. It's about your brand living in your head instead of in a system.

Your Brand Score of ${data.score}/100 tells me you've got something real. Now imagine if your entire team could create content that scores that high — without asking you first.

That's what we're building here.

More on that tomorrow.

- Bawsa

"brick by brick"`,
};

export const startupEmail2BrandDrift: EmailTemplate = {
  id: 'startup-brand-drift',
  name: 'How a Series B fixed brand drift',
  sendDelay: '24h',
  subjectLines: [
    'The 12-marketer problem, {{name}}',
    'Brand drift is killing your fundraise',
    'Why your content looks like 12 different companies',
  ],
  body: (data) => `Hey ${data.name}!

Quick story: talked to a Series B founder last month. 12 marketers. Content everywhere. But every piece looked like a different company.

Their investors noticed. "Your messaging is inconsistent" was actual feedback in their board deck.

The fix wasn't more brand guidelines. (Nobody reads those anyway.)

The fix was making brand enforcement automatic:
→ Upload your brand DNA once
→ Every piece of content gets scored
→ Team learns what "on-brand" actually means

No more bottleneck. No more brand police duty. No more "can you review this real quick?"

If you're prepping for a round, this is the kind of thing investors notice. Consistency = maturity.

Want to see how it works? Reply to this email. Happy to walk you through it.

- Bawsa

"brick by brick"`,
};

export const startupEmail3HeadToSystem: EmailTemplate = {
  id: 'startup-head-to-system',
  name: 'From your head to a system in 48 hours',
  sendDelay: '48h',
  subjectLines: [
    "Your brand doesn't need a 6-week project",
    '48 hours to brand clarity, {{name}}',
    'Skip the brand book nobody reads',
  ],
  body: (data) => `Hey ${data.name}!

I've seen founders spend $50K on brand agencies. 6-week projects. 80-page PDFs that sit in a Google Drive folder collecting dust.

You don't need that.

Here's what you actually need:
→ Your colors and tone defined (you have this already)
→ 3-5 "do this" patterns
→ 3-5 "never do this" patterns
→ A few examples of content that WORKS

That's it. That's your Brand DNA.

BrandOS turns that into a living system that scores every piece of content before it goes out. No 6-week project. No $50K agency. Just clarity.

You're already at ${data.score}/100. Let's get your whole team there.

- Bawsa

"brick by brick"`,
};

export const startupEmail4ScaleWithoutDiluting: EmailTemplate = {
  id: 'startup-scale-without-diluting',
  name: 'Scale without diluting',
  sendDelay: '72h',
  subjectLines: [
    'The hiring problem nobody talks about',
    'Every new hire = potential brand drift',
    'Scale your team, keep your brand, {{name}}',
  ],
  body: (data) => `Hey ${data.name}!

Last email in this series, promise.

Here's the thing about scaling: every new hire is a potential source of brand drift. Not because they're bad — because they interpret your brand differently.

By the time you have 10 marketers, you have 10 different versions of your brand.

BrandOS fixes this by making your brand DNA the source of truth. New hire on day one? They check their content against your brand. Scores 85+? Good to go. Below that? They get specific feedback on what to fix.

You stop being the bottleneck. Your team stops guessing. Your brand stays consistent.

If you're ready to stop being the brand police, reply to this email. I'll show you how to set it up.

Go build something great.

- Bawsa

"brick by brick"

P.S. Your archetype is ${data.archetype} ${data.archetypeEmoji} — that's a strong foundation to build on.`,
};

// =============================================================================
// DTC E-commerce Sequence (4 emails)
// =============================================================================

export const dtcEmail1OmnichannelGrind: EmailTemplate = {
  id: 'dtc-omnichannel-grind',
  name: 'Same message, 6 platforms, every day',
  sendDelay: 'immediate',
  subjectLines: [
    'The omnichannel content grind, {{name}}',
    'Email, SMS, IG, TikTok, FB... every. single. day.',
    'Your content team is drowning, {{name}}',
  ],
  body: (data) => `Hey ${data.name}!

Bawsa here. Let me guess your day:

→ Write something for email
→ Reformat for Instagram
→ Trim for Twitter
→ Make it casual for TikTok
→ Professional version for LinkedIn
→ Oh and SMS needs a version too

Same message. 6 different formats. Every single day.

Your Brand Score is ${data.score}/100 — which means you've got a strong voice. But translating that voice across every channel? That's where things break down.

What if one piece of content automatically became 6 platform-optimized versions? Same brand. Same voice. Different formats.

That's what we're building.

More tomorrow.

- Bawsa

"brick by brick"`,
};

export const dtcEmail2RevisionNightmare: EmailTemplate = {
  id: 'dtc-revision-nightmare',
  name: 'Agencies, freelancers, and the revision nightmare',
  sendDelay: '24h',
  subjectLines: [
    '3.2 rounds of revisions per piece, {{name}}',
    "Your agencies don't get your brand",
    'The $450 revision problem',
  ],
  body: (data) => `Hey ${data.name}!

Quick math: if you're paying agencies $600 per deliverable and averaging 3+ rounds of revisions at $150/hour...

You're spending $450 on revisions. 75% of the deliverable cost. Just to get it "on-brand."

The problem isn't your agencies. It's that "on-brand" is subjective. Everyone interprets it differently.

BrandOS fixes this:
→ Define your brand DNA once
→ Share it with every agency and freelancer
→ They check their work before sending it to you
→ Only content that scores 80+ lands in your inbox

Fewer revision cycles. Better first drafts. Less "this doesn't feel right" feedback loops.

Your brand is already strong at ${data.score}/100. Now imagine every external partner hitting that bar on the first try.

- Bawsa

"brick by brick"`,
};

export const dtcEmail3BlackFridayPrep: EmailTemplate = {
  id: 'dtc-black-friday-prep',
  name: 'Black Friday prep without the chaos',
  sendDelay: '48h',
  subjectLines: [
    '200 pieces of content. One consistent brand.',
    'Seasonal content velocity without sacrificing quality',
    'How to win Q4 without burning out your team',
  ],
  body: (data) => `Hey ${data.name}!

Black Friday prep. Prime Day. Holiday campaigns.

200+ pieces of content. Different channels. Different formats. Different creators.

The brands that win Q4 aren't just fast. They're fast AND consistent. Same voice across every touchpoint. Same brand DNA in every piece.

Most teams sacrifice quality for velocity. Or velocity for quality. You shouldn't have to choose.

Here's the play:
→ Brand DNA as the foundation
→ AI that generates on-brand content at scale
→ Scoring that catches off-brand content before it goes live

Volume without dilution. Speed without sacrifice.

You're at ${data.score}/100. Let's keep that bar even during the chaos of peak season.

- Bawsa

"brick by brick"`,
};

export const dtcEmail4CreatorBriefing: EmailTemplate = {
  id: 'dtc-creator-briefing',
  name: 'Brief creators with precision',
  sendDelay: '72h',
  subjectLines: [
    'UGC that actually matches your brand',
    'The creator briefing problem, {{name}}',
    'Stop hoping influencers get your vibe',
  ],
  body: (data) => `Hey ${data.name}!

Last one, promise.

You love creator content. Authentic. Engaging. Converts like crazy.

But it never quite matches your brand. The tone is off. The messaging is close but not right. You can't tell creators exactly what you want because... how do you explain "vibe"?

BrandOS turns your brand DNA into something concrete:
→ Specific tone guidelines (not just "be friendly")
→ Do/don't patterns creators can actually follow
→ Examples of what on-brand looks like

Brief creators with precision. Get UGC that matches your brand. Stop hoping and start knowing.

Reply if you want to see how to set this up for your creator program.

Go crush it.

- Bawsa

"brick by brick"

P.S. Turn 1 piece of content into 10 platform-optimized versions. That's the dream, right?`,
};

// =============================================================================
// B2B SaaS Sequence (4 emails)
// =============================================================================

export const b2bEmail1TouchpointConfusion: EmailTemplate = {
  id: 'b2b-touchpoint-confusion',
  name: '15 touchpoints. One confused prospect.',
  sendDelay: 'immediate',
  subjectLines: [
    'Your prospect sees 15 pieces before buying, {{name}}',
    'The long sales cycle consistency problem',
    'Content-to-demo disconnect is killing your pipeline',
  ],
  body: (data) => `Hey ${data.name}!

Bawsa here. Quick question: how many pieces of content does your average prospect see before they book a demo?

If you're B2B SaaS, it's probably 15-20. Blog posts. LinkedIn content. Case studies. Product pages. Sales decks.

Now here's the harder question: do all those pieces sound like the same company?

Most don't. Content team says one thing. Product marketing says another. Sales says a third. By the time someone talks to your AE, they're confused about who you actually are.

Your Brand Score is ${data.score}/100. That's your voice. Now imagine every touchpoint in your buyer journey hitting that same bar.

That's the game.

- Bawsa

"brick by brick"`,
};

export const b2bEmail2AIQuality: EmailTemplate = {
  id: 'b2b-ai-quality',
  name: 'The CEO wants AI. Your team is scared.',
  sendDelay: '24h',
  subjectLines: [
    'AI content your sales team will actually use',
    'The AI quality problem in B2B, {{name}}',
    'Why your team is scared of AI content',
  ],
  body: (data) => `Hey ${data.name}!

Let me guess: your CEO is pushing AI adoption. Efficiency. Scale. All that.

But your content team is worried. And honestly? They should be.

Generic AI content sounds like... generic AI content. Your prospects can tell. Your sales team won't use it. It hurts more than it helps.

The problem isn't AI. It's that AI without brand DNA is just noise.

BrandOS embeds your brand at the generation stage — not as a post-processing step. The AI doesn't write generic content then try to "make it on-brand." It writes on-brand from the start.

That's AI content your sales team will actually forward to prospects.

Your brand is at ${data.score}/100. Let's make sure your AI content hits that bar too.

- Bawsa

"brick by brick"`,
};

export const b2bEmail3GlobalConsistency: EmailTemplate = {
  id: 'b2b-global-consistency',
  name: 'Global consistency without global bottlenecks',
  sendDelay: '48h',
  subjectLines: [
    'EMEA thinks your brand means something different',
    'Same brand. Different continents. Different interpretations.',
    'Regional teams need guardrails, not gatekeepers',
  ],
  body: (data) => `Hey ${data.name}!

If you're in multiple regions, you've probably noticed: EMEA interprets your brand differently than US. APAC has their own version. Everyone's on-brand in their own heads.

The traditional fix? More centralized review. More bottlenecks. Slower time-to-market.

Better fix: guardrails, not gatekeepers.

→ Define brand DNA once
→ Regional teams check their content against it
→ Automated scoring tells them if they're on-brand
→ Only off-brand content needs central review

You keep consistency without becoming the blocker. Local teams stay fast. Everyone stays aligned.

One brand brain for every region.

- Bawsa

"brick by brick"`,
};

export const b2bEmail4SourceOfTruth: EmailTemplate = {
  id: 'b2b-source-of-truth',
  name: 'Product marketing + content marketing = one voice',
  sendDelay: '72h',
  subjectLines: [
    'Is your blog contradicting your product page?',
    'The source of truth problem, {{name}}',
    'One brand brain for every department',
  ],
  body: (data) => `Hey ${data.name}!

Final email in this series.

Here's a question: if I read your blog, then your product page, then your sales deck, then a case study... would they all sound like the same company?

For most B2B SaaS, the answer is "kind of." Product messaging says one thing. Thought leadership says another. Customer success has their own interpretation.

There's no single source of truth.

BrandOS becomes that source of truth. Every team. Every piece of content. Same Brand DNA. Same scoring system. Same bar.

Your ${data.archetype} ${data.archetypeEmoji} archetype is a strong foundation. Now let's make sure every department is building on it.

Reply if you want to see how this works for multi-team orgs.

- Bawsa

"brick by brick"

P.S. The difference between "I think I've seen them before" and "I need to follow this company" is consistency.`,
};

// =============================================================================
// Agency Sequence (4 emails)
// =============================================================================

export const agencyEmail1VoiceSwitching: EmailTemplate = {
  id: 'agency-voice-switching',
  name: '5 clients. 5 voices. 1 exhausted team.',
  sendDelay: 'immediate',
  subjectLines: [
    'Voice switching fatigue is killing your margins',
    '5 clients. 5 voices. Every single day.',
    'The multi-client burnout problem, {{name}}',
  ],
  body: (data) => `Hey ${data.name}!

Bawsa here. If you're running an agency, I already know your pain.

Your writers handle 5+ clients. Switching between voices is exhausting. Someone sends content to the wrong client at least once a quarter. (Don't lie, it happens.)

The mental load of "wait, which brand am I right now?" is draining your best people.

What if each client's brand DNA was instantly accessible? One click, and your writer knows exactly what on-brand looks like for that client.

No more guessing. No more voice-switching whiplash. No more embarrassing wrong-client moments.

Your own brand scores ${data.score}/100. Imagine every client hitting that bar too.

- Bawsa

"brick by brick"`,
};

export const agencyEmail2RevisionProblem: EmailTemplate = {
  id: 'agency-revision-problem',
  name: 'The $450 revision problem',
  sendDelay: '24h',
  subjectLines: [
    '3.2 rounds of revisions = 75% wasted on rework',
    'Your margins are dying in revision cycles',
    'What if clients approved on the first try, {{name}}',
  ],
  body: (data) => `Hey ${data.name}!

Let's do the math:
→ Average deliverable: $600
→ Average revision rounds: 3.2
→ Cost per revision round: $150

That's $450 in revisions. On a $600 deliverable. You're making $150 actual profit.

The problem? "On-brand" is subjective. Your team thinks it's right. Client thinks it's wrong. Three rounds later, you've eaten your margin.

BrandOS fix:
→ Upload each client's Brand DNA
→ Team checks content before submitting
→ Only content scoring 80+ goes to client
→ First drafts that actually get approved

Cut revision cycles by 60%. Get first-draft approvals. Protect your margins.

- Bawsa

"brick by brick"`,
};

export const agencyEmail3ScaleWithoutHeadcount: EmailTemplate = {
  id: 'agency-scale-without-headcount',
  name: 'Scale without scaling headcount',
  sendDelay: '48h',
  subjectLines: [
    '40% more revenue. 0% more headcount.',
    'The agency scaling problem, {{name}}',
    'AI that actually maintains client quality standards',
  ],
  body: (data) => `Hey ${data.name}!

You need to grow revenue 40%. But you can't hire fast enough. (And honestly, good writers are hard to find.)

AI should help, right? But every time your team uses ChatGPT, quality varies wildly. Senior team spends more time editing AI output than creating from scratch.

Here's the difference: AI without brand DNA is chaos. AI WITH brand DNA is scale.

BrandOS embeds each client's Brand DNA into generation. The AI writes like that specific client from the start. Your team reviews output that's already 80% there.

Scale without sacrificing quality. Grow without proportional headcount.

- Bawsa

"brick by brick"`,
};

export const agencyEmail4WinPitches: EmailTemplate = {
  id: 'agency-win-pitches',
  name: "Never lose a pitch on 'not understanding our brand'",
  sendDelay: '72h',
  subjectLines: [
    "We went with the agency who 'got' us",
    'The pitch you lost last month, {{name}}',
    'Win pitches with brand intelligence',
  ],
  body: (data) => `Hey ${data.name}!

Last email, promise.

You've lost pitches before. Not because your work was bad. Because the prospect said "they just didn't get our brand."

What if you could show prospective clients that you LITERALLY have a system for getting their brand?

"Here's how we'll onboard your Brand DNA. Here's how every piece of content will be scored against your standards. Here's how we guarantee consistency."

That's a different pitch. That's a winning pitch.

Every client's brand DNA, instantly accessible to your entire team. That's the agency edge in 2025.

Reply if you want to see how to set this up.

Go win some pitches.

- Bawsa

"brick by brick"

P.S. You can white-label this for clients too. Just saying.`,
};

// =============================================================================
// All Templates Export
// =============================================================================

// Default/General sequence
export const emailSequence: EmailTemplate[] = [
  email1ScoreExplainer,
  email2ClarityFix,
  email3TimeSaver,
  email4UpgradeCTA,
];

// Startup Founder sequence
export const startupSequence: EmailTemplate[] = [
  startupEmail1FounderBottleneck,
  startupEmail2BrandDrift,
  startupEmail3HeadToSystem,
  startupEmail4ScaleWithoutDiluting,
];

// DTC E-commerce sequence
export const dtcSequence: EmailTemplate[] = [
  dtcEmail1OmnichannelGrind,
  dtcEmail2RevisionNightmare,
  dtcEmail3BlackFridayPrep,
  dtcEmail4CreatorBriefing,
];

// B2B SaaS sequence
export const b2bSaasSequence: EmailTemplate[] = [
  b2bEmail1TouchpointConfusion,
  b2bEmail2AIQuality,
  b2bEmail3GlobalConsistency,
  b2bEmail4SourceOfTruth,
];

// Agency sequence
export const agencySequence: EmailTemplate[] = [
  agencyEmail1VoiceSwitching,
  agencyEmail2RevisionProblem,
  agencyEmail3ScaleWithoutHeadcount,
  agencyEmail4WinPitches,
];

// All sequences by segment
export const emailSequencesBySegment: Record<Segment, EmailTemplate[]> = {
  general: emailSequence,
  startup: startupSequence,
  dtc: dtcSequence,
  'b2b-saas': b2bSaasSequence,
  agency: agencySequence,
};

// Get sequence for a segment
export function getEmailSequenceForSegment(segment: Segment): EmailTemplate[] {
  return emailSequencesBySegment[segment] || emailSequence;
}

// =============================================================================
// Evolution Path Email (Archetype Scan — "What can I evolve to?" hook)
// =============================================================================

const EVOLUTION_ARCHETYPE_DATA: Record<string, { emoji: string; tagline: string; tier: number; tierLabel: string; color: string }> = {
  ARC: { emoji: '🐕', tagline: 'Rising star. Growth story.', tier: 1, tierLabel: 'ENTRY', color: '#10B981' },
  ENTROPY: { emoji: '🎰', tagline: 'Risk-taker. Cult builder.', tier: 2, tierLabel: 'RISING', color: '#F59E0B' },
  NULL: { emoji: '👻', tagline: 'Ideas over identity.', tier: 2, tierLabel: 'RISING', color: '#8B5CF6' },
  FREQ: { emoji: '🎪', tagline: 'Entertainer. Community builder.', tier: 2, tierLabel: 'RISING', color: '#EC4899' },
  RELAY: { emoji: '🔌', tagline: 'Super connector.', tier: 3, tierLabel: 'ADVANCED', color: '#06B6D4' },
  'BUILD.EXE': { emoji: '🚢', tagline: 'Builder. Shipper. Doer.', tier: 3, tierLabel: 'ADVANCED', color: '#EF4444' },
  SOURCE: { emoji: '🎓', tagline: 'Knowledge authority.', tier: 4, tierLabel: 'EXPERT', color: '#3B82F6' },
  FORESIGHT: { emoji: '🔮', tagline: 'Shapes the narrative.', tier: 5, tierLabel: 'PEAK', color: '#9D4EDD' },
};

const EVOLUTION_PATHS: Record<string, string[]> = {
  ARC: ['ENTROPY', 'NULL', 'FREQ', 'RELAY', 'BUILD.EXE', 'SOURCE', 'FORESIGHT'],
  ENTROPY: ['BUILD.EXE', 'FORESIGHT'],
  NULL: ['FORESIGHT', 'SOURCE'],
  FREQ: ['RELAY', 'FORESIGHT'],
  RELAY: ['FORESIGHT', 'SOURCE'],
  'BUILD.EXE': ['SOURCE', 'FORESIGHT'],
  SOURCE: [],
  FORESIGHT: [],
};

export const evolutionPathEmail: EmailTemplate = {
  id: 'evolution-path',
  name: 'Your Evolution Path',
  sendDelay: 'immediate',
  subjectLines: [
    "Here's your evolution path, @{{username}} →",
    'Your archetype can evolve. Here\'s how.',
  ],
  body: (data: EmailTemplateData) => {
    const archetype = data.archetype || 'ARC';
    const currentData = EVOLUTION_ARCHETYPE_DATA[archetype] || EVOLUTION_ARCHETYPE_DATA['ARC'];
    const paths = EVOLUTION_PATHS[archetype] || [];
    const isTerminal = paths.length === 0;

    const evolutionRows = paths
      .slice(0, 4)
      .map((p) => {
        const d = EVOLUTION_ARCHETYPE_DATA[p];
        if (!d) return '';
        return `
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #1a1a1a;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">${d.emoji}</span>
                <div>
                  <div style="font-family: 'Inter', sans-serif; font-weight: 800; font-style: italic; color: ${d.color}; font-size: 14px;">${p}</div>
                  <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #666; letter-spacing: 0.1em;">TIER ${d.tier} — ${d.tierLabel}</div>
                </div>
              </div>
              <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: #888; margin-top: 4px;">${d.tagline}</div>
            </td>
          </tr>`;
      })
      .join('');

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 24px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.2em; color: #444; margin-bottom: 8px;">BRANDOS // EVOLUTION PATH</div>
      <div style="width: 40px; height: 1px; background: #333; margin: 0 auto;"></div>
    </div>

    <!-- Current Archetype -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.15em; color: ${currentData.color}; border: 1px solid ${currentData.color}40; display: inline-block; padding: 3px 10px; margin-bottom: 16px;">TIER ${currentData.tier} — ${currentData.tierLabel}</div>
      ${data.archetypeIconUrl ? `<div style="margin: 16px auto;"><img src="${data.archetypeIconUrl}" alt="${archetype}" width="100" height="100" style="display: block; margin: 0 auto;" /></div>` : ''}
      <div style="font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 900; font-style: italic; color: ${currentData.color}; margin-bottom: 4px;">${archetype}</div>
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #888;">"${data.archetypeTagline || currentData.tagline}"</div>
    </div>

    <!-- Your Strengths -->
    ${data.archetypeStrengths && data.archetypeStrengths.length > 0 ? `
    <div style="margin-bottom: 32px;">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.15em; color: #555; margin-bottom: 12px;">YOUR STRENGTHS</div>
      ${data.archetypeStrengths.map((s) => `<div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #888; margin-bottom: 6px;"><span style="color: ${currentData.color};">▸</span> ${s}</div>`).join('')}
    </div>
    ` : ''}

    <!-- Divider -->
    <div style="width: 60px; height: 1px; background: #222; margin: 0 auto 32px;"></div>

    ${isTerminal ? `
    <!-- Terminal Archetype Message -->
    <div style="background: #111; border: 1px solid #222; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 32px;">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.15em; color: ${currentData.color}; margin-bottom: 12px;">PEAK ARCHETYPE</div>
      <div style="font-family: 'Inter', sans-serif; font-size: 14px; color: #aaa; line-height: 1.6;">
        You've reached ${archetype} — a terminal archetype. This is the peak of the evolution tree. You don't evolve further — you set the standard others evolve toward.
      </div>
    </div>
    ` : `
    <!-- Evolution Paths -->
    <div style="margin-bottom: 32px;">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.15em; color: #555; margin-bottom: 16px; text-align: center;">YOUR POSSIBLE EVOLUTIONS</div>
      <table style="width: 100%; border-collapse: collapse; background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; overflow: hidden;">
        ${evolutionRows}
      </table>
    </div>

    <!-- How Evolution Works -->
    <div style="background: #111; border: 1px solid #222; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.15em; color: #555; margin-bottom: 12px;">HOW EVOLUTION WORKS</div>
      <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: #888; line-height: 1.6;">
        <div style="margin-bottom: 8px;"><span style="color: ${currentData.color};">01.</span> Keep scanning your brand regularly</div>
        <div style="margin-bottom: 8px;"><span style="color: ${currentData.color};">02.</span> Improve your brand score by 15+ points</div>
        <div style="margin-bottom: 8px;"><span style="color: ${currentData.color};">03.</span> Let your content evolve naturally over 30+ days</div>
        <div><span style="color: ${currentData.color};">04.</span> Your archetype upgrades when you earn it</div>
      </div>
    </div>
    `}

    <!-- CTA -->
    <div style="text-align: center; margin-bottom: 40px;">
      <a href="https://mybrandos.app/archetype" style="display: inline-block; padding: 14px 28px; background: ${currentData.color}; color: #fff; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-decoration: none; border-radius: 4px;">TRACK YOUR EVOLUTION →</a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; border-top: 1px solid #1a1a1a; padding-top: 24px;">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #333;">BRANDOS — Your brand, quantified.</div>
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #222; margin-top: 8px;">mybrandos.app</div>
    </div>

  </div>
</body>
</html>`;
  },
};

// Manual/one-off email templates (not in auto sequences)
export const manualEmailTemplates: EmailTemplate[] = [launchAnnouncementEmail, evolutionPathEmail];

// All templates combined (for lookup by ID)
export const allEmailTemplates: EmailTemplate[] = [
  ...emailSequence,
  ...startupSequence,
  ...dtcSequence,
  ...b2bSaasSequence,
  ...agencySequence,
  ...manualEmailTemplates,
];

// =============================================================================
// Helper: Generate Email Content
// =============================================================================

export function generateEmailContent(
  templateId: string,
  data: EmailTemplateData
): { subject: string; body: string } | null {
  const template = allEmailTemplates.find((t) => t.id === templateId);
  if (!template) return null;

  // Pick first subject line (or randomize for A/B testing)
  const subject = template.subjectLines[0]
    .replace('{{score}}', String(data.score))
    .replace('{{username}}', data.username)
    .replace('{{name}}', data.name);

  const body = template.body(data);

  return { subject, body };
}

// =============================================================================
// Helper: Get All Emails for a User (by segment)
// =============================================================================

export function generateAllEmails(
  data: EmailTemplateData,
  segment: Segment = 'general'
): Array<{
  id: string;
  name: string;
  sendDelay: string;
  subject: string;
  body: string;
}> {
  const sequence = getEmailSequenceForSegment(segment);

  return sequence.map((template) => {
    const subject = template.subjectLines[0]
      .replace('{{score}}', String(data.score))
      .replace('{{username}}', data.username)
      .replace('{{name}}', data.name);

    return {
      id: template.id,
      name: template.name,
      sendDelay: template.sendDelay,
      subject,
      body: template.body(data),
    };
  });
}
