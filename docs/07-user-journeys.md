# User Journeys

## Key Workflows and User Experiences

---

## Journey Map Overview

BrandOS supports multiple user types through distinct journey paths:

```
                    ┌─────────────────┐
                    │   New User      │
                    │   Arrives       │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │ Build Brand │  │ Check       │  │ Share/      │
     │ From Scratch│  │ Content     │  │ Collaborate │
     └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
            │                │                │
            └────────────────┼────────────────┘
                             ▼
                    ┌─────────────────┐
                    │   Power User    │
                    │   Workflows     │
                    └─────────────────┘
```

---

## Journey 1: First-Time Brand Setup

**Persona:** Sarah, Brand Manager at a Series B startup
**Goal:** Configure brand DNA for the first time

### Steps

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Landing & Onboarding                                    │
├─────────────────────────────────────────────────────────────────┤
│ • Arrives at landing page                                       │
│ • Sees "Define. Check. Generate." value prop                    │
│ • Clicks "Get Started"                                          │
│ • Views brief product tour (3 screens)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Template Selection                                      │
├─────────────────────────────────────────────────────────────────┤
│ • Presented with 6 brand templates:                             │
│   - Minimal Tech (Apple-inspired)                               │
│   - Bold Athletic (Nike-inspired)                               │
│   - Friendly Startup (Slack-inspired)                           │
│   - Luxury Premium                                              │
│   - Playful Creative (Mailchimp-inspired)                       │
│   - Trustworthy Finance                                         │
│ • Selects "Friendly Startup" as starting point                  │
│ • Template pre-fills all brand DNA fields                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Brand DNA Customization                                 │
├─────────────────────────────────────────────────────────────────┤
│ • Adjusts color palette to match actual brand colors            │
│ • Fine-tunes tone sliders:                                      │
│   - Increases "Playful" from 80% to 90%                         │
│   - Decreases "Bold" from 45% to 30%                            │
│ • Adds brand-specific keywords                                  │
│ • Updates do/don't patterns based on existing guidelines        │
│ • Pastes 3-5 exemplary voice samples                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Validation Check                                        │
├─────────────────────────────────────────────────────────────────┤
│ • System prompts: "Let's test your brand setup!"                │
│ • Sarah pastes a recent tweet                                   │
│ • Receives instant score: 78/100                                │
│ • Reviews issues and suggestions                                │
│ • Confirms brand DNA captures voice accurately                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Success State                                           │
├─────────────────────────────────────────────────────────────────┤
│ • Brand saved to dashboard                                      │
│ • Sees "Your brand is ready!" confirmation                      │
│ • Prompted to install Chrome extension                          │
│ • Option to invite team members                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Time to Value: ~10 minutes

### Key Moments of Delight
- Template pre-fill eliminates blank page anxiety
- Instant validation confirms setup works
- Visual tone sliders make abstract concepts tangible

---

## Journey 2: Daily Content Checking

**Persona:** Alex, Content Creator
**Goal:** Verify a LinkedIn post is on-brand before publishing

