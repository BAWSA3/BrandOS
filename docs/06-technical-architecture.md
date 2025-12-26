# Technical Architecture

## System Design and AI Integration Approach

---

## Architecture Overview

BrandOS is built as a modern web application with AI-native capabilities at its core.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Web App     │  │  Chrome      │  │  API         │          │
│  │  (Next.js)   │  │  Extension   │  │  Consumers   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Next.js API Routes                      │  │
│  │  /api/check │ /api/generate │ /api/analyze │ /api/...    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   AI SERVICES   │ │   DATA LAYER    │ │   INTEGRATIONS  │
│  ┌───────────┐  │ │  ┌───────────┐  │ │  ┌───────────┐  │
│  │  OpenAI   │  │ │  │  Prisma   │  │ │  │  Pinterest │ │
│  │  GPT-4    │  │ │  │  ORM      │  │ │  │  API      │  │
│  └───────────┘  │ │  └───────────┘  │ │  └───────────┘  │
│  ┌───────────┐  │ │  ┌───────────┐  │ │  ┌───────────┐  │
│  │  Custom   │  │ │  │  SQLite/  │  │ │  │  Future:  │  │
│  │  Prompts  │  │ │  │  Postgres │  │ │  │  Figma,   │  │
│  └───────────┘  │ │  └───────────┘  │ │  │  Slack    │  │
└─────────────────┘ └─────────────────┘ └───────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **Next.js 14** | React framework | App Router, Server Components, API routes |
| **TypeScript** | Type safety | Catch errors early, better DX |
| **Tailwind CSS** | Styling | Rapid UI development, consistent design |
| **Zustand** | State management | Lightweight, persistent, simple |
| **React Hooks** | Component logic | Modern React patterns |

### Backend

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **Next.js API Routes** | API endpoints | Unified deployment, serverless ready |
| **Prisma** | Database ORM | Type-safe queries, migrations |
| **SQLite/PostgreSQL** | Database | SQLite for dev, Postgres for prod |
| **OpenAI API** | AI capabilities | GPT-4 for generation and analysis |

### Infrastructure

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **Vercel** | Hosting | Optimal Next.js deployment |
| **Edge Functions** | Low-latency API | Global distribution |
| **Blob Storage** | Asset storage | Images, exports |

---

## Data Model

### Core Entities

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
│  id, email, name, createdAt, updatedAt                      │
└─────────────────────────────────────────────────────────────┘
        │ 1:N                          │ N:M
        ▼                              ▼
┌─────────────────┐           ┌─────────────────┐
│     BRAND       │           │      TEAM       │
│  id, name       │           │  id, name       │
│  colors (JSON)  │           │  members        │
│  tone (JSON)    │           └─────────────────┘
│  keywords       │
│  doPatterns     │
│  dontPatterns   │
│  voiceSamples   │
│  shareToken     │
└─────────────────┘
        │ 1:N
        ▼
┌─────────────────┐
│  HISTORY_ENTRY  │
│  id, type       │
│  input, output  │
│  score          │
│  createdAt      │
└─────────────────┘
```

### Brand Schema

```prisma
model Brand {
  id           String   @id @default(cuid())
  name         String
  colors       String   // JSON: { primary, secondary, accent }
  tone         String   // JSON: { minimal, playful, bold, experimental }
  keywords     String   // JSON array
  doPatterns   String   // JSON array
  dontPatterns String   // JSON array
  voiceSamples String   // JSON array
  isPublic     Boolean  @default(false)
  shareToken   String?  @unique
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  teamId       String?
  team         Team?    @relation(fields: [teamId], references: [id])
  history      HistoryEntry[]
  sharedWith   SharedBrand[]
}
```

---

## API Architecture

### Endpoint Structure

```
/api
├── /check                    POST - Check content against brand
├── /generate                 POST - Generate on-brand content
├── /analyze-tone             POST - Analyze content tone
├── /analyze-competitor       POST - Analyze competitor content
├── /analyze-image            POST - Analyze image for brand fit
├── /cohesion                 POST - Analyze brand cohesion
├── /context-tone             POST - Apply context-aware tone
├── /design-intent            POST - Translate design intent
├── /guardrails               POST - Check creator submission
├── /platform-adapt           POST - Adapt for platforms
├── /taste-protect            POST - Protect against over-design
├── /taste-translate          POST - Translate subjective feedback
├── /search-pinterest         POST - Search Pinterest for inspiration
├── /expand-search            POST - Expand visual search
├── /brands
│   └── /share                POST - Generate share token
├── /export
│   ├── /brand-kit            POST - Export brand kit
│   └── /pitch-deck           POST - Export pitch deck
└── /webhook
    ├── /check                POST - External check endpoint
    └── /generate             POST - External generate endpoint
