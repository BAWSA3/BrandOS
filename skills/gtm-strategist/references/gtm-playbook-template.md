# GTM Tactical Playbook Template

use this structure when producing playbook mode output. this is operator-facing — the person reading it needs to know what to do Monday morning.

---

## header

```
CLIENT: [company name]
GTM MOTION: [PLG / sales-led / community-led / hybrid]
PLAYBOOK PERIOD: [90 days / 6 months / custom]
PRIMARY CHANNEL: [the #1 channel this playbook focuses on]
NORTH STAR: [the single metric we're optimizing for]
OWNER: [who runs this]
```

## sprint format

each week gets a sprint card. the first 12 weeks are the critical path.

### sprint card template

```
═══════════════════════════════════════
WEEK [N]: [THEME NAME]
═══════════════════════════════════════

GOAL: [what success looks like at end of week]

TASKS:
□ [specific action 1] → owner: [who]
□ [specific action 2] → owner: [who]
□ [specific action 3] → owner: [who]

METRICS TO HIT:
- [metric]: [target number]
- [metric]: [target number]

DELIVERABLES:
- [tangible output 1]
- [tangible output 2]

DEPENDENCIES:
- [what needs to be done before this week starts]

NOTES:
[any context, warnings, or tips for execution]
═══════════════════════════════════════
```

## phase 1: foundation (weeks 1-4)

the first month is about setting up the infrastructure to execute. no scaling yet.

**week 1: positioning & messaging lock**
- finalize positioning statement and messaging hierarchy
- create the core pitch (30 sec, 2 min, 10 min versions)
- align team on ICP definition and disqualifiers
- set up tracking/analytics for funnel metrics
- deliverable: messaging doc + analytics dashboard

**week 2: channel infrastructure**
- set up primary channel (whatever was selected in the strategy)
- create landing page / signup flow / demo booking flow
- build the first content assets or outbound sequences
- set up CRM pipeline stages matching the funnel
- deliverable: live channel + pipeline in CRM

**week 3: first experiments**
- launch 3-5 small experiments across the primary channel
- test messaging variants (lead with different value props)
- start measuring: what's the response rate / click rate / conversion?
- document everything — what worked, what didn't, early signals
- deliverable: experiment log with initial data

**week 4: first iteration**
- analyze week 3 data — what messaging resonated? what channel variant worked?
- kill the bottom performers, double down on top performers
- refine the ICP if early data suggests a different buyer than expected
- set month 2 targets based on real data (not projections)
- deliverable: month 1 retrospective + month 2 plan

## phase 2: traction (weeks 5-8)

the second month is about finding what works and doing more of it.

**week 5-6: scale what works**
- take the winning experiments from phase 1 and increase volume
- add secondary channel if primary is showing diminishing returns
- start building content/assets for the next stage of the funnel
- focus on activation — are the people coming in actually converting?

**week 7-8: optimize the funnel**
- audit drop-off at each stage: acquisition → activation → retention → revenue
- fix the biggest leak first
- implement the first retention mechanic (email sequence, feature prompt, check-in)
- start measuring LTV signals (are customers expanding or churning?)

## phase 3: scale decision (weeks 9-12)

the third month determines whether to scale, pivot, or iterate.

**week 9-10: validate unit economics**
- calculate actual CAC by channel
- estimate LTV based on retention data so far
- model: can we 3x spend and maintain CAC?
- identify: what's the constraint to scale? (budget, team, content, product?)

**week 11-12: scale or pivot**
- if unit economics work: create the scaling plan (budget, hiring, automation)
- if they don't: diagnose why and propose adjustments (new channel, new ICP, new messaging, product changes)
- document the full playbook as a repeatable process
- deliverable: 90-day retrospective + next quarter plan

## channel-specific tactic cards

for each channel in the strategy, create a tactic card:

### tactic card template

```
CHANNEL: [channel name]
────────────────────────────
TACTIC: [specific tactic within the channel]
GOAL: [what this tactic achieves]
AUDIENCE: [who this targets]

EXECUTION:
1. [step 1 — specific action]
2. [step 2]
3. [step 3]

COPY/MESSAGING:
- headline: "[example headline]"
- hook: "[example opening line]"
- CTA: "[example call to action]"

TOOLS NEEDED:
- [tool 1] — [what for]
- [tool 2] — [what for]

BUDGET: $[amount] / [period]
EXPECTED RESULT: [metric] = [target]
TIME TO RESULTS: [days/weeks]

ITERATION PLAN:
- test: [what to A/B test first]
- optimize: [what to optimize after initial data]
- scale trigger: [when to increase budget/effort]
────────────────────────────
```

## copy & messaging frameworks

### headline formulas

**problem-agitation:**
"tired of [frustration]? [product] [solves it in specific way]."

