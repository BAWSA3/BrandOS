# Research Agent Workflow Documentation

## Overview

The Research Agent is part of the BrandOS agent system, specifically designed for TCG (Trading Card Games) and collectibles content marketing. It aggregates news and trends from social platforms and converts them into content opportunities.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER PROMPT                              │
│    "Create content for me based on latest trends"               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CONDUCTOR                                 │
│  Routes to appropriate agent based on keywords/patterns         │
│  Keywords: research, trends, news, tcg, pokemon, mtg, etc.     │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     RESEARCH AGENT                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              DATA SOURCE AGGREGATOR                      │   │
│  │                                                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │   │
│  │  │ Twitter  │  │  Reddit  │  │ YouTube  │  │ Serper  │ │   │
│  │  │  (X)     │  │          │  │          │  │ (News)  │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                               │                                  │
│                               ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              CLAUDE AI SYNTHESIS                         │   │
│  │  - Analyzes raw data                                     │   │
│  │  - Identifies trending topics                            │   │
│  │  - Scores relevance (0-100)                              │   │
│  │  - Categorizes (news, trend, launch, etc.)              │   │
│  │  - Suggests content angles                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                               │                                  │
│                               ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              RESEARCH BRIEF OUTPUT                       │   │
│  │  - 8-12 synthesized topics                               │   │
│  │  - Market summary                                        │   │
│  │  - Trending keywords                                     │   │
│  │  - Vertical-specific insights                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   USER CURATION (UI)                             │
│  - Reviews suggested topics                                      │
│  - Selects which topics to generate content for                 │
│  - Chooses platforms (Twitter, Instagram, etc.)                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CONTENT AGENT                                │
│  - Receives selected topics                                      │
│  - Generates platform-specific drafts                           │
│  - Applies brand DNA (tone, voice, keywords)                    │
│  - Returns ready-to-review content                              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER REVIEW & PUBLISH                         │
│  - Reviews generated drafts                                      │
│  - Edits as needed                                               │
│  - Publishes to platforms                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Data Sources

| Source | What It Provides | API |
|--------|------------------|-----|
| **Twitter/X** | Trending hashtags, influencer posts, community discussions | X API (Basic tier) |
| **Reddit** | Subreddit posts, community sentiment, deal alerts | Public JSON API |
| **YouTube** | Video content from TCG channels | YouTube Data API v3 |
| **Serper** | News articles, blog posts, announcements | Serper (Google Search) |

### 2. Verticals Tracked

- **Pokemon TCG**: #PokemonTCG, r/pokemontcg, PSA, Charizard, etc.
- **Magic: The Gathering**: #MTGFinance, r/mtgfinance, reserved list, Commander
- **Yu-Gi-Oh!**: #YuGiOh, r/yugioh, Master Duel, ban list
- **Sports Cards**: #TheHobby, r/basketballcards, rookie cards, PSA/BGS
- **Other Collectibles**: Funko, comics, CGC grading

### 3. Topic Categories

- `news` - Breaking news and announcements
- `trend` - Viral topics and community trends
- `product-launch` - New set releases and products
- `price-alert` - Market movements and price changes
- `controversy` - Hot takes and debates
- `community` - Community discussions and sentiment
- `tournament` - Competitive events and results

## API Endpoints

### Research Agent API

```bash
# Aggregate trends
POST /api/agents/research
{
  "brandDNA": { ... },
  "action": "aggregate",
  "params": {
    "verticals": ["pokemon", "mtg"],
    "timeRange": "last-week"
  }
}

# Get quick summary
POST /api/agents/research
{
  "brandDNA": { ... },
  "action": "get-summary"
}

# Research-to-Content workflow
POST /api/agents/research
{
  "brandDNA": { ... },
  "action": "research-to-content",
  "params": {
    "selectedTopics": [...],
    "platforms": ["twitter", "instagram"]
  }
}
```

### Orchestration Workflow