### Steps

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Content Ready for Review                                │
├─────────────────────────────────────────────────────────────────┤
│ • Alex has drafted a LinkedIn post in Google Docs               │
│ • Unsure if tone matches brand guidelines                       │
│ • Two options: Web app or Chrome extension                      │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│ Option A: Web App        │    │ Option B: Chrome Extension│
├──────────────────────────┤    ├──────────────────────────┤
│ • Opens brandos.app      │    │ • Selects text in Doc    │
│ • Navigates to Check tab │    │ • Right-clicks           │
│ • Pastes content         │    │ • "Check with BrandOS"   │
│ • Selects content type   │    │ • Extension popup opens  │
│   "LinkedIn"             │    │                          │
└──────────────────────────┘    └──────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: View Results                                            │
├─────────────────────────────────────────────────────────────────┤
│ Score: 67/100                                                   │
│                                                                 │
│ Issues:                                                         │
│ • "We're excited to announce" is overused corporate phrase      │
│ • Opening is passive, should lead with value                    │
│ • Missing brand keyword opportunities                           │
│                                                                 │
│ Strengths:                                                      │
│ • Appropriate length for LinkedIn                               │
│ • Clear call to action                                          │
│ • Professional tone matches platform                            │
│                                                                 │
│ Suggestions:                                                    │
│ • Replace opening with direct value statement                   │
│ • Incorporate "seamless" or "intuitive" naturally               │
│ • Consider adding a question to boost engagement                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Review Suggested Revision                               │
├─────────────────────────────────────────────────────────────────┤
│ Original:                                                       │
│ "We're excited to announce our new integration with Salesforce. │
│ This update helps teams work more efficiently..."               │
│                                                                 │
│ Suggested:                                                      │
│ "Your CRM and workflows, finally connected.                     │
│ Our Salesforce integration makes team collaboration seamless..."│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Iterate and Publish                                     │
├─────────────────────────────────────────────────────────────────┤
│ • Alex copies suggested revision                                │
│ • Makes minor personal adjustments                              │
│ • Re-checks: Score now 84/100 ✅                                │
│ • Confident to publish                                          │
│ • Check saved to history                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Time to Value: ~2 minutes

### Key Moments of Delight
- Instant feedback eliminates waiting for brand team
- Specific issues (not vague "doesn't feel right")
- One-click suggested revision

---

## Journey 3: Campaign Content Generation

**Persona:** Marketing Manager
**Goal:** Generate multiple content pieces for product launch

