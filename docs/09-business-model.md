# Business Model

## Pricing Strategy and Revenue Streams

---

## Business Model Overview

BrandOS operates a **SaaS subscription model** with usage-based components, targeting a path from self-serve adoption to enterprise contracts.

```
┌─────────────────────────────────────────────────────────────────┐
│                     REVENUE MODEL                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   FREE      │  │  STARTER    │  │   PRO       │             │
│  │   TIER      │→ │   $49/mo    │→ │   $199/mo   │             │
│  │   (Hook)    │  │   (Habit)   │  │   (Scale)   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                │                │                     │
│         └────────────────┴────────────────┘                     │
│                          ↓                                      │
│                  ┌─────────────┐                                │
│                  │ ENTERPRISE  │                                │
│                  │  Custom     │                                │
│                  │  (Lock-in)  │                                │
│                  └─────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pricing Tiers

### Free Tier

**Purpose:** Lower barrier to entry, create habit, enable virality

| Feature | Limit |
|---------|-------|
| Brands | 1 |
| Content Checks | 20/month |
| AI Generations | 10/month |
| History | 7 days |
| Templates | All 6 |
| Chrome Extension | ✅ |
| Brand Sharing | ❌ |
| Team Features | ❌ |
| API Access | ❌ |

**Conversion triggers:**
- Hits check/generation limit
- Wants second brand
- Needs sharing for team

---

### Starter — $49/month

**Target:** Freelancers, small teams, single-brand companies

| Feature | Limit |
|---------|-------|
| Brands | 3 |
| Content Checks | 200/month |
| AI Generations | 100/month |
| History | 90 days |
| Templates | All |
| Chrome Extension | ✅ |
| Brand Sharing | ✅ (read-only) |
| Team Members | 3 |
| API Access | ❌ |
| Priority Support | ❌ |

**Annual pricing:** $39/month (20% discount) = $468/year

---

### Professional — $199/month

**Target:** Growing teams, agencies, multi-brand companies

| Feature | Limit |
|---------|-------|
| Brands | 15 |
| Content Checks | 1,000/month |
| AI Generations | 500/month |
| History | Unlimited |
| Templates | All + Custom |
| Chrome Extension | ✅ |
| Brand Sharing | ✅ (full) |
| Team Members | 15 |
| API Access | ✅ (1,000 calls/day) |
| Priority Support | ✅ |
| Advanced Analytics | ✅ |
| Custom Integrations | ✅ |

**Annual pricing:** $159/month (20% discount) = $1,908/year

---

### Enterprise — Custom Pricing

**Target:** Large organizations, agencies with many clients, regulated industries

| Feature | Limit |
|---------|-------|
| Brands | Unlimited |
| Content Checks | Unlimited |
| AI Generations | Unlimited |
| History | Unlimited + Export |
| Team Members | Unlimited |
| API Access | Unlimited + Priority |
| SSO/SAML | ✅ |
| Audit Logging | ✅ |
| Custom AI Training | ✅ |
| Dedicated Support | ✅ |
| SLA | 99.9% uptime |
| On-Premise Option | ✅ |

**Pricing model:** Based on seats + usage, typically $500-2,000/month

**Minimum contract:** 12 months

---

## Revenue Streams

### Primary: Subscription Revenue

| Tier | Monthly | Annual | % of Revenue (Target) |
|------|---------|--------|----------------------|
| Free | $0 | $0 | 0% |
| Starter | $49 | $468 | 30% |
| Professional | $199 | $1,908 | 45% |
| Enterprise | $500-2,000+ | Custom | 25% |

### Secondary: Usage Overage

When customers exceed plan limits:

| Overage Type | Price |
|--------------|-------|
| Additional Checks | $0.10/check |
| Additional Generations | $0.25/generation |
| Additional Brands | $15/brand/month |
| Additional Seats | $20/seat/month |

### Tertiary: Add-On Services

| Service | Price | Target Customer |
|---------|-------|-----------------|
| Brand DNA Setup Assistance | $500 one-time | New Pro customers |
| Custom Integration Development | $2,000+ | Enterprise |
| Brand Training Workshop | $1,500 | Enterprise |
| White-Label Licensing | Custom | Agencies |

---

## Unit Economics

### Customer Acquisition Cost (CAC)

| Channel | CAC Target | Payback Period |
|---------|------------|----------------|
| Organic/SEO | $50 | 1 month |
| Content Marketing | $100 | 2 months |
| Paid Social | $200 | 4 months |
| Outbound Sales | $1,500 | 6 months |

### Lifetime Value (LTV)

**Assumptions:**
- Average monthly churn: 5% (Starter), 3% (Pro), 1% (Enterprise)
- Average customer lifespan: 20 months (Starter), 33 months (Pro), 100 months (Enterprise)

| Tier | Monthly Revenue | Avg. Lifespan | LTV |
|------|-----------------|---------------|-----|
| Starter | $49 | 20 months | $980 |
| Professional | $199 | 33 months | $6,567 |
| Enterprise | $1,000 (avg) | 100 months | $100,000 |

### LTV:CAC Ratios

| Tier | LTV | Target CAC | LTV:CAC |
|------|-----|------------|---------|
| Starter | $980 | $200 | 4.9:1 |
| Professional | $6,567 | $500 | 13:1 |
| Enterprise | $100,000 | $10,000 | 10:1 |

**Target:** 3:1 minimum, 5:1 healthy, 10:1 excellent

---

## Gross Margin Analysis

### Cost Structure

| Cost Category | % of Revenue | Notes |
|---------------|--------------|-------|
| **AI/OpenAI Costs** | 15-25% | Variable with usage |
| **Infrastructure** | 5-8% | Hosting, CDN, databases |
| **Payment Processing** | 2-3% | Stripe fees |
| **Support** | 5-10% | Scales with customer count |
| **Total COGS** | 27-46% | |
| **Gross Margin** | 54-73% | Target: 70%+ at scale |

### AI Cost Optimization

| Strategy | Impact |
|----------|--------|
| Prompt optimization | Reduce tokens 20-30% |
| Response caching | Cache common patterns |
| Tiered model usage | GPT-3.5 for simple checks |
| Batch processing | Volume discounts |

---

## Pricing Philosophy

### Value-Based Pricing

**The equation:**
```
Time saved per brand check:     15 minutes → $12.50 value (at $50/hr)
Checks saved from rework:       3 rounds × 15 min = 45 min → $37.50
Brand consistency value:        Priceless (but let's say $500/month)
Total monthly value:            $550+ per heavy user

Our price:                      $49-199/month (90%+ value capture for customer)
```

### Psychological Pricing

| Principle | Application |
|-----------|-------------|
| Anchoring | Show Enterprise first to make Pro feel reasonable |
| Decoy | Starter tier makes Pro look like better value |
| Round numbers | $49, $199 instead of $47, $197 |
| Annual discount | 20% creates urgency and commitment |

---

## Conversion Funnel

```
                    100,000 visitors
                          │
                          ▼
        ┌─────────────────────────────────┐
        │       10% Sign Up (Free)        │ 10,000 free users
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │    5% Convert to Starter        │ 500 Starter customers
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  20% Upgrade to Professional    │ 100 Pro customers
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │   5% Become Enterprise          │ 5 Enterprise accounts
        └─────────────────────────────────┘
```

### Key Conversion Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Visitor → Free | 10% | TBD |
| Free → Paid | 5% | TBD |
| Starter → Pro | 20% | TBD |
| Pro → Enterprise | 5% | TBD |
| Monthly Churn | <5% | TBD |

---

## Revenue Projections

### Year 1 Scenario

| Month | Free Users | Starter | Pro | Enterprise | MRR |
|-------|------------|---------|-----|------------|-----|
| 1 | 100 | 5 | 0 | 0 | $245 |
| 3 | 500 | 25 | 5 | 0 | $2,220 |
| 6 | 2,000 | 100 | 20 | 1 | $9,680 |
| 12 | 10,000 | 500 | 100 | 5 | $49,200 |

**Year 1 ARR:** ~$590K

### Year 2 Scenario

| Metric | Target |
|--------|--------|
| Free Users | 50,000 |
| Starter Customers | 2,500 |
| Pro Customers | 500 |
| Enterprise Accounts | 25 |
| MRR | $247,000 |
| ARR | $2.96M |

### Year 3 Scenario

| Metric | Target |
|--------|--------|
| Free Users | 200,000 |
| Starter Customers | 10,000 |
| Pro Customers | 2,000 |
| Enterprise Accounts | 100 |
| MRR | $990,000 |
| ARR | $11.9M |

---

## Competitive Pricing Analysis

| Competitor | Entry Price | Pro Price | Positioning |
|------------|-------------|-----------|-------------|
| Frontify | $99/mo | $299/mo | Higher, more comprehensive |
| Bynder | Contact sales | Enterprise-only | Much higher |
| Jasper | $49/mo | $125/mo | Similar, but different focus |
| BrandOS | $49/mo | $199/mo | Value leader in brand AI |

**Positioning:** Premium to pure AI writers, accessible vs. enterprise DAMs

---

## Expansion Revenue Opportunities

### Seat Expansion
- As teams grow, add seats at $20-40/seat
- Pro plan naturally expands 30%/year from seat growth

### Usage Expansion
- Heavy users hit limits → upgrade or buy overage
- 20% of customers consistently over-use

### Brand Expansion
- Agencies add clients = add brands
- Expansion revenue from brand additions

### Feature Upsell
- Free → Starter: Sharing, more capacity
- Starter → Pro: API, integrations, analytics
- Pro → Enterprise: Security, compliance, customization

---

## Payment & Billing

### Payment Methods
- Credit/debit card (primary)
- Annual invoicing (Enterprise)
- ACH/wire (Enterprise)

### Billing Features
- Monthly or annual billing
- Prorated upgrades/downgrades
- Usage-based overage billing
- Seat-based invoicing

### Provider
- **Stripe** for payment processing
- Stripe Billing for subscriptions
- Stripe Tax for compliance

---

*Next: [Go-to-Market Strategy →](10-go-to-market.md)*