```

### Request/Response Patterns

**Check Endpoint Example:**

```typescript
// POST /api/check
// Request
{
  "content": "Check out our AMAZING new feature!!!",
  "brandId": "brand_123",
  "contentType": "social-twitter"
}

// Response
{
  "score": 42,
  "issues": [
    "Excessive capitalization violates minimal tone",
    "Multiple exclamation marks break brand patterns",
    "'AMAZING' is a prohibited superlative"
  ],
  "strengths": [
    "Appropriate length for Twitter",
    "Call to action present"
  ],
  "suggestions": [
    "Use sentence case",
    "Replace superlative with specific benefit",
    "Use single period for punctuation"
  ],
  "revisedVersion": "Introducing our latest feature. Designed for seamless workflows."
}
```

---

## AI Integration

### Prompt Architecture

BrandOS uses a structured prompt system with three components:

```
┌─────────────────────────────────────────────┐
│              SYSTEM PROMPT                   │
│  Role definition, capabilities, constraints │
└─────────────────────────────────────────────┘
                    +
┌─────────────────────────────────────────────┐
│              BRAND CONTEXT                   │
│  DNA, tone, patterns, samples               │
└─────────────────────────────────────────────┘
                    +
┌─────────────────────────────────────────────┐
│              USER REQUEST                    │
│  Content, intent, constraints               │
└─────────────────────────────────────────────┘
                    =
┌─────────────────────────────────────────────┐
│              AI RESPONSE                     │
│  Structured output with explanations        │
└─────────────────────────────────────────────┘
```

### Brand Guardian Prompt

The core prompt that powers brand checking and generation:

```typescript
const brandGuardianPrompt = `
You are BrandOS, an AI brand guardian. Your role is to:
1. Evaluate content against brand DNA
2. Identify specific alignment issues
3. Suggest concrete improvements
4. Generate on-brand alternatives

Brand DNA:
- Name: ${brand.name}
- Tone: ${JSON.stringify(brand.tone)}
- Keywords: ${brand.keywords.join(', ')}
- Do: ${brand.doPatterns.join('; ')}
- Don't: ${brand.dontPatterns.join('; ')}
- Voice Examples: ${brand.voiceSamples.join(' | ')}

Scoring Criteria:
- Tone alignment (30%): Match to tone sliders
- Keyword usage (20%): Brand vocabulary presence
- Pattern compliance (25%): Adherence to do/don't rules
- Voice consistency (25%): Similarity to examples

Output Format:
{
  "score": <0-100>,
  "issues": [<specific problems>],
  "strengths": [<what works>],
  "suggestions": [<improvements>],
  "revisedVersion": "<improved content>"
}
`;
```

### AI Model Configuration

| Use Case | Model | Temperature | Max Tokens |
|----------|-------|-------------|------------|
| Content Check | GPT-4 | 0.3 | 1,000 |
| Generation | GPT-4 | 0.7 | 2,000 |
| Tone Analysis | GPT-4 | 0.2 | 500 |
| Taste Translation | GPT-4 | 0.5 | 800 |
| Design Intent | GPT-4 | 0.6 | 1,000 |

---

## State Management

### Client-Side Store

```typescript
interface BrandStore {
  // Brand Data
  brands: BrandDNA[];
  currentBrandId: string | null;
  
  // Actions
  createBrand: (name: string) => void;
  deleteBrand: (id: string) => void;
  switchBrand: (id: string) => void;
  setBrandDNA: (updates: Partial<BrandDNA>) => void;
  