### Steps

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Define Campaign Need                                    │
├─────────────────────────────────────────────────────────────────┤
│ • New feature launching next week                               │
│ • Need: Twitter thread, LinkedIn post, email subject lines      │
│ • Time pressure: 2 hours to complete                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Generate Twitter Content                                │
├─────────────────────────────────────────────────────────────────┤
│ • Opens Generate tab                                            │
│ • Selects content type: "Twitter/X Post"                        │
│ • Enters prompt: "Announce our new AI-powered analytics         │
│   dashboard that gives real-time insights"                      │
│ • Clicks Generate                                               │
│                                                                 │
│ Output:                                                         │
│ "Real-time insights, zero learning curve.                       │
│                                                                 │
│ Our new AI analytics dashboard is here.                         │
│                                                                 │
│ → See patterns as they emerge                                   │
│ → Ask questions in plain English                                │
│ → Make decisions, not reports                                   │
│                                                                 │
│ Available now for all Pro users."                               │
│                                                                 │
│ Auto-check: 91/100 ✅                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Generate LinkedIn Version                               │
├─────────────────────────────────────────────────────────────────┤
│ • Switches content type to "LinkedIn"                           │
│ • Same prompt, platform-adapted output                          │
│                                                                 │
│ Output:                                                         │
│ "We built our analytics dashboard for the way modern teams      │
│ actually work.                                                  │
│                                                                 │
│ Instead of pulling reports and waiting for insights, you can    │
│ now ask questions in plain English and see answers in real-time.│
│                                                                 │
│ The dashboard learns your business context and surfaces what    │
│ matters most—before you know to ask.                            │
│                                                                 │
│ Here's what early users are saying: [link]                      │
│                                                                 │
│ Now available to all Pro customers.                             │
│ What analytics question would you ask first?"                   │
│                                                                 │
│ Auto-check: 87/100 ✅                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Generate Email Subject Lines                            │
├─────────────────────────────────────────────────────────────────┤
│ • Content type: "Email Subject Line"                            │
│ • Prompt: "3 options for email announcing new dashboard"        │
│                                                                 │
│ Output:                                                         │
│ 1. "Your dashboard just got smarter"                            │
│ 2. "Ask your data anything—it answers now"                      │
│ 3. "Real-time insights are here"                                │
│                                                                 │
│ All checked: 85+/100 ✅                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Platform Adaptation (Optional)                          │
├─────────────────────────────────────────────────────────────────┤
│ • Uses Platform Adapter for Instagram and TikTok versions       │
│ • Single input generates all platform variants                  │
│ • Each adapted for platform norms while staying on-brand        │
└─────────────────────────────────────────────────────────────────┘
```

### Time to Value: ~30 minutes for full campaign

### Key Moments of Delight
- Platform-aware generation eliminates manual adaptation
- Auto-checking ensures quality before export
- History tracks all generated content

---

## Journey 4: Agency Managing Multiple Brands

**Persona:** Marcus, Creative Director at digital agency
**Goal:** Onboard new client brand and enable team

### Steps

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Create New Brand                                        │
├─────────────────────────────────────────────────────────────────┤
│ • Clicks "+" to add new brand                                   │
│ • Names it "ClientCo"                                           │
│ • Reviews client's existing brand guidelines PDF                │
│ • Manually inputs:                                              │
│   - Brand colors from style guide                               │
│   - Tone interpretation from guidelines language                │
│   - Keywords from brand vocabulary section                      │
│   - Do/Don't patterns from writing guidelines                   │
│ • Pastes exemplary content from client's best campaigns         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Validate with Historical Content                        │
├─────────────────────────────────────────────────────────────────┤
│ • Tests 5 pieces of approved client content                     │
│ • All score 75+ → Brand DNA is well calibrated                  │
│ • Tests 2 pieces of rejected content                            │
│ • Both score below 60 → Correctly identifies issues             │
│ • Brand setup validated ✅                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Configure Safe Zones                                    │
├─────────────────────────────────────────────────────────────────┤
│ • Opens Safe Zones feature                                      │
│ • Marks as LOCKED:                                              │
│   - Logo (no modifications ever)                                │
│   - Primary blue (#003d6b)                                      │
│   - Tagline: "Built for builders"                               │
│ • Marks as FLEXIBLE:                                            │
│   - Accent colors (seasonal variants OK)                        │
│   - Photography style (lifestyle preferred)                     │
│ • Marks as EXPERIMENTAL:                                        │
│   - Emoji usage (testing for engagement)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Share with Team                                         │
├─────────────────────────────────────────────────────────────────┤
│ • Generates share link for brand                                │
│ • Shares link in agency Slack channel                           │
│ • Junior designers can now:                                     │
│   - View brand DNA (read-only)                                  │
│   - Check their content before submitting                       │
│   - Generate on-brand content drafts                            │
│ • Marcus retains edit access to brand settings                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Ongoing Usage                                           │
├─────────────────────────────────────────────────────────────────┤
│ • Team uses brand switching to move between clients             │
│ • Each client brand has isolated settings                       │
│ • Client deliverables consistently score 80+                    │
│ • Revision rounds reduced from 3-4 to 1-2                       │
│ • New team members onboard to client brands in hours, not weeks │
└─────────────────────────────────────────────────────────────────┘
```

### Time to Value: ~45 minutes for full setup

### Key Moments of Delight
- Multi-brand support in single interface
- Validation against known-good content
- Shareable read-only access for team

---

## Journey 5: Handling Subjective Feedback

**Persona:** Designer receiving stakeholder feedback
**Goal:** Translate "it doesn't feel right" into actionable changes

