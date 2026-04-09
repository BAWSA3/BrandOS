# Industry Benchmarks & Metrics Reference

use these benchmarks to calibrate GTM recommendations. never present benchmarks as absolute truth — they're directional. always caveat with the source vertical and stage.

## CAC benchmarks by industry and stage

### SaaS

| Stage | Self-Serve CAC | Sales-Assisted CAC | Enterprise CAC |
|-------|---------------|-------------------|---------------|
| Seed / Pre-PMF | $50-150 | $500-2,000 | n/a (too early) |
| Series A ($1-5M ARR) | $100-300 | $1,000-5,000 | $5,000-15,000 |
| Growth ($5-20M ARR) | $150-500 | $2,000-8,000 | $10,000-50,000 |
| Scale ($20M+ ARR) | $200-800 | $3,000-12,000 | $15,000-100,000 |

→ CAC increases with scale because the easiest customers convert first. plan for this.

### marketplace / platform

| Type | Supply-Side CAC | Demand-Side CAC |
|------|----------------|----------------|
| Early (bootstrapping supply) | $20-100 | $10-50 |
| Growth (network effects kicking in) | $50-300 | $30-150 |
| Scale | $100-500 | $50-300 |

### consumer / creator tools

| Model | Organic CAC | Paid CAC |
|-------|------------|---------|
| Freemium | $1-5 (viral/organic) | $5-30 (paid) |
| Subscription ($5-20/mo) | $10-30 | $20-80 |
| Premium ($50+/mo) | $30-100 | $50-200 |

## conversion rate benchmarks

### by funnel stage

| Stage | Bottom 25% | Median | Top 25% |
|-------|-----------|--------|---------|
| Visitor → Signup | < 1% | 2-5% | 7-15% |
| Signup → Activation | < 15% | 25-40% | 50-70% |
| Activation → Paid (freemium) | < 1% | 2-5% | 7-12% |
| Free Trial → Paid | < 10% | 15-25% | 30-50% |
| Demo → Close (SMB) | < 10% | 15-25% | 30-40% |
| Demo → Close (Enterprise) | < 5% | 10-20% | 25-35% |

### by channel

| Channel | Avg CTR | Avg Conversion | Typical CAC |
|---------|---------|---------------|-------------|
| Google Search (branded) | 5-15% | 8-15% | $20-80 |
| Google Search (non-branded) | 2-5% | 2-5% | $50-300 |
| LinkedIn Ads (B2B) | 0.4-0.8% | 1-3% | $100-500 |
| Meta Ads (B2C) | 0.8-1.5% | 1-4% | $10-80 |
| Cold Email (targeted) | 15-30% open, 1-3% reply | 0.5-2% | $200-1,000 |
| Content/SEO | n/a (organic) | 1-3% | $30-150 (content cost amortized) |
| Product-led viral | n/a | varies wildly | $0-10 |
| Partner/referral | n/a | 5-15% | $50-200 |

## LTV:CAC ratios

| Ratio | What It Means | Action |
|-------|--------------|--------|
| < 1:1 | losing money on every customer | stop spending. fix product or pricing. |
| 1:1 - 2:1 | barely break-even | not sustainable for growth. reduce CAC or increase LTV. |
| 3:1 | healthy | standard target. you can invest in growth. |
| 5:1 | very strong | you're either under-investing in growth or have exceptional retention. |
| > 8:1 | suspiciously high | likely under-investing in acquisition. could grow faster. or LTV estimate is too optimistic. |

**payback period targets:**
- PLG / self-serve: < 6 months
- SMB sales-assisted: < 12 months
- Enterprise: < 18 months (acceptable up to 24 months with strong expansion revenue)

## SaaS-specific metrics

### net dollar retention (NDR)

| NDR | What It Means |
|-----|--------------|
| < 80% | significant churn problem. fix retention before growing. |
| 80-100% | stable but not expanding. no growth from existing base. |
| 100-110% | healthy. expansion roughly offsets churn. |
| 110-130% | strong. existing customers are a growth engine. |
| > 130% | exceptional. typical of PLG with usage-based pricing. Snowflake, Datadog territory. |

→ NDR > 100% means you can grow even with zero new customers. this is the magic of expansion revenue.

### gross revenue churn

| Annual Churn | Assessment |
|-------------|-----------|
| < 5% | excellent (enterprise) |
| 5-10% | good (SMB/mid-market) |
| 10-20% | needs improvement |
| > 20% | retention crisis. don't scale acquisition. |

