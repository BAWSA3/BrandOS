# BrandOS

> Your brand, everywhere it needs to be. **Define. Check. Generate.**

BrandOS is the AI-powered operating system for brand consistency. We help teams define brand DNA, check content for alignment, and generate on-brand content at scale.

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local

# Initialize database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see BrandOS.

---

## Features

### Core Capabilities

- **Brand DNA System** - Define colors, tone sliders, keywords, and voice patterns
- **Content Check Engine** - Real-time brand alignment scoring with AI suggestions
- **AI Content Generation** - Generate on-brand content for any platform
- **Tone Analysis** - Analyze content across formality, energy, confidence, and style

### Intelligence Features

- **Design Intent Blocks** - Translate natural language into design rules
- **Taste Translation** - Convert subjective feedback into actionable guidelines
- **Brand Cohesion Analysis** - Detect consistency issues across your content

### Protection Layer

- **Creator Guardrails** - AI-powered approval workflows for teams
- **Brand Safe Zones** - Define locked vs. flexible brand elements
- **Taste Protection** - Prevent over-design and maintain brand restraint
- **Brand Memory** - Learn from past successes and failures

### Adaptation

- **Platform Adapter** - Optimize content for Twitter, LinkedIn, Instagram, TikTok, and more
- **Context-Aware Tone** - Adjust voice for launches, crises, celebrations, and apologies

### Access

- **Chrome Extension** - Check content anywhere on the web
- **Brand Sharing** - Share brand DNA with teams and partners
- **Multi-Brand Support** - Manage multiple brands in one interface

---

## Documentation

Comprehensive documentation is available in the [`docs/`](docs/) folder:

### Foundation Documents

| Doc | Title | Description |
|-----|-------|-------------|
| [01](docs/01-executive-summary.md) | Executive Summary | High-level overview and value proposition |
| [02](docs/02-problem-statement.md) | Problem Statement | The brand consistency crisis |
| [03](docs/03-solution-overview.md) | Solution Overview | How BrandOS solves brand fragmentation |
| [04](docs/04-target-market.md) | Target Market | Customer profiles and segments |
| [05](docs/05-core-features.md) | Core Features | Detailed feature breakdown |
| [06](docs/06-technical-architecture.md) | Technical Architecture | System design and AI integration |
| [07](docs/07-user-journeys.md) | User Journeys | Key workflows and experiences |
| [08](docs/08-product-roadmap.md) | Product Roadmap | Current state and future vision |
| [09](docs/09-business-model.md) | Business Model | Pricing and revenue strategy |
| [10](docs/10-go-to-market.md) | Go-to-Market | Launch and growth approach |
| [11](docs/11-team-advisors.md) | Team & Advisors | Founding team structure |
| [12](docs/12-traction-metrics.md) | Traction & Metrics | Progress and KPIs |

### Market Validation

| Doc | Title | Description |
|-----|-------|-------------|
| [13](docs/13-market-validation-case-studies.md) | Case Studies Overview | Methodology for competitor analysis |
| [14](docs/14-case-study-brand-ai.md) | Case Study: Brand.ai | AI brand management analysis |
| [15](docs/15-case-study-omneky.md) | Case Study: Omneky | AI creative platform analysis |
| [16](docs/16-case-study-frontify.md) | Case Study: Frontify | Brand management leader analysis |
| [17](docs/17-case-study-google-pomelli.md) | Case Study: Google Pomelli | Big tech brand tool analysis |
| [18](docs/18-feature-validation-mapping.md) | Feature Validation | Market evidence for features |
| [19](docs/19-competitive-positioning.md) | Competitive Positioning | Differentiation strategy |
| [20](docs/20-category-definition.md) | Category Definition | Brand Operating System category |
| [21](docs/21-investor-summary.md) | Investor Summary | Consolidated pitch |

---

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Prisma with SQLite (dev) / PostgreSQL (prod)
- **AI:** OpenAI GPT-4
- **State:** Zustand with persistence

---

## Project Structure

```
brandos/
├── docs/                    # Documentation (21 documents)
├── chrome-extension/        # Browser extension for ubiquitous checking
├── prisma/                  # Database schema
├── public/                  # Static assets and fonts
└── src/
    ├── app/                 # Next.js pages and API routes
    │   ├── api/             # API endpoints
    │   └── ...              # Page components
    ├── components/          # React components
    ├── lib/                 # Utilities, types, store
    └── prompts/             # AI prompt templates
```

---

## Chrome Extension

BrandOS includes a Chrome extension for checking content anywhere on the web:

```bash
# Navigate to extension folder
cd chrome-extension

# Load in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the chrome-extension folder
```

See [Chrome Extension README](chrome-extension/README.md) for details.

---

## Environment Variables

```env
# Required
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=file:./dev.db

# Optional
BRANDOS_API_KEY=your_api_key
PINTEREST_ACCESS_TOKEN=your_token
```

---

## Learn More

- [Documentation Index](docs/README.md) - Start here for comprehensive docs
- [Core Features](docs/05-core-features.md) - Deep dive into capabilities
- [Technical Architecture](docs/06-technical-architecture.md) - System design
- [Competitive Positioning](docs/19-competitive-positioning.md) - Market position

---

## License

Proprietary - All rights reserved.

---

*BrandOS: Your brand, everywhere it needs to be.*