### Steps

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Receive Vague Feedback                                  │
├─────────────────────────────────────────────────────────────────┤
│ Client says: "This doesn't feel premium enough.                 │
│ It needs to feel more elevated but still approachable."         │
│                                                                 │
│ Designer is unsure what specific changes to make.               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Use Taste Translator                                    │
├─────────────────────────────────────────────────────────────────┤
│ • Opens Taste Translation feature                               │
│ • Enters feedback: "doesn't feel premium enough, needs to       │
│   feel more elevated but still approachable"                    │
│ • Clicks Translate                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Receive Interpretation                                  │
├─────────────────────────────────────────────────────────────────┤
│ Translation Output:                                             │
│                                                                 │
│ Category: Premium                                               │
│                                                                 │
│ Interpretation:                                                 │
│ "The current design may have too many elements competing for    │
│ attention, diluting the sense of sophistication. Premium often  │
│ comes from restraint and confidence, not addition."             │
│                                                                 │
│ Actionable Rules:                                               │
│ • Increase white space by 20-30%                                │
│ • Reduce color palette to 2-3 colors maximum                    │
│ • Use larger, more confident typography                         │
│ • Remove decorative elements that don't serve function          │
│ • Choose quality imagery over quantity                          │
│ • Add subtle, refined details rather than obvious effects       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Apply and Validate                                      │
├─────────────────────────────────────────────────────────────────┤
│ • Designer applies suggested changes                            │
│ • Runs revised copy through Content Check                       │
│ • Score improves from 68 to 85                                  │
│ • Uses Taste Protection to ensure not over-designed             │
│ • Presents revision with confidence                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Save Learning                                           │
├─────────────────────────────────────────────────────────────────┤
│ • Translation saved to Brand Memory                             │
│ • Future "premium" feedback auto-references these rules         │
│ • Team builds shared vocabulary for subjective terms            │
└─────────────────────────────────────────────────────────────────┘
```

### Time to Value: ~10 minutes

### Key Moments of Delight
- Transforms frustrating feedback into clear direction
- Builds institutional knowledge
- Reduces back-and-forth cycles

---

## Journey 6: Crisis Communication

**Persona:** Head of Comms during a service outage
**Goal:** Communicate appropriately during sensitive moment

### Steps

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Urgent Communication Needed                             │
├─────────────────────────────────────────────────────────────────┤
│ • Service outage affecting customers                            │
│ • Need to communicate across all channels                       │
│ • Must maintain brand voice while showing appropriate gravity   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Apply Context-Aware Tone                                │
├─────────────────────────────────────────────────────────────────┤
│ • Opens Context Tone feature                                    │
│ • Selects context: "Crisis"                                     │
│ • System automatically adjusts:                                 │
│   - Formality: +40%                                             │
│   - Playfulness: -50%                                           │
│   - Urgency: +50%                                               │
│   - Confidence: +10%                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Generate Crisis-Appropriate Content                     │
├─────────────────────────────────────────────────────────────────┤
│ Prompt: "Service outage notification, issue being resolved,     │
│ expect 2 hour fix"                                              │
│                                                                 │
│ Normal brand voice would output:                                │
│ "Hey! We're having some issues right now but our amazing        │
│ team is on it! Back soon!"                                      │
│                                                                 │
│ Crisis-context output:                                          │
│ "We're currently experiencing a service disruption.             │
│                                                                 │
│ Our team identified the issue and is working to restore         │
│ service. Expected resolution: within 2 hours.                   │
│                                                                 │
│ We'll provide updates as we have them.                          │
│                                                                 │
│ We apologize for the inconvenience."                            │
│                                                                 │
│ ✅ Maintains brand but contextually appropriate                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Multi-Platform Adaptation                               │
├─────────────────────────────────────────────────────────────────┤
│ • Uses Platform Adapter with crisis context                     │
│ • Twitter: Concise, links to status page                        │
│ • Email: More detail, timeline, next steps                      │
│ • All maintain appropriate crisis tone                          │
└─────────────────────────────────────────────────────────────────┘
```

### Time to Value: ~5 minutes

### Key Moments of Delight
- Prevents tone-deaf messaging in sensitive moments
- Maintains brand coherence even in crisis
- Speeds up time-critical communications

---

## User Journey Metrics

| Journey | Avg. Time | User Satisfaction | Repeat Usage |
|---------|-----------|-------------------|--------------|
| Brand Setup | 10 min | 4.5/5 | N/A (one-time) |
| Content Check | 2 min | 4.7/5 | Daily |
| Generation | 5 min | 4.4/5 | Weekly |
| Multi-brand | 45 min | 4.6/5 | Per client |
| Taste Translation | 10 min | 4.8/5 | As needed |
| Crisis Comms | 5 min | 4.9/5 | Rare |

---

*Next: [Product Roadmap →](08-product-roadmap.md)*









