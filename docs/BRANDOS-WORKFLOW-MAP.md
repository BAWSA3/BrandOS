# BrandOS System Workflow Map

> Last Updated: January 2025

---

## Quick Reference

```
USER FLOW:  Landing Page → Username Input → Analysis (4 phases) → Walkthrough → Dashboard
MAIN FILE:  src/components/XBrandScoreHero.tsx
API CHAIN:  /api/x-profile → /api/x-brand-identity → /api/x-brand-dna/generate → /api/x-brand-score
```

---

## 1. Core User Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BRANDOS USER JOURNEY                           │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │   LANDING    │     │   JOURNEY    │     │  WALKTHROUGH │     │  DASHBOARD   │
    │    PAGE      │ ──► │   (4 phases) │ ──► │  (6 sections)│ ──► │   (reveal)   │
    │              │     │              │     │              │     │              │
    │  @username   │     │  DEFINE      │     │  Score       │     │  Bento Grid  │
    │  input       │     │  CHECK       │     │  Identity    │     │  Share CTAs  │
    │              │     │  GENERATE    │     │  Tone        │     │  Waitlist    │
    │              │     │  SCALE       │     │  Archetype   │     │  Compare     │
    │              │     │              │     │  Keywords    │     │              │
    │              │     │              │     │  Content     │     │              │
    └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘

    flowState:           flowState:           flowState:           flowState:
    'input'              'journey'            'walkthrough'        'reveal'
```

---

## 2. Component Architecture

### Main Entry Point
```
src/app/page.tsx (Landing)
    └── src/components/XBrandScoreHero.tsx (Main Orchestrator)
        │
        ├── STATE: flowState = 'input' | 'journey' | 'walkthrough' | 'reveal'
        │
        ├── INPUT STATE
        │   └── Username form + validation
        │
        ├── JOURNEY STATE
        │   └── DNAJourneyScene (3D animation)
        │       └── 4-phase progress (DEFINE → CHECK → GENERATE → SCALE)
        │
        ├── WALKTHROUGH STATE
        │   └── DNAWalkthrough/index.tsx
        │       ├── ScoreWalkthrough.tsx
        │       ├── IdentityWalkthrough.tsx
        │       ├── ToneWalkthrough.tsx
        │       ├── ArchetypeWalkthrough.tsx
        │       ├── KeywordsWalkthrough.tsx
        │       └── PillarsWalkthrough.tsx
        │
        └── REVEAL STATE
            └── BrandOSDashboard.tsx (Bento Grid)
                └── Dashboard CTAs (Waitlist + Compare)
```

### DNAWalkthrough Structure
```
src/components/DNAWalkthrough/
├── index.tsx                    Main orchestrator (scroll tracking, section refs)
├── WalkthroughSection.tsx       Wrapper for each section
├── WalkthroughProgress.tsx      Side navigation dots
│
├── sections/
│   ├── ScoreWalkthrough.tsx     Brand score + phase breakdown
│   ├── IdentityWalkthrough.tsx  Profile + authenticity + activity
│   ├── ToneWalkthrough.tsx      Voice radar + tone bars
│   ├── ArchetypeWalkthrough.tsx Personality type + traits
│   ├── KeywordsWalkthrough.tsx  Brand keywords + DO/DON'T
│   └── PillarsWalkthrough.tsx   Content distribution
│
└── motion/
    ├── ParallaxCard.tsx         Cards with depth effect
    ├── ParallaxLayer.tsx        Background layers
    ├── TypewriterText.tsx       Character-by-character reveal
    ├── StaggerContainer.tsx     Staggered animations
    └── StaggerItem.tsx          Individual stagger items
```

### JourneyEnd Structure
```
src/components/JourneyEnd/
├── index.tsx                    Stage manager (transition → highlight → complete)
├── transitions/
│   ├── AchievementUnlock.tsx    "Achievement Unlocked" animation
│   └── ScoreCountdown.tsx       Score reveal animation
└── intermediates/
    └── HighlightReel.tsx        Brand highlights summary card