```bash
# Full research-to-content pipeline
POST /api/agents/orchestrate
{
  "brandDNA": { ... },
  "workflow": "research-to-content",
  "params": {
    "verticals": ["pokemon", "mtg", "sports-cards"],
    "platforms": ["twitter", "instagram"],
    "contentPerTopic": 2
  }
}
```

## Usage Examples

### Example 1: Quick Research

```typescript
const agents = createAgents(brandDNA);

// Get research summary
const summary = await agents.getResearchSummary(['pokemon', 'mtg']);

console.log(summary.data);
// {
//   summary: "Pokemon TCG seeing increased interest...",
//   topTopics: [{ title: "New set announcement", vertical: "pokemon" }, ...],
//   trendingKeywords: ["Charizard", "PSA 10", "booster box", ...]
// }
```

### Example 2: Full Workflow

```typescript
const agents = createAgents(brandDNA);

// Step 1: Research trends
const research = await agents.researchTrends({
  verticals: ['pokemon', 'mtg', 'sports-cards'],
  timeRange: 'last-week',
});

// Step 2: Select top topics
const topTopics = agents.rankTopicsByRelevance(research.data.topics, {
  minRelevance: 60,
  sortBy: 'engagement',
}).slice(0, 5);

// Step 3: Generate content
const result = await agents.researchToContent({
  selectedTopics: topTopics,
  platforms: ['twitter', 'instagram'],
  contentPerTopic: 2,
});

console.log(result.content.data.pieces);
// Generated social media posts ready to review
```

### Example 3: End-State Prompt

The system supports the prompt:
> "Create a few pieces of content for me this week based on the latest news and trends in the past month"

This triggers:
1. Research Agent aggregates last month's trends
2. AI selects top relevant topics
3. User reviews and picks topics (via UI)
4. Content Agent generates drafts
5. User reviews and publishes

## UI Pages

### `/research` - Research Dashboard

- Vertical tabs (Pokemon, MTG, Yu-Gi-Oh, Sports, Other)
- Topic cards with relevance scores
- Filter by category and engagement level
- Select topics for content generation
- "Generate Content" button triggers workflow

### `/agents` - All Agents

- Unified chat with auto-routing
- Research agent accessible via prompts like "what's trending?"

## Environment Variables

```env
# Required
ANTHROPIC_API_KEY=...      # For Claude AI

# Data Sources (optional - graceful fallback if missing)
X_BEARER_TOKEN=...         # Twitter/X API
YOUTUBE_API_KEY=...        # YouTube Data API
SERPER_API_KEY=...         # Google Search via Serper

# Database
DATABASE_URL=...           # PostgreSQL connection
```

## Rate Limits

| Source | Limit | Cost |
|--------|-------|------|
| Twitter | 10K tweets/month | $100/month |
| Reddit | 60 req/min | Free |
| YouTube | 10K units/day | Free tier |
| Serper | 2,500/month | Free tier |

**Mitigation Strategies:**
- Cache results for 1-6 hours
- Reddit as primary source (free, no key needed)
- Graceful degradation when sources unavailable

## Database Schema

```prisma
model ResearchRun {
  id          String   @id
  status      String   // pending, running, completed, failed
  verticals   String   // JSON array
  topicsFound Int
  topics      ResearchTopic[]
}

model ResearchTopic {
  id              String
  title           String
  summary         String
  vertical        String
  category        String
  relevanceScore  Int
  sources         String  // JSON array
  keywords        String  // JSON array
}

model TopicSelection {
  id              String
  topicId         String
  status          String  // selected, content-generated
  contentTypes    String  // JSON array
}
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/agents/research.agent.ts` | Core research logic |
| `src/lib/agents/research.types.ts` | TypeScript interfaces |
| `src/lib/agents/sources/*.ts` | Data source integrations |
| `src/app/api/agents/research/route.ts` | API endpoint |
| `src/components/agents/ResearchDashboard.tsx` | UI dashboard |
| `src/app/research/page.tsx` | Research page |
