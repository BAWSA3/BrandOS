# BrandOS — Research & Product Backlog

> Generated: 2026-02-11 | Revisit and prioritize before building

---

## Part 1: Market Research (AI + Branding)

### Market Size
- AI SaaS market: $71.5B (2024) → $775B by 2032 (38% CAGR)
- AI branding specifically: $2.86B (2024) → $3.29B (2025), growing 14.8%/yr
- Brand consistency increases revenue by 10-33% (Lucidpress research)
- 88% of marketers plan to consolidate their tool stack (Gartner)

### Core Market Pain Point
Brand voice is fracturing at scale. As companies adopt AI content tools across channels, consistency breaks down. 77% of consumers can identify AI-generated content, 68% trust it less. When the same brand sounds formal in help docs, playful in email, and generic in chat — trust erodes.

### Competitive Landscape

| Category | Players | Notes |
|---|---|---|
| Logo/Visual Identity | uBrand, Brandmark, Looka | Commoditized, race to bottom |
| AI Copywriting | Jasper, Copy.ai | Generic output, weak brand memory |
| Brand Governance | BrandGuard (brandguard.ai), Frontify | Enterprise-only, expensive, rigid |
| Brand Tracking | Sprout Social, BERA, Tracksuit | Measurement only, no action |
| AI Visibility Tracking | LLM Pulse, Otterly | New category — how brands appear in ChatGPT/Perplexity |
| Brand Intelligence | brand.ai | Closest to "Brand OS" concept |

### Key Insight
**Nobody owns the unified "Brand OS" category.** Existing tools are fragmented — one for logos, one for copy, one for tracking, one for governance. The white space is a single source of truth that understands your brand deeply and governs every output across every channel.

### Emerging Trend: AI Visibility
Brands now need to track how they show up in ChatGPT, Perplexity, and Gemini — not just Google. LLM trackers are the new SEO rank trackers.

---

## Part 2: What We've Built (Current State Audit)

