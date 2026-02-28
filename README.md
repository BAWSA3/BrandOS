# BrandOS

AI-powered brand operating system that turns static brand guidelines into a living, intelligent system. BrandOS checks, generates, and scales content while preserving brand integrity across every channel.

**Live:** [mybrandos.app](https://mybrandos.app)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui, Radix UI |
| State | Zustand v5 (client), Server Components (server) |
| Database | Prisma v6, PostgreSQL (Supabase) |
| Auth | Supabase Auth (X/Twitter OAuth, SSR) |
| AI | Anthropic Claude, Google Gemini |
| File Storage | Cloudinary |
| Analytics | Vercel Analytics, PostHog |
| Error Tracking | Sentry v10 |
| Email | Resend |
| Deployment | Vercel (push-to-deploy, preview URLs) |
| Validation | Zod, React Hook Form |
| Onchain | EAS Attestations (Avalanche) |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A Supabase project (for auth + database)
- Anthropic API key (for AI features)

### 1. Clone and install

```bash
git clone <repo-url>
cd brandos
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the required values. See [Environment Variables](#environment-variables) below.

### 3. Set up the database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local`. Required variables are marked with `*`.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` * | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` * | Supabase public anon key |
| `DATABASE_URL` * | Pooled Postgres connection (pgbouncer) |
| `DIRECT_URL` * | Direct Postgres connection (for migrations) |
| `ANTHROPIC_API_KEY` * | Claude AI for content analysis + generation |
| `GOOGLE_GEMINI_API_KEY` | Gemini for visual analysis |
| `X_BEARER_TOKEN` | X/Twitter API for brand score |
| `RESEND_API_KEY` | Email sending |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog product analytics |
| `CLOUDINARY_CLOUD_NAME` | File upload cloud storage |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `NEXT_PUBLIC_ONCHAIN_CHAIN` | EAS attestation chain target |
| `ONCHAIN_PLATFORM_PRIVATE_KEY` | Wallet key for signing attestations |

## Project Structure

```
src/
  app/              Next.js App Router pages and API routes
    api/            ~90 API endpoints organized by feature
    app/            Main application dashboard
    agents/         AI agent interfaces
    score/          Brand score pages
    ...
  components/       React components
    ui/             shadcn/ui primitives (button, dialog, form, etc.)
    agents/         AI agent chat components
    brandkit/       Brand kit management
    calendar/       Content calendar
    dashboard/      Dashboard widgets
    onchain/        Blockchain attestation UI
    workflow/       Content workflow (React Flow)
    ...
  hooks/            Custom React hooks
  lib/              Utilities and integrations
    agents/         AI agent system (research, content, authority, analytics)
    schemas/        Zod validation schemas
    onchain/        EAS attestation helpers
    analytics.ts    Event tracking (Vercel + PostHog)
    cloudinary.ts   File upload to Cloudinary
    db.ts           Prisma database client
    store.ts        Zustand stores
    supabase.ts     Supabase client
    ...
  prompts/          AI system prompts
  types/            TypeScript type definitions
prisma/
  schema.prisma     Database schema (User, Brand, ContentDraft, etc.)
docs/               Product documentation (21 files)
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (generates Prisma client first) |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting without writing |

## Key Architecture Decisions

- **Supabase Auth over Clerk**: Chose Supabase to keep auth and database on the same platform, reducing complexity. X/Twitter OAuth is the primary login method.
- **Zustand over Redux**: Lightweight client state with persistence middleware. Server Components handle server-side data.
- **REST routes over tRPC**: Started with REST API routes early; Server Actions used for new form mutations going forward.
- **Cloudinary over local uploads**: Vercel's serverless runtime has no persistent filesystem. Cloudinary provides CDN delivery, image transformations, and reliable storage.
- **PostHog + Vercel Analytics**: Vercel for performance metrics, PostHog for product analytics (funnels, feature usage, session replays).
- **EAS on Avalanche**: Onchain attestations for brand DNA, content scores, and voice fingerprints using Ethereum Attestation Service.

## Documentation

Detailed product and technical docs live in [`docs/`](docs/):

- [Problem Statement](docs/02-problem-statement.md)
- [Solution Overview](docs/03-solution-overview.md)
- [Core Features](docs/05-core-features.md)
- [Technical Architecture](docs/06-technical-architecture.md)
- [User Journeys](docs/07-user-journeys.md)
- [Product Roadmap](docs/08-product-roadmap.md)
- [Business Model](docs/09-business-model.md)
