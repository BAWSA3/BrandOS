# AARRR / Pirate Metrics Framework

## core concept

every product has a lifecycle funnel. pirate metrics (AARRR) maps it into 5 stages. the strategic value isn't knowing the stages — it's diagnosing which stage is leaking and fixing that first.

most companies try to grow by pouring more traffic into a broken funnel. the right move is almost always to fix the funnel before scaling the top.

## the five stages

### 1. acquisition — "how do users find us?"

the top of the funnel. how people first encounter your product.

**channels:**
- organic search (SEO, content marketing)
- paid acquisition (ads, sponsorships)
- social/viral (word of mouth, referrals, social sharing)
- partnerships (co-marketing, integrations, channel partners)
- direct/brand (type-in traffic, PR, events)

**key metrics:**
- visitors / impressions by channel
- cost per visitor by channel
- channel mix (% from each source)

**diagnostic questions:**
- which channel drives the most qualified traffic (not just volume)?
- what's the CAC by channel? which channels are actually efficient?
- is there any organic/viral acquisition or is it 100% paid?
- what's the content-to-traffic ratio? (are you creating content that compounds?)

**common failure modes:**
- over-indexing on one channel (channel risk)
- optimizing for volume instead of quality (vanity metrics)
- no attribution — can't tell which channel drives real revenue
- spending on awareness before the funnel converts

### 2. activation — "do users have a great first experience?"

the moment a user goes from "signed up" to "gets it." this is the most underrated stage. a 10% improvement in activation often beats a 50% increase in traffic.

**key concept: aha moment**
the specific action that correlates with long-term retention. not the same as "completed onboarding."

| Product | Aha Moment |
|---------|-----------|
| Slack | 2,000 messages sent by team |
| Dropbox | 1 file saved to folder |
| Facebook | 7 friends in 10 days |
| Zoom | First successful call |

**key metrics:**
- signup-to-activation rate
- time-to-value (how long from signup to aha moment)
- onboarding completion rate
- feature adoption rate (first session)

**diagnostic questions:**
- what's your aha moment? have you validated it with data?
- what % of signups reach the aha moment? (< 25% = major problem)
- how long does it take? (> 1 day for self-serve = too long)
- what are the top 3 reasons users drop off before activation?
- is the onboarding experience self-serve or does it require human help?

**common failure modes:**
- no defined aha moment — onboarding is a feature tour, not a value experience
- time-to-value is too long — users quit before seeing the payoff
- too many steps before the first win
- asking for too much info at signup (email + password + company + role + phone = death)

### 3. retention — "do users come back?"

the only metric that proves product-market fit. if users don't come back, nothing else matters.

**retention curves:**
- **bad:** curve drops to 0% — no PMF
- **okay:** curve flattens at 5-15% — some PMF, needs work
- **good:** curve flattens at 20-40% — solid PMF
- **great:** curve flattens above 40% — strong PMF, ready to scale

**key metrics:**
- day 1 / day 7 / day 30 retention rates
- weekly or monthly active users (WAU/MAU)
- DAU/MAU ratio (engagement intensity)
- cohort retention curves (are newer cohorts retaining better?)
- resurrection rate (users who come back after going dormant)

**diagnostic questions:**
- what does the retention curve look like? does it flatten or go to zero?
- what's the natural usage frequency? (daily tool vs. monthly service)
- what brings users back? (notification, habit, need, workflow integration)
- are newer cohorts retaining better than older ones? (product improving?)
- what's the #1 reason users churn?

**common failure modes:**
- scaling acquisition before retention flattens (pouring into leaky bucket)
- measuring MAU without looking at the curve shape
- not segmenting retention by cohort, channel, or ICP
- confusing contractual retention (annual plans) with true engagement

### 4. revenue — "do users pay?"

monetization. where the business model meets user behavior.

**key metrics:**
- free-to-paid conversion rate
- ARPU (average revenue per user)
- LTV (lifetime value)
- MRR / ARR growth rate
- expansion revenue (upsells, cross-sells)
- net dollar retention (NDR)

**diagnostic questions:**
- what's the pricing model? (freemium, free trial, contact sales, usage-based)
- what triggers the upgrade? (feature gate, usage limit, seat limit, value realization)
- what's the free-to-paid conversion rate? (benchmark: 2-5% freemium, 15-25% free trial)
- what's the LTV:CAC ratio? (target: 3:1 minimum, 5:1+ means you can spend more)
- is there expansion revenue? what drives it?

**common failure modes:**
- pricing too low (leaving money on table, attracting wrong customers)
- pricing too high for the self-serve motion (killing PLG)
- monetization wall at the wrong moment (before value, after habit)
- no expansion path (flat ARPU over time)

### 5. referral — "do users tell others?"

the viral and word-of-mouth layer. the cheapest acquisition channel if it works.

**viral coefficient (k-factor):**
k = (invites per user) × (conversion rate of invites)
- k < 0.5 = weak virality, need other channels
- k = 0.5-1.0 = meaningful word-of-mouth, amplifies paid
- k > 1.0 = true virality, exponential growth (rare and usually temporary)

**key metrics:**
- NPS (net promoter score)
- referral rate (% of users who refer)
- viral coefficient
- time to refer (how quickly after activation)
- referral channel (where do they share — email, social, word of mouth?)

**diagnostic questions:**
- do users talk about the product organically? where?
- is there a referral program? what's the incentive structure?
- is the product shareable by nature? (collaborative tools, content creation, social features)
- what's the NPS? (> 50 = strong referral potential, < 30 = fix the product first)

**common failure modes:**
- building a referral program before the product is worth referring
- wrong incentive (cash for a product people already love = wasted money)
- no natural sharing mechanic in the product
- referral program too complex or hidden

## funnel math template

use this to model the full funnel and identify the biggest lever:

```
visitors/mo:        ______ (acquisition)
  → signup rate:    ______% → signups: ______
  → activation:    ______% → activated: ______
  → retention (M1): ______% → retained: ______
  → paid conversion: ______% → customers: ______
  → avg revenue:   $______ → MRR: $______
  → referral rate:  ______% → referred visitors: ______

LTV = avg revenue × avg lifetime months = $______
CAC = total spend / new customers = $______
LTV:CAC = ______
Payback period = CAC / avg monthly revenue = ______ months
```

→ model the current state, then model what happens if you 2x each row. the row with the biggest revenue impact is where you focus.

## the leaky bucket diagnosis

when a client says "we need more growth," run this diagnostic:

1. **plot the current funnel with real numbers** (or best estimates)
2. **identify the biggest drop-off** between stages
3. **ask why** — is it a product problem, messaging problem, or targeting problem?
4. **fix the leak before scaling the top** — a 2x improvement in activation is worth more than 2x traffic

| Drop-off Location | Likely Problem | Fix Category |
|-------------------|---------------|-------------|
| Visitors → Signup | weak positioning or wrong traffic | messaging / targeting |
| Signup → Activation | bad onboarding or unclear value | product / UX |
| Activation → Retention | product doesn't solve recurring job | product / PMF |
| Retention → Revenue | pricing/packaging misaligned | monetization strategy |
| Revenue → Referral | product not share-worthy yet | product / experience |

## when NOT to use pirate metrics

- pre-product companies (no funnel to measure yet)
- when the problem is positioning, not funnel optimization
- when the client needs a fundamentally different GTM motion, not funnel fixes
- when the numbers are so small that statistical significance is impossible