→ monthly churn rates are deceptive. 5% monthly churn = 46% annual churn. always annualize.

### expansion revenue

best-in-class companies generate 30-50% of new ARR from existing customers through:
- seat expansion (team grows)
- usage-based upgrades (hit usage limits)
- cross-sell (adopt additional products)
- upsell (move to higher tier)

## growth rate benchmarks

### the T2D3 framework (triple, triple, double, double, double)

for VC-backed SaaS targeting $100M+ ARR:

| Year | Growth Target | ARR (from $2M start) |
|------|-------------|---------------------|
| Year 1 | 3x | $6M |
| Year 2 | 3x | $18M |
| Year 3 | 2x | $36M |
| Year 4 | 2x | $72M |
| Year 5 | 2x | $144M |

→ this is the venture-scale growth path. most companies aren't on this trajectory — and that's fine. but if a client is VC-backed, their investors expect something close to this.

### realistic MoM growth by stage

| Stage | "Good" MoM | "Great" MoM |
|-------|-----------|------------|
| Pre-revenue to $10K MRR | 15-25% | 30-50% |
| $10K - $100K MRR | 10-15% | 20-30% |
| $100K - $500K MRR | 8-12% | 15-20% |
| $500K - $1M MRR | 5-8% | 10-15% |
| $1M+ MRR | 3-5% | 7-10% |

→ MoM growth naturally decelerates as the base grows. a client growing 10% MoM at $500K MRR is outperforming one growing 15% MoM at $50K MRR in absolute terms.

## engagement benchmarks by platform

### email marketing

| Metric | Below Average | Average | Above Average |
|--------|-------------|---------|--------------|
| Open rate | < 15% | 20-25% | > 30% |
| Click rate | < 1.5% | 2.5-3.5% | > 5% |
| Unsubscribe rate | > 0.5% | 0.2-0.4% | < 0.2% |
| Reply rate (cold) | < 1% | 2-5% | > 8% |

### social media (organic)

| Platform | Avg Engagement Rate | Good | Exceptional |
|----------|-------------------|------|-------------|
| X/Twitter | 0.5-1% | 1-3% | > 5% |
| LinkedIn (personal) | 1-2% | 3-5% | > 8% |
| LinkedIn (company) | 0.3-0.5% | 0.5-1% | > 2% |
| Instagram | 1-3% | 3-6% | > 8% |
| TikTok | 3-6% | 6-12% | > 15% |
| YouTube | 2-5% CTR on thumbnails | 5-10% | > 10% |

### content marketing

| Metric | Baseline | Good | Great |
|--------|---------|------|-------|
| Blog → email signup | 0.5-1% | 1-3% | > 5% |
| Webinar registration rate | 20-30% of landing page visitors | 30-40% | > 50% |
| Webinar attendance rate | 30-40% of registrants | 40-50% | > 60% |
| Content → trial/demo | 0.5-1% | 1-3% | > 3% |
| Podcast download → visit | 1-3% | 3-5% | > 8% |

## marketplace-specific metrics

| Metric | Healthy Range |
|--------|-------------|
| Take rate | 5-30% (varies by vertical: 5-10% high-ticket, 20-30% services) |
| Liquidity (% of listings with transaction) | > 15-20% |
| Supply-side retention (monthly) | > 60% |
| Demand-side retention (monthly) | > 30% |
| Time to first match | < 48 hours (services), < 7 days (marketplace) |

## usage notes

**when citing benchmarks:**
- always specify the vertical and stage — "B2B SaaS at Series A" not just "SaaS"
- present as ranges, not single numbers
- caveat when data is limited or the vertical is unusual
- explain which direction the benchmark should trend and why

**when benchmarks aren't available:**
- use adjacent vertical benchmarks and explain the adjustment
- use first-principles reasoning ("this is a high-ACV, long-cycle sale, so conversion rates will be lower but deal sizes larger")
- say "I don't have reliable benchmarks for this specific vertical" — don't make numbers up

**updating benchmarks:**
- these benchmarks reflect general industry knowledge
- for specific client engagements, supplement with:
  - the client's own historical data (most accurate)
  - industry reports (SaaS Capital, OpenView, KeyBanc for SaaS)
  - competitor public data (S-1 filings, earnings reports)
  - community benchmarks (Lenny's Newsletter, First Round Review)