  // History
  history: HistoryItem[];
  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  
  // UI State
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // Design Features
  designIntents: DesignIntentBlock[];
  addDesignIntent: (intent: DesignIntentBlock) => void;
  deleteDesignIntent: (id: string) => void;
}
```

### Persistence Layer

```typescript
// Zustand persist middleware
export const useBrandStore = create<BrandStore>()(
  persist(
    (set, get) => ({
      // ... store implementation
    }),
    {
      name: 'brandos-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

---

## Chrome Extension Architecture

### Components

```
chrome-extension/
├── manifest.json       # Extension configuration
├── popup.html/css/js   # Popup interface
├── background.js       # Service worker
├── content.js/css      # Page injection
└── icons/              # Extension icons
```

### Communication Flow

```
Web Page                    Extension                    BrandOS Server
    │                           │                              │
    │  Select text              │                              │
    ├──────────────────────────→│                              │
    │                           │  POST /api/webhook/check     │
    │                           ├─────────────────────────────→│
    │                           │                              │
    │                           │  { score, issues, ... }      │
    │                           │←─────────────────────────────┤
    │  Display result           │                              │
    │←──────────────────────────┤                              │
```

### API Key Security

```javascript
// Stored in extension local storage
chrome.storage.local.set({
  serverUrl: 'https://brandos.app',
  apiKey: 'brandos_key_xxx'
});

// Used in requests
fetch(`${serverUrl}/api/webhook/check`, {
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
});
```

---

## Security Considerations

### Authentication

| Method | Use Case | Implementation |
|--------|----------|----------------|
| Session-based | Web app | Next-auth with database sessions |
| API Key | Chrome extension | Custom key generation and validation |
| Share Token | Public brand access | UUID tokens with read-only access |

### Data Protection

- All API routes validate user ownership of brands
- Share tokens provide read-only access
- API keys are hashed before storage
- Rate limiting on AI endpoints

### Environment Variables

```env
# Required
OPENAI_API_KEY=sk-...
DATABASE_URL=file:./dev.db

# Optional
BRANDOS_API_KEY=custom_key_for_extension
PINTEREST_ACCESS_TOKEN=...
```

---

## Scalability Considerations

### Current Architecture (MVP)

- Single SQLite database
- Serverless deployment on Vercel
- Direct OpenAI API calls

### Future Architecture (Scale)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   CDN       │────→│   Load      │────→│   App       │
│   Edge      │     │   Balancer  │     │   Servers   │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                    ┌─────────────────────────┼────────────────────────┐
                    │                         │                        │
                    ▼                         ▼                        ▼
            ┌─────────────┐           ┌─────────────┐          ┌─────────────┐
            │   Redis     │           │   Postgres  │          │   OpenAI    │
            │   Cache     │           │   Primary   │          │   via Queue │
            └─────────────┘           └─────────────┘          └─────────────┘
                                            │
                                            ▼
                                    ┌─────────────┐
                                    │   Postgres  │
                                    │   Replicas  │
                                    └─────────────┘
```

### Scaling Strategies

| Component | Strategy |
|-----------|----------|
| Database | Migrate to managed Postgres, add read replicas |
| AI Calls | Queue with rate limiting, response caching |
| Static Assets | CDN distribution |
| API | Horizontal scaling with load balancer |

---

## Development Workflow

### Local Setup

```bash
# Clone and install
git clone <repo>
cd brandos
npm install

# Environment setup
cp .env.example .env.local
# Add OPENAI_API_KEY

# Database setup
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

### Testing Strategy

| Type | Tool | Coverage Target |
|------|------|-----------------|
| Unit | Jest | Core functions |
| Integration | Playwright | API endpoints |
| E2E | Cypress | Critical paths |
| AI Output | Custom harness | Prompt regression |

---

## Monitoring and Observability

### Planned Instrumentation

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| API latency | Vercel Analytics | p95 > 2s |
| Error rate | Sentry | > 1% |
| AI cost | Custom tracking | > $X/day |
| Usage patterns | PostHog | Anomaly detection |

---

*Next: [User Journeys →](07-user-journeys.md)*








