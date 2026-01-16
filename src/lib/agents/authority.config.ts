// ===== RELIQUE MESSAGING FRAMEWORK =====
// Brand Authority Configuration for Relique RWA Platform

import {
  MessagingFramework,
  EducationalTopic,
  AuthorityPillar,
} from './authority.types';

// ===== MAIN MESSAGING FRAMEWORK =====

export const RELIQUE_MESSAGING_FRAMEWORK: MessagingFramework = {
  // ===== VALUE PILLARS =====
  pillars: {
    security: {
      headline: 'Your cards, professionally protected',
      description:
        'Every card in our vault is stored in climate-controlled, insured facilities with 24/7 monitoring. No more worrying about damage, theft, or degradation.',
      proofPoints: [
        'Climate-controlled vault storage',
        'Full insurance coverage on all items',
        '24/7 security monitoring',
        'Professional handling by certified experts',
        'No shipping risks during trades',
      ],
      emotionalHook: 'Peace of mind knowing your collection is safe',
      keywords: [
        'vault',
        'secure',
        'protected',
        'insured',
        'safe',
        'climate-controlled',
        'professional storage',
      ],
    },
    transparency: {
      headline: 'Every card, every transaction, verified',
      description:
        'Blockchain-powered verification means you can track your cards from authentication to vault to trade. No hidden fees, no mysteries.',
      proofPoints: [
        'On-chain ownership records',
        'Full transaction history',
        'Verified authentication from PSA, BGS, CGC',
        'Real-time vault inventory tracking',
        'Transparent fee structure',
      ],
      emotionalHook: 'Trust without question',
      keywords: [
        'blockchain',
        'verified',
        'transparent',
        'trackable',
        'authenticated',
        'on-chain',
        'proof',
      ],
    },
    liquidity: {
      headline: 'Sell globally, instantly',
      description:
        'Your cards are tradeable 24/7 to buyers worldwide. No waiting for auctions to end, no shipping delays, no geographical limits.',
      proofPoints: [
        '24/7 global marketplace',
        'Instant settlement on trades',
        'No shipping delays or costs',
        'Access to worldwide buyer pool',
        'Fractional ownership options',
      ],
      emotionalHook: 'Freedom to act when opportunity strikes',
      keywords: [
        'instant',
        'global',
        'trade',
        'sell',
        'liquidity',
        '24/7',
        'worldwide',
        'no waiting',
      ],
    },
    authenticity: {
      headline: 'Real cards, real ownership',
      description:
        'Every tokenized card is backed by a real, graded card in our vault. You own the actual card, not just a digital representation.',
      proofPoints: [
        '1:1 backing with physical cards',
        'Redeem your physical card anytime',
        'PSA, BGS, CGC graded cards only',
        'NFT proves ownership, not replaces it',
        'Full provenance tracking',
      ],
      emotionalHook: 'Confidence in every trade',
      keywords: [
        'real',
        'authentic',
        'backed',
        'graded',
        'ownership',
        'physical',
        'redeem',
      ],
    },
  },

  // ===== TARGET AUDIENCES =====
  audiences: {
    collector: {
      name: 'Collectors',
      description:
        'Passionate collectors who care about preservation and building their collection over time',
      primaryValue: 'Protect and preserve your collection',
      painPoints: [
        'Worried about card damage from handling',
        'Concerned about theft or house fires',
        'Shipping anxiety when buying/selling',
        'Limited display options for valuable cards',
        'Difficult to insure home collections',
      ],
      keyMessages: [
        'Your cards deserve professional protection',
        'Never worry about damage or theft again',
        'Build your collection with confidence',
        'Access your cards anytime, virtually or physically',
      ],
      preferredPlatforms: ['twitter', 'instagram', 'youtube'],
      cta: 'Protect your collection today',
    },
    trader: {
      name: 'Traders',
      description:
        'Active traders looking to capitalize on market movements and flip cards for profit',
      primaryValue: 'Trade smarter, faster, globally',
      painPoints: [
        'Limited local market and buyers',
        'eBay fees eating into profits',
        'Shipping delays kill momentum',
        'Missing opportunities while waiting',
        'Trust issues with unknown buyers/sellers',
      ],
      keyMessages: [
        'Trade 24/7 with global buyers',
        'Instant settlement, no shipping waits',
        'Lower fees than traditional platforms',
        'Never miss a market move',
      ],
      preferredPlatforms: ['twitter', 'discord'],
      cta: 'Start trading globally',
    },
    seller: {
      name: 'Sellers & Store Owners',
      description:
        'Card shop owners and high-volume sellers looking to expand their reach',
      primaryValue: 'Turn inventory into 24/7 revenue',
      painPoints: [
        'Unsold inventory tying up capital',
        'Limited to local customer base',
        'Shipping logistics and costs',
        'Managing multiple selling platforms',
        'Price competition from big retailers',
      ],
      keyMessages: [
        'Reach global buyers without shipping hassles',
        'Your inventory works for you 24/7',
        'Focus on sourcing, we handle the rest',
        'Competitive edge through instant liquidity',
      ],
      preferredPlatforms: ['twitter', 'linkedin'],
      cta: 'List your inventory',
    },
  },

  // ===== OBJECTION HANDLING =====
  objections: {
    trust: {
      objection: "How do I know my cards are actually safe? What if you go out of business?",
      shortResponse:
        "Your cards are fully insured and legally yours. If anything happens to us, you still own them and can redeem them.",
      fullResponse:
        "We understand the concern - you're trusting us with valuable assets. Here's how we've addressed this: Every card is fully insured against damage, theft, or loss. Your ownership is recorded on the blockchain, meaning it's legally binding and independent of our company. We use institutional-grade vault facilities that meet museum and bank standards. And if Relique ever ceased operations, you'd have full rights to redeem your physical cards. We've built this system specifically because we're collectors too, and we'd never trust our own cards to anything less.",
      proofPoints: [
        'Full insurance coverage on all vaulted items',
        'Blockchain ownership independent of Relique',
        'Museum-grade vault facilities',
        'Redemption rights guaranteed in terms of service',
        'Regular third-party audits',
      ],
      followUpQuestion:
        'Would you like to see our vault security documentation or insurance certificates?',
    },
    complexity: {
      objection: "I don't understand NFTs/blockchain. This seems complicated.",
      shortResponse:
        "You don't need to understand the tech - it just works. Think of it like how you don't need to know how HTTPS works to shop online safely.",
      fullResponse:
        "The blockchain is just the technology that makes everything secure and transparent - but you don't need to understand it to use Relique. When you vault a card with us, you get a token that proves you own it. That's it. You can trade it, hold it, or redeem the physical card whenever you want. No crypto wallets required, no gas fees to worry about, no technical knowledge needed. We've built Relique so that the technology disappears into the background, and you just focus on your cards.",
      proofPoints: [
        'No crypto wallet required',
        'No gas fees or blockchain complexity',
        'Simple buy/sell/trade interface',
        'Phone and email support for any questions',
        'Physical redemption is straightforward',
      ],
      followUpQuestion:
        'Would you like a quick walkthrough of how trading works on our platform?',
    },
    value: {
      objection: "Why wouldn't I just sell on eBay? Or keep my cards at home?",
      shortResponse:
        "eBay takes 13%+, shipping is risky, and your cards at home aren't insured or earning. Relique offers lower fees, zero shipping risk, and global access.",
      fullResponse:
        "Great question - eBay works for many people. But consider: eBay takes 13%+ in fees, plus PayPal fees. Shipping is risky and expensive for valuable cards. Your buyer pool is limited by shipping costs and trust issues. And your cards at home aren't professionally stored or insured. With Relique, you pay lower fees, eliminate shipping entirely, access global buyers 24/7, and your cards are professionally vaulted and insured. For high-value cards especially, the math works out significantly better - plus the peace of mind.",
      proofPoints: [
        'Lower total fees than eBay + PayPal',
        'Zero shipping risk or cost',
        '24/7 global buyer access vs auction timing',
        'Professional storage and insurance included',
        'Instant settlement vs waiting for payments',
      ],
      followUpQuestion:
        'Want to see a side-by-side comparison of selling a $500 card on eBay vs Relique?',
    },
    control: {
      objection: "What if I want my card back? I don't want to give up my cards.",
      shortResponse:
        "You can redeem your physical card anytime. It's always yours - we're just protecting it for you.",
      fullResponse:
        "Your cards never stop being yours. When you vault with Relique, we're essentially providing professional storage and a marketplace - but ownership stays with you. Anytime you want your physical card back, you simply request redemption, and we ship it to you (insured, of course). Many collectors use us for cards they want to trade, while keeping personal collection pieces at home. It's not all-or-nothing - you choose what works for your collection.",
      proofPoints: [
        'Redeem physical cards anytime',
        'No lock-up periods or restrictions',
        'Insured shipping for redemptions',
        'Partial vaulting - keep some cards at home',
        'Full ownership rights always maintained',
      ],
      followUpQuestion:
        'Would you like to know more about our redemption process?',
    },
  },

  // ===== COMPETITOR POSITIONING =====
  competitors: {
    ebay: {
      name: 'eBay',
      type: 'traditional',
      ourAdvantage: [
        'Lower total fees',
        'No shipping risk',
        'Instant settlement',
        '24/7 trading vs auction timing',
        'Professional storage included',
      ],
      theirWeakness: [
        '13%+ fees plus PayPal',
        'Shipping damage risk',
        'Waiting for auctions to end',
        'Scams and trust issues',
        'No storage solution',
      ],
      positioningStatement:
        'eBay revolutionized online card sales, but it was built for a pre-digital era. Relique is what eBay would be if it was built today - instant, global, and risk-free.',
      comparisonPoints: [
        { feature: 'Fees', us: '~8%', them: '13%+ plus PayPal' },
        { feature: 'Shipping', us: 'None required', them: 'Risky and expensive' },
        { feature: 'Settlement', us: 'Instant', them: 'Days to weeks' },
        { feature: 'Global access', us: 'Instant worldwide', them: 'Limited by shipping' },
        { feature: 'Storage', us: 'Professional vault included', them: 'DIY' },
      ],
    },
    tcgplayer: {
      name: 'TCGPlayer',
      type: 'traditional',
      ourAdvantage: [
        'Focus on graded/high-value cards',
        'No shipping logistics',
        'Professional storage',
        'Blockchain verification',
        'Global instant access',
      ],
      theirWeakness: [
        'Primarily raw cards',
        'Shipping required for every sale',
        'Seller has storage burden',
        'Limited to traditional markets',
        'No authentication guarantee',
      ],
      positioningStatement:
        "TCGPlayer is great for raw cards and game pieces. Relique is purpose-built for collectors and traders of graded, high-value cards who need professional infrastructure.",
      comparisonPoints: [
        { feature: 'Focus', us: 'Graded collectibles', them: 'Game pieces & raw' },
        { feature: 'Verification', us: 'Blockchain + PSA/BGS', them: 'Seller reputation' },
        { feature: 'Storage', us: 'Professional vault', them: 'Seller responsibility' },
        { feature: 'Shipping', us: 'Eliminated', them: 'Every transaction' },
        { feature: 'Market type', us: 'Investment grade', them: 'Player market' },
      ],
    },
    localshop: {
      name: 'Local Card Shops',
      type: 'traditional',
      ourAdvantage: [
        'Global buyer pool',
        '24/7 availability',
        'No travel required',
        'Better price discovery',
        'Professional storage',
      ],
      theirWeakness: [
        'Limited local buyers',
        'Store hours only',
        'Physical presence required',
        'Prices may not be competitive',
        'No storage service',
      ],
      positioningStatement:
        'Support your local card shop for community and fun - but use Relique when you need to reach serious buyers and get the best prices for your valuable cards.',
      comparisonPoints: [
        { feature: 'Buyer pool', us: 'Global', them: 'Local only' },
        { feature: 'Availability', us: '24/7', them: 'Store hours' },
        { feature: 'Price discovery', us: 'Global market rates', them: 'Local negotiation' },
        { feature: 'Convenience', us: 'From anywhere', them: 'Physical visit' },
        { feature: 'Storage', us: 'Professional vault', them: 'Take home' },
      ],
    },
    courtyard: {
      name: 'Courtyard',
      type: 'rwa',
      ourAdvantage: [
        'Lower fees',
        'More verticals (not just sports)',
        'Better user experience',
        'Faster redemption',
        'Stronger community focus',
      ],
      theirWeakness: [
        'Higher fee structure',
        'Primarily sports cards',
        'Less intuitive interface',
        'Slower processes',
        'Corporate feel',
      ],
      positioningStatement:
        'Courtyard pioneered tokenized cards, but Relique delivers the experience collectors actually want - lower fees, more card types, and a community-first approach.',
      comparisonPoints: [
        { feature: 'Card types', us: 'All TCG + Sports', them: 'Primarily sports' },
        { feature: 'Fees', us: 'Lower', them: 'Higher' },
        { feature: 'Community', us: 'Collector-focused', them: 'Corporate' },
        { feature: 'Redemption', us: 'Fast', them: 'Slower' },
        { feature: 'UX', us: 'Intuitive', them: 'Complex' },
      ],
    },
    alt: {
      name: 'Alt',
      type: 'rwa',
      ourAdvantage: [
        'Broader card selection',
        'More flexible trading',
        'Lower minimum values',
        'Better for pure collectors',
        'Simpler fee structure',
      ],
      theirWeakness: [
        'Investment-heavy focus',
        'Higher value minimums',
        'Less collector-friendly',
        'Complex fee structure',
        'Limited card selection',
      ],
      positioningStatement:
        "Alt treats cards like stocks. Relique treats them like what they are - collectibles that happen to be great investments too.",
      comparisonPoints: [
        { feature: 'Philosophy', us: 'Collectors first', them: 'Investors first' },
        { feature: 'Minimums', us: 'Accessible', them: 'High value only' },
        { feature: 'Selection', us: 'Broad TCG coverage', them: 'Curated picks' },
        { feature: 'Trading', us: 'Flexible', them: 'Structured' },
        { feature: 'Fees', us: 'Simple', them: 'Complex' },
      ],
    },
    dibbs: {
      name: 'Dibbs',
      type: 'rwa',
      ourAdvantage: [
        'Full card ownership',
        'Physical redemption anytime',
        'Not just fractional',
        'Collector experience',
        'Broader marketplace',
      ],
      theirWeakness: [
        'Fractional-only model',
        'No physical redemption',
        'You never own the whole card',
        'Investment product, not collector',
        'Limited to their picks',
      ],
      positioningStatement:
        "Dibbs is great for fractional card investing, but you never actually own a card. Relique lets you own the whole thing - and trade it or redeem it whenever you want.",
      comparisonPoints: [
        { feature: 'Ownership', us: 'Full card', them: 'Fractional only' },
        { feature: 'Redemption', us: 'Anytime', them: 'Not available' },
        { feature: 'Model', us: 'Collector + investor', them: 'Investor only' },
        { feature: 'Selection', us: 'Your cards', them: 'Their picks' },
        { feature: 'Control', us: 'Full', them: 'Limited' },
      ],
    },
  },
};