```

---

## 3. API Flow

### Analysis Pipeline
```
User submits @username
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│  STEP 1: POST /api/x-profile                                  │
│  Fetches: name, username, description, followers, following,  │
│           tweet_count, verified, location, url, profile_image │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│  STEP 2: POST /api/x-brand-identity                           │
│  Analyzes: bioLinguistics, profileImage colors, brandDNA      │
│  Uses: Gemini AI for analysis                                 │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│  STEP 3: POST /api/x-brand-dna/generate                       │
│  Generates: GeneratedBrandDNA object with:                    │
│    - archetype, archetypeEmoji                                │
│    - personalityType (MBTI), personalitySummary               │
│    - tone object (formality, energy, confidence, etc.)        │
│    - keywords[], voiceSamples[]                               │
│    - doPatterns[], dontPatterns[]                             │
│    - contentPillars[], performanceInsights                    │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│  STEP 4: POST /api/x-brand-score                              │
│  Scores across 4 phases:                                      │
│    - DEFINE: Identity clarity (0-100)                         │
│    - CHECK: Consistency (0-100)                               │
│    - GENERATE: Profile completeness (0-100)                   │
│    - SCALE: Growth readiness (0-100)                          │
│  Returns: overallScore, phases, topStrengths, topImprovements │
└───────────────────────────────────────────────────────────────┘
```

### All API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/x-profile` | POST | Fetch X/Twitter profile |
| `/api/x-tweets` | POST | Fetch user tweets |
| `/api/x-brand-identity` | POST | Full brand analysis |
| `/api/x-brand-score` | POST | Generate brand score |
| `/api/x-brand-dna/generate` | POST | Generate Brand DNA |
| `/api/x-brand-dna/recommendations` | POST | Get improvement tips |
| `/api/signup` | POST | Email waitlist signup |
| `/api/leaderboard` | GET | Brand score leaderboard |
| `/api/brands/share` | POST | Create shareable link |
| `/api/agents/chat` | POST | AI agent chat |
| `/api/brand-advisor/chat` | POST | Brand advisor chat |

---

## 4. Data Structures

### XProfileData
```typescript
interface XProfileData {
  name: string;
  username: string;
  description: string;
  profile_image_url: string;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  verified: boolean;
  location?: string;
  url?: string;
}
```

### BrandScoreResult
```typescript
interface BrandScoreResult {
  overallScore: number;          // 0-100
  phases: {
    define: { score: number; insights: string[] };
    check: { score: number; insights: string[] };
    generate: { score: number; insights: string[] };
    scale: { score: number; insights: string[] };
  };
  topStrengths: string[];
  topImprovements: string[];
  summary: string;
}
```

### GeneratedBrandDNA
```typescript
interface GeneratedBrandDNA {
  archetype: string;             // "The Prophet", "The Builder", etc.
  archetypeEmoji: string;
  personalityType: string;       // MBTI code
  personalitySummary: string;
  tone: {
    formality: number;           // 0-100
    energy: number;
    confidence: number;
    experimental: number;
    minimal: number;
  };
  keywords: string[];
  voiceSamples: string[];
  doPatterns: string[];
  dontPatterns: string[];
  contentPillars: ContentPillar[];
  performanceInsights: {
    voiceConsistency: number;
    topFormats: string[];
    optimalLength: { min: number; max: number };
  };
  voiceProfile: string;
}
```

---

## 5. State Management

### XBrandScoreHero State
```typescript
// Flow state
const [flowState, setFlowState] = useState<FlowState>('input');

// Data state
const [username, setUsername] = useState('');
const [profile, setProfile] = useState<XProfileData | null>(null);
const [brandScore, setBrandScore] = useState<BrandScoreResult | null>(null);
const [generatedBrandDNA, setGeneratedBrandDNA] = useState<GeneratedBrandDNA | null>(null);
const [accountAuthenticity, setAccountAuthenticity] = useState<AuthenticityAnalysis | null>(null);
const [accountActivity, setAccountActivity] = useState<ActivityAnalysis | null>(null);

// Journey state
const [currentPhase, setCurrentPhase] = useState(1);
const [itemProgress, setItemProgress] = useState(0);

// UI state
const [showConfetti, setShowConfetti] = useState(false);
const [showAdvisorChat, setShowAdvisorChat] = useState(false);

// Dashboard CTA state
const [waitlistEmail, setWaitlistEmail] = useState('');
const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
const [compareUsername, setCompareUsername] = useState('');
```

### Global Store (Zustand)
```
src/lib/store.ts - useBrandStore
├── currentBrand: BrandDNA | null
├── brands: Brand[]
├── history: HistoryItem[]
├── safeZones: Record<string, SafeZone[]>
├── brandMemory: Record<string, MemoryEvent[]>
├── designIntents: Record<string, DesignIntentBlock[]>
└── phaseProgress: PhaseProgress
```

---

