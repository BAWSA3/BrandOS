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
  if (indicators.role === 'agency' || indicators.industry === 'agency')
    return 'agency';
  if (indicators.industry === 'ecommerce')
    return 'dtc';
  if (indicators.industry === 'saas' && indicators.companySize !== '1-10')
    return 'b2b-saas';
  if (indicators.role === 'founder' || indicators.companySize === '1-10' || indicators.companySize === '11-50')
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
    "The thing killing your productivity, {{name}}",
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

"brick by brick"`
};

export const startupEmail2BrandDrift: EmailTemplate = {
  id: 'startup-brand-drift',
  name: 'How a Series B fixed brand drift',
  sendDelay: '24h',
  subjectLines: [
    "The 12-marketer problem, {{name}}",
    "Brand drift is killing your fundraise",
    "Why your content looks like 12 different companies",
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

"brick by brick"`
};

export const startupEmail3HeadToSystem: EmailTemplate = {
  id: 'startup-head-to-system',
  name: 'From your head to a system in 48 hours',
  sendDelay: '48h',
  subjectLines: [
    "Your brand doesn't need a 6-week project",
    "48 hours to brand clarity, {{name}}",
    "Skip the brand book nobody reads",
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

"brick by brick"`
};

export const startupEmail4ScaleWithoutDiluting: EmailTemplate = {
  id: 'startup-scale-without-diluting',
  name: 'Scale without diluting',
  sendDelay: '72h',
  subjectLines: [
    "The hiring problem nobody talks about",
    "Every new hire = potential brand drift",
    "Scale your team, keep your brand, {{name}}",
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

P.S. Your archetype is ${data.archetype} ${data.archetypeEmoji} — that's a strong foundation to build on.`
};

// =============================================================================
// DTC E-commerce Sequence (4 emails)
// =============================================================================

export const dtcEmail1OmnichannelGrind: EmailTemplate = {
  id: 'dtc-omnichannel-grind',
  name: 'Same message, 6 platforms, every day',
  sendDelay: 'immediate',
  subjectLines: [
    "The omnichannel content grind, {{name}}",
    "Email, SMS, IG, TikTok, FB... every. single. day.",
    "Your content team is drowning, {{name}}",
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

"brick by brick"`
};

export const dtcEmail2RevisionNightmare: EmailTemplate = {
  id: 'dtc-revision-nightmare',
  name: 'Agencies, freelancers, and the revision nightmare',
  sendDelay: '24h',
  subjectLines: [
    "3.2 rounds of revisions per piece, {{name}}",
    "Your agencies don't get your brand",
    "The $450 revision problem",
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

"brick by brick"`
};

export const dtcEmail3BlackFridayPrep: EmailTemplate = {
  id: 'dtc-black-friday-prep',
  name: 'Black Friday prep without the chaos',
  sendDelay: '48h',
  subjectLines: [
    "200 pieces of content. One consistent brand.",
    "Seasonal content velocity without sacrificing quality",
    "How to win Q4 without burning out your team",
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

"brick by brick"`
};

export const dtcEmail4CreatorBriefing: EmailTemplate = {
  id: 'dtc-creator-briefing',
  name: 'Brief creators with precision',
  sendDelay: '72h',
  subjectLines: [
    "UGC that actually matches your brand",
    "The creator briefing problem, {{name}}",
    "Stop hoping influencers get your vibe",
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

P.S. Turn 1 piece of content into 10 platform-optimized versions. That's the dream, right?`
};

// =============================================================================
// B2B SaaS Sequence (4 emails)
// =============================================================================

export const b2bEmail1TouchpointConfusion: EmailTemplate = {
  id: 'b2b-touchpoint-confusion',
  name: '15 touchpoints. One confused prospect.',
  sendDelay: 'immediate',
  subjectLines: [
    "Your prospect sees 15 pieces before buying, {{name}}",
    "The long sales cycle consistency problem",
    "Content-to-demo disconnect is killing your pipeline",
  ],
  body: (data) => `Hey ${data.name}!

Bawsa here. Quick question: how many pieces of content does your average prospect see before they book a demo?

If you're B2B SaaS, it's probably 15-20. Blog posts. LinkedIn content. Case studies. Product pages. Sales decks.

Now here's the harder question: do all those pieces sound like the same company?

Most don't. Content team says one thing. Product marketing says another. Sales says a third. By the time someone talks to your AE, they're confused about who you actually are.

Your Brand Score is ${data.score}/100. That's your voice. Now imagine every touchpoint in your buyer journey hitting that same bar.

That's the game.

- Bawsa

"brick by brick"`
};

export const b2bEmail2AIQuality: EmailTemplate = {
  id: 'b2b-ai-quality',
  name: 'The CEO wants AI. Your team is scared.',
  sendDelay: '24h',
  subjectLines: [
    "AI content your sales team will actually use",
    "The AI quality problem in B2B, {{name}}",
    "Why your team is scared of AI content",
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

"brick by brick"`
};

export const b2bEmail3GlobalConsistency: EmailTemplate = {
  id: 'b2b-global-consistency',
  name: 'Global consistency without global bottlenecks',
  sendDelay: '48h',
  subjectLines: [
    "EMEA thinks your brand means something different",
    "Same brand. Different continents. Different interpretations.",
    "Regional teams need guardrails, not gatekeepers",
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

"brick by brick"`
};

export const b2bEmail4SourceOfTruth: EmailTemplate = {
  id: 'b2b-source-of-truth',
  name: 'Product marketing + content marketing = one voice',
  sendDelay: '72h',
  subjectLines: [
    "Is your blog contradicting your product page?",
    "The source of truth problem, {{name}}",
    "One brand brain for every department",
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

P.S. The difference between "I think I've seen them before" and "I need to follow this company" is consistency.`
};

// =============================================================================
// Agency Sequence (4 emails)
// =============================================================================

export const agencyEmail1VoiceSwitching: EmailTemplate = {
  id: 'agency-voice-switching',
  name: '5 clients. 5 voices. 1 exhausted team.',
  sendDelay: 'immediate',
  subjectLines: [
    "Voice switching fatigue is killing your margins",
    "5 clients. 5 voices. Every single day.",
    "The multi-client burnout problem, {{name}}",
  ],
  body: (data) => `Hey ${data.name}!

Bawsa here. If you're running an agency, I already know your pain.

Your writers handle 5+ clients. Switching between voices is exhausting. Someone sends content to the wrong client at least once a quarter. (Don't lie, it happens.)

The mental load of "wait, which brand am I right now?" is draining your best people.

What if each client's brand DNA was instantly accessible? One click, and your writer knows exactly what on-brand looks like for that client.

No more guessing. No more voice-switching whiplash. No more embarrassing wrong-client moments.

Your own brand scores ${data.score}/100. Imagine every client hitting that bar too.

- Bawsa

"brick by brick"`
};

export const agencyEmail2RevisionProblem: EmailTemplate = {
  id: 'agency-revision-problem',
  name: 'The $450 revision problem',
  sendDelay: '24h',
  subjectLines: [
    "3.2 rounds of revisions = 75% wasted on rework",
    "Your margins are dying in revision cycles",
    "What if clients approved on the first try, {{name}}",
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

"brick by brick"`
};

export const agencyEmail3ScaleWithoutHeadcount: EmailTemplate = {
  id: 'agency-scale-without-headcount',
  name: 'Scale without scaling headcount',
  sendDelay: '48h',
  subjectLines: [
    "40% more revenue. 0% more headcount.",
    "The agency scaling problem, {{name}}",
    "AI that actually maintains client quality standards",
  ],
  body: (data) => `Hey ${data.name}!

You need to grow revenue 40%. But you can't hire fast enough. (And honestly, good writers are hard to find.)

AI should help, right? But every time your team uses ChatGPT, quality varies wildly. Senior team spends more time editing AI output than creating from scratch.

Here's the difference: AI without brand DNA is chaos. AI WITH brand DNA is scale.

BrandOS embeds each client's Brand DNA into generation. The AI writes like that specific client from the start. Your team reviews output that's already 80% there.

Scale without sacrificing quality. Grow without proportional headcount.

- Bawsa

"brick by brick"`
};

export const agencyEmail4WinPitches: EmailTemplate = {
  id: 'agency-win-pitches',
  name: "Never lose a pitch on 'not understanding our brand'",
  sendDelay: '72h',
  subjectLines: [
    "We went with the agency who 'got' us",
    "The pitch you lost last month, {{name}}",
    "Win pitches with brand intelligence",
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

P.S. You can white-label this for clients too. Just saying.`
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
  'general': emailSequence,
  'startup': startupSequence,
  'dtc': dtcSequence,
  'b2b-saas': b2bSaasSequence,
  'agency': agencySequence,
};

// Get sequence for a segment
export function getEmailSequenceForSegment(segment: Segment): EmailTemplate[] {
  return emailSequencesBySegment[segment] || emailSequence;
}

// All templates combined (for lookup by ID)
export const allEmailTemplates: EmailTemplate[] = [
  ...emailSequence,
  ...startupSequence,
  ...dtcSequence,
  ...b2bSaasSequence,
  ...agencySequence,
];

// =============================================================================
// Helper: Generate Email Content
// =============================================================================

export function generateEmailContent(
  templateId: string,
  data: EmailTemplateData
): { subject: string; body: string } | null {
  const template = allEmailTemplates.find(t => t.id === templateId);
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

  return sequence.map(template => {
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