// ===== EDUCATIONAL CONTENT CONFIGS =====

export const EDUCATIONAL_TOPICS: Record<
  EducationalTopic,
  {
    title: string;
    summary: string;
    targetAudience: ('collector' | 'trader' | 'seller')[];
    relatedPillars: AuthorityPillar[];
    keyPoints: string[];
  }
> = {
  'how-vaulting-works': {
    title: 'How Card Vaulting Works',
    summary:
      'A complete guide to professional card storage and what happens when you vault with Relique',
    targetAudience: ['collector', 'trader', 'seller'],
    relatedPillars: ['security', 'authenticity'],
    keyPoints: [
      'Send your graded card to our vault',
      'We verify authenticity and grade',
      'Card is stored in climate-controlled facility',
      'You receive a token proving ownership',
      'Trade or redeem anytime',
    ],
  },
  'nft-basics': {
    title: 'NFTs for Card Collectors',
    summary:
      "What NFTs actually are and why they matter for collectibles - explained without the hype",
    targetAudience: ['collector'],
    relatedPillars: ['transparency', 'authenticity'],
    keyPoints: [
      'NFT = digital proof of ownership',
      'Not a replacement for your card',
      'Enables instant, trustless trading',
      'Creates permanent ownership record',
      'No crypto knowledge required with Relique',
    ],
  },
  'tokenization-explained': {
    title: 'Card Tokenization Explained',
    summary: 'How physical cards become tradeable digital assets while staying 100% backed',
    targetAudience: ['collector', 'trader'],
    relatedPillars: ['transparency', 'authenticity', 'liquidity'],
    keyPoints: [
      '1:1 backing - every token = one real card',
      'Blockchain records ownership immutably',
      'Trade the token, the card stays safe',
      'Redeem token for physical card anytime',
      'Solves trust problem in card trading',
    ],
  },
  'grading-importance': {
    title: 'Why Grading Matters',
    summary: 'The role of PSA, BGS, and CGC in the Relique ecosystem',
    targetAudience: ['collector', 'trader'],
    relatedPillars: ['authenticity', 'transparency'],
    keyPoints: [
      'Third-party verification of condition',
      'Standardized quality assessment',
      'Protects against counterfeits',
      'Enables confident remote trading',
      'Required for Relique vaulting',
    ],
  },
  'authentication-process': {
    title: 'Our Authentication Process',
    summary: 'How we verify every card that enters the Relique vault',
    targetAudience: ['collector', 'trader', 'seller'],
    relatedPillars: ['authenticity', 'security'],
    keyPoints: [
      'Accept only PSA, BGS, CGC graded cards',
      'Verify slab authenticity on intake',
      'Cross-reference with grading company records',
      'Photo documentation of every card',
      'Reject any suspicious items',
    ],
  },
  'blockchain-transparency': {
    title: 'Blockchain Transparency',
    summary: 'How blockchain technology creates trust in card ownership',
    targetAudience: ['trader'],
    relatedPillars: ['transparency'],
    keyPoints: [
      'Every transaction recorded permanently',
      'Ownership history fully visible',
      'No tampering or falsification possible',
      'Independent of any company',
      'Verifiable by anyone',
    ],
  },
  'instant-liquidity': {
    title: 'Understanding Instant Liquidity',
    summary: 'Why tokenized cards can trade faster than traditional markets',
    targetAudience: ['trader', 'seller'],
    relatedPillars: ['liquidity'],
    keyPoints: [
      'No shipping delays between trades',
      'Settlement in seconds, not days',
      '24/7 global market access',
      'Price discovery from worldwide buyers',
      'Act on market opportunities instantly',
    ],
  },
  'global-marketplace': {
    title: 'The Global Marketplace',
    summary: 'How Relique connects buyers and sellers worldwide',
    targetAudience: ['trader', 'seller'],
    relatedPillars: ['liquidity'],
    keyPoints: [
      'Buyers from every timezone',
      'No shipping barriers to entry',
      'Fair market price discovery',
      'Diverse collector base',
      'Instant cross-border trading',
    ],
  },
};