### Working Features
- **Multi-brand management** — full CRUD, switching, persistence (Zustand + Prisma)
- **8-step onboarding wizard** — Swiss design, spring animations, templates
- **Brand Score** — weighted completeness scoring across 7 dimensions (name 15%, colors 15%, tone 15%, keywords 15%, do-patterns 15%, don't-patterns 10%, voice samples 15%)
- **Content Check (Claude AI)** — analyze content alignment against brand DNA
- **Content Generation (Claude AI)** — 3 variations, on-brand output
- **Tone Analysis (Claude AI)** — real-time, 4-axis gradient sliders
- **Competitor Analysis (Claude AI)** — voice comparison
- **Image Analysis (Claude AI)** — vision-based brand alignment
- **Visual Generation (Gemini)** — images, patterns, colors, animations, UI styles
- **5-phase navigation** — Home → Define → Check → Generate → Scale
- **Analytics dashboard** — checks count, generations count, avg score, history chart
- **Export & sharing** — JSON, PDF, share links
- **Team collaboration** — view/edit permissions, team brands
- **X Brand Score lead magnet** — 3D DNA visualization, profile analysis
- **Auth** — Supabase + X OAuth, Inner Circle invite system
- **Research agent system** — multi-vertical trend monitoring
- **6 specialized AI agents** — analytics, authority, campaign, content, research, orchestrator
- **Brand Memory Timeline** — track successes, failures, experiments
- **Safe Zones** — mark elements as locked, flexible, or experimental
- **Design Intent Blocks** — natural language design directives
- **Taste Translation** — convert abstract feedback into actionable rules
- **Platform-specific rules** — different tone/length constraints per platform

### Tech Stack
Next.js 16, React 19, Prisma + PostgreSQL, Supabase Auth, Zustand, Motion/Framer Motion, Three.js + R3F, React Flow, GSAP, Anthropic Claude API, Google Gemini API, Resend, Sentry, Vercel Analytics

---

## Part 3: Gap Analysis

### Where We're Ahead
1. **Structured Brand DNA** — competitors treat brand voice as a text blob; we have multi-dimensional identity (tone sliders, keywords, do/don't patterns, voice samples, safe zones, design intents)
2. **Unified Check → Generate → Scale pipeline** — Jasper generates, BrandGuard checks, Sprout tracks; we do all three
3. **Multi-agent AI architecture** — 6 specialized agents with orchestrator, more sophisticated than anything in the SMB space

### Where the Gaps Are

#### Gap 1: Brand Score = Completeness, Not Health
- **Current:** "You've filled in 80% of your profile" (static, one-time)
- **Needed:** "Your brand voice is 73% consistent across 4 channels" (dynamic, ongoing)
- **Impact:** This is the #1 unlock for daily retention

#### Gap 2: No Live Channel Integration
- Users manually paste content to check
- Market wants automatic monitoring across channels
- Missing: X/Twitter feed auto-analysis, LinkedIn monitoring, email scanning, website crawling, Slack auditing

#### Gap 3: No AI Visibility Tracking
- Hottest emerging category — how do LLMs describe your brand?
- Natural extension of the X Brand Score lead magnet
- Differentiator vs. every competitor

#### Gap 4: No "Guardian" Layer (Push-Based Protection)
- Current Check phase is pull-based (user initiates)
- Market wants push-based: auto-flag off-brand content before publish
- BrandGuard charges enterprise prices for just this one feature
- Opportunity: API/plugin (Chrome extension, Slack bot, Notion plugin)

#### Gap 5: Positioning Ambiguity (Personal vs. Company Brand)
- X OAuth + lead magnet = personal branding signals
- Team features + multi-brand = company branding signals
- Founder personal branding is faster-growing, easier-to-sell niche
- **Recommendation: Position as personal brand OS for founders/creators first**

---

## Part 4: Product Roadmap (Proposed)

### Phase 1 — Sharpen the Wedge (Ship Next)
- [ ] Evolve Brand Score from completeness → live brand health (analyze actual published content)
- [ ] Connect X/Twitter API to auto-pull posts and score them against brand DNA
- [ ] Add "Brand Consistency Over Time" chart (analytics infra already exists)
- [ ] Clear positioning: personal brand OS for founders/creators

### Phase 2 — The Sticky Loop
- [ ] Weekly brand health reports (email digest via Resend)
- [ ] AI Visibility Score — how LLMs describe your brand
- [ ] "Brand Drift Alerts" — notifications when content goes off-brand
- [ ] Public brand score badge (shareable, viral)

### Phase 3 — The Platform Play
- [ ] Brand Guardian API — Chrome extension, Slack bot, Notion plugin
- [ ] Multi-channel ingestion (LinkedIn, newsletter, website)
- [ ] Team guardrails — drafts require brand score > threshold before publishing
- [ ] Agency mode — manage multiple client brands

### Revenue Model
- Free: Brand audit tool (lead gen, viral)
- $49/mo: Core Brand OS (define, check, generate)
- $149/mo: Pro (live monitoring, health score, AI visibility, alerts)
- $299/mo: Team/Agency (multi-brand, guardrails, collaboration)

---

## Part 5: Product Ideas (Standalone or Integrated)

1. **Brand OS** — Unified brand intelligence platform (what we're building)
2. **AI Brand Score Dashboard** — Real-time brand health across channels + LLM visibility
3. **Brand Voice Guardian API** — Lightweight middleware between AI tools and output
4. **Personal Brand AI for Founders** — One content piece → consistent output across all platforms
5. **Free Brand Audit Tool** — Paste URL → get brand consistency score + fixes (acquisition funnel)

### Recommended Strategy
Free Brand Audit (acquisition) → Brand Score hooks them → Brand OS subscription retains them

---

## Key Sources
- [Avintiv Media — AI Branding Tools 2025](https://avintivmedia.com/blog/ai-branding-tools-2025/)
- [Ad Times — Scaling Brand Voice with AI](https://ad-times.com/scaling-brand-voice-ai/)
- [CMSWire — Brand Voice in the AI Era](https://www.cmswire.com/customer-experience/your-brand-has-a-voice-does-your-ai/)
- [brand.ai — AI for Brand Management](https://brand.ai/)
- [Frontify — AI for Brand Management](https://www.frontify.com/en/guide/ai-for-brand-management)
- [SaaStorm — LLM Performance Tracking 2026](https://saastorm.io/blog/top-llm-performance-tracking-software/)
- [BrandGuard AI](https://www.brandguard.ai/)
- [Marketing Dive — 2026 Predictions](https://www.marketingdive.com/news/marketing-predictions-for-2026/809124/)
- [Verified Market Research — AI SaaS Market](https://www.verifiedmarketresearch.com/product/artificial-intelligence-saas-market/)
- [Medium — Founder Personal Branding 2026](https://medium.com/marketing-fundamentals/best-ai-tool-for-founder-personal-branding-in-2026-d79df04bddc3)
- [BetterCloud — AI and SaaS 2026](https://www.bettercloud.com/monitor/saas-industry/)