## 6. Database Schema

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │     │    Brand    │     │    Team     │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │◄────│ userId      │     │ id          │
│ email       │     │ name        │     │ name        │
│ name        │     │ colors      │     │ createdAt   │
│ createdAt   │     │ tone        │     │ updatedAt   │
│ updatedAt   │     │ keywords    │     └─────────────┘
└─────────────┘     │ doPatterns  │            ▲
       ▲            │ dontPatterns│            │
       │            │ voiceSamples│     ┌─────────────┐
       │            │ isPublic    │     │ TeamMember  │
       │            │ shareToken  │     ├─────────────┤
       │            │ teamId      │────►│ userId      │
       │            └─────────────┘     │ teamId      │
       │                   │            │ role        │
       │                   ▼            └─────────────┘
       │            ┌─────────────┐
       │            │HistoryEntry │
       │            ├─────────────┤
       │            │ type        │
       │            │ input       │
       │            │ output      │
       │            │ brandId     │
       │            └─────────────┘
       │
┌─────────────┐     ┌─────────────┐
│ SharedBrand │     │ EmailSignup │
├─────────────┤     ├─────────────┤
│ userId      │     │ email       │
│ brandId     │     │ source      │
│ permission  │     │ createdAt   │
└─────────────┘     └─────────────┘
```

---

## 7. Pages & Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Landing | Main entry, username input |
| `/score/[username]` | Dynamic Score | Shareable URL for results |
| `/dna` | DNA Visualization | 3D DNA scene |
| `/shared/[token]` | Shared Brand | Public brand view |
| `/agents` | Agents Hub | AI assistants |
| `/conductor` | Conductor | AI orchestration |
| `/app` | Main App | Authenticated experience |
| `/thanks` | Thank You | Post-signup |
| `/test-dashboard` | Test Dashboard | Development testing |
| `/test-journey-end` | Test Journey | Development testing |

---

## 8. Personality Types

| Type | MBTI | Emoji | Traits |
|------|------|-------|--------|
| The Prophet | ENTP | Alien | Bold predictions, thought leader |
| The Alpha | ENTJ | Lightning | Confident, commanding |
| The Builder | ISTP | Rocket | Ships products, technical |
| The Educator | ENFJ | Book | Explains, thread master |
| The Degen | ESTP | Dice | High risk, meme-friendly |
| The Analyst | INTP | Eyes | Data-driven, charts |
| The Philosopher | INFJ | Brain | Big picture, visionary |
| The Networker | ESFJ | Handshake | Community, connector |
| The Contrarian | ENTP | Fire | Against crowd, independent |

---

## 9. Key Files Reference

### Core Flow
```
src/app/page.tsx                           Landing page
src/components/XBrandScoreHero.tsx         Main orchestrator
src/components/DNAWalkthrough/index.tsx    Walkthrough sections
src/components/BrandOSDashboard.tsx        Dashboard bento grid
src/components/JourneyEnd/index.tsx        Journey completion
```

### API Routes
```
src/app/api/x-profile/route.ts             Fetch X profile
src/app/api/x-brand-identity/route.ts      Brand analysis
src/app/api/x-brand-dna/generate/route.ts  DNA generation
src/app/api/x-brand-score/route.ts         Score calculation
src/app/api/signup/route.ts                Email waitlist
```

### State & Utils
```
src/lib/store.ts                           Zustand store
src/lib/types.ts                           TypeScript interfaces
src/lib/gemini.ts                          Gemini AI integration
src/lib/db.ts                              Prisma client
```

---

## 10. Change Log

| Date | Change | Files Modified |
|------|--------|----------------|
| Jan 2025 | Removed ISSUES DETECTED section | XBrandScoreHero.tsx |
| Jan 2025 | Removed YOUR BRAND DNA CAPTURED panel | XBrandScoreHero.tsx |
| Jan 2025 | Added Waitlist + Compare CTAs | XBrandScoreHero.tsx |
| Jan 2025 | Created workflow map | docs/BRANDOS-WORKFLOW-MAP.md |

---

## Quick Edits Cheatsheet

### To modify the dashboard CTAs:
→ `src/components/XBrandScoreHero.tsx` lines ~1967-2080

### To add a new walkthrough section:
1. Create `src/components/DNAWalkthrough/sections/NewSection.tsx`
2. Import in `src/components/DNAWalkthrough/index.tsx`
3. Add to sections array and SECTION_NAMES

### To modify brand score calculation:
→ `src/app/api/x-brand-score/route.ts`

### To add new API endpoint:
→ Create `src/app/api/your-endpoint/route.ts`

### To add new personality type:
→ `src/lib/gemini.ts` (PERSONALITY_TYPES map)