// ===== AUTHORITY CONTENT TEMPLATES =====

export const AUTHORITY_PROMPTS = {
  thoughtLeadership: `Generate thought leadership content about "{topic}" for Relique, positioned for {audience}.

Key pillars to weave in: {pillars}
Brand voice: Confident but not arrogant. Expert but accessible. Collector-first.

The content should:
- Position Relique as a forward-thinking leader in the space
- Provide genuine value and insight, not just marketing
- Connect the topic to broader trends in collectibles/TCG
- Include a subtle but clear value proposition
- End with engagement or thought-provoking question

Output format:
- Headline (attention-grabbing, not clickbait)
- Body (2-3 paragraphs)
- Key messages (3-5 bullets)
- Suggested CTA
- Hashtags (5-8)`,

  educational: `Create educational content about "{topic}" for {audience} new to Relique.

Educational depth: {depth}
Related pillars: {pillars}

The content should:
- Explain the concept clearly without jargon
- Use analogies collectors will understand
- Address common misconceptions
- Show how Relique makes this easy
- Empower the reader with knowledge

Output format:
- Title
- Learning objectives (3-5)
- Main content (structured with headers)
- Key terms glossary
- Next steps / CTA
- FAQ section (3-5 questions)`,

  competitive: `Create competitive positioning content comparing Relique to {competitor}.

Target audience: {audience}
Tone: Confident but respectful (no mudslinging)

Key differentiators:
{differentiators}

The content should:
- Acknowledge competitor's strengths briefly
- Clearly articulate Relique advantages
- Use specific examples and numbers where possible
- Focus on what matters to this audience
- End with clear reason to choose Relique

Output format:
- Headline
- Opening hook
- Comparison points (feature by feature)
- Key advantage summary
- CTA
- Disclaimer (fair comparison language)`,

  trustBuilding: `Create trust-building content about {trustTopic} for Relique.

Format: {format}
Target audience: {audience}
Focus pillar: {pillar}

The content should:
- Be transparent and specific (no vague claims)
- Include verifiable details where possible
- Address unspoken concerns proactively
- Build confidence through information
- Show we understand collector concerns

Output format:
- Headline
- Opening (acknowledge the concern)
- Detailed explanation
- Proof points (3-5 specific, verifiable)
- Social proof if available
- CTA`,

  objectionHandling: `Create a response to this objection: "{objection}"

Context: {context}
Audience: {audience}
Format: {format}

Response guidelines:
- Acknowledge the concern genuinely
- Don't be defensive
- Provide specific, verifiable information
- Use "we" language to include them
- End with an invitation, not a push

Output format:
- Empathetic opening
- Core response
- Supporting proof points
- Follow-up question or next step`,
};