**outcome-first:**
"[desirable outcome] in [timeframe]. without [common objection]."

**social proof:**
"[X customers/users] use [product] to [outcome]. here's why."

**curiosity gap:**
"the [approach/method] that [impressive claim]. [qualifier]."

### email sequence frameworks

**cold outbound (sales-led):**
1. email 1 — the trigger (reference a specific event: funding, hiring, product launch)
2. email 2 — the insight (share something they don't know about their market/problem)
3. email 3 — the proof (case study or data point from a similar company)
4. email 4 — the breakup (last chance, low pressure)

**nurture sequence (content/community-led):**
1. welcome — set expectations, deliver first value immediately
2. quick win — teach them something useful in under 2 minutes
3. deeper value — longer content that demonstrates expertise
4. social proof — case study or testimonial
5. soft CTA — "when you're ready, here's how we can help"

**activation sequence (PLG):**
1. welcome — "here's how to get started in 2 minutes"
2. aha moment push — "have you tried [core feature]? here's why it matters"
3. progress nudge — "you're [X]% of the way to [milestone]"
4. upgrade trigger — "[feature/limit] unlocks when you upgrade"

## tool stack recommendations

### early stage (pre-revenue to $100K ARR)

| Function | Tool | Why |
|----------|------|-----|
| CRM | HubSpot Free / Attio | free tier, sufficient for early pipeline |
| Email | Loops / Resend | developer-friendly, affordable |
| Analytics | Mixpanel / PostHog | event-based, free tier |
| Landing pages | existing site or Framer | don't over-invest in tooling yet |
| Content | Typefully / Buffer | schedule and publish from one place |
| Automation | Zapier / Make | connect tools without engineering time |

### growth stage ($100K - $1M ARR)

| Function | Tool | Why |
|----------|------|-----|
| CRM | HubSpot Starter / Attio | pipeline management, basic automation |
| Email | Customer.io / Loops | behavioral email, segmentation |
| Analytics | Amplitude / Mixpanel | cohort analysis, funnel tracking |
| ABM (if sales-led) | Apollo / Clay | outbound, enrichment |
| Content | Webflow + CMS | SEO-ready, scalable content |
| Attribution | UTM discipline + PostHog | know where revenue comes from |

### scale stage ($1M+ ARR)

| Function | Tool | Why |
|----------|------|-----|
| CRM | Salesforce / HubSpot Pro | enterprise pipeline, forecasting |
| Marketing automation | HubSpot / Marketo | lifecycle marketing at scale |
| Analytics | Amplitude + Looker/Mode | deep analysis + dashboards |
| ABM | 6sense / Demandbase | intent data, account scoring |
| Content | headless CMS + custom | full control, personalization |
| Attribution | HockeyStack / Dreamdata | multi-touch attribution |

## budget allocation templates

### PLG motion (first 90 days)

```
total budget: $[X]

product & engineering:  40%  — activation flow, onboarding, viral mechanics
content & SEO:          25%  — organic acquisition, education content
paid acquisition:       15%  — test channels, validate CAC
community:              10%  — early user community, feedback loops
tools & infrastructure:  10%  — analytics, email, CRM
```

### sales-led motion (first 90 days)

```
total budget: $[X]

sales team:             35%  — SDR/AE hiring or time allocation
content & collateral:   20%  — case studies, decks, one-pagers
outbound tooling:       15%  — ABM, enrichment, sequencing tools
events & partnerships:  15%  — conferences, webinars, partner programs
paid demand gen:        10%  — LinkedIn ads, retargeting, content promotion
tools & infrastructure:   5%  — CRM, analytics
```

### community/content-led motion (first 90 days)

```
total budget: $[X]

content creation:       35%  — blog, video, podcast, social content
community platform:     15%  — Discord/Slack setup, moderation, events
SEO & distribution:     15%  — keyword strategy, link building, syndication
paid amplification:     15%  — promote top content, retarget engaged audience
email/nurture:          10%  — newsletter, drip sequences
tools & infrastructure:  10%  — CMS, analytics, email platform
```

## KPI targets with leading/lagging mapping

| KPI (Lagging) | Target | Leading Indicator | Why It Predicts |
|---------------|--------|-------------------|-----------------|
| MRR | $[X] | Qualified pipeline value | pipeline predicts revenue 30-60 days out |
| Paid customers | [X] | Activated users / qualified leads | activation predicts conversion |
| Retention (month 3) | [X]% | Week 1 engagement depth | early engagement predicts long-term retention |
| CAC | <$[X] | Cost per qualified lead | CPQL is the controllable input to CAC |
| NPS | >[X] | Support ticket resolution time | fast resolution correlates with satisfaction |

→ track leading indicators weekly. track lagging indicators monthly. don't panic about lagging indicators in month 1 — the leading indicators will tell you if you're on track.
