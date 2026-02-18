# Voice Fingerprint & Authenticity Guard — Architecture

## Plain-English Summary

### What is the Voice Fingerprint?

The Voice Fingerprint is a detailed model of **how a creator actually writes**. Not just "professional" or "casual" — it captures the specific habits, quirks, and patterns that make their writing recognizably *theirs*. Think of it like a writing DNA test.

### Step-by-Step: How a Creator Sets It Up

1. **Go to Define > Voice Print** in BrandOS
2. **Paste 5+ writing samples** — tweets, blog posts, emails, LinkedIn posts, anything they've written
3. **Click "Analyze"** — Claude reads every sample and extracts patterns across 9 dimensions:
   - **Sentence patterns** — Do they write short punchy sentences? Long flowing ones? Fragments?
   - **Vocabulary** — Simple or advanced words? Jargon? Signature words they overuse?
   - **Formatting** — Emojis? Bold/italic? Short paragraphs or walls of text?
   - **Rhetoric** — Do they persuade with data, stories, analogies, or hot takes?
   - **Thinking style** — First person? Assertive or hedging? Nuanced or black-and-white?
   - **Content structure** — How they open, transition, and close pieces
   - **Signature elements** — The "unmistakably them" markers (e.g., always starts with a question)
   - **Anti-patterns** — Things they'd never say (e.g., "Excited to announce!", "In today's fast-paced world")
   - **Metadata** — Sample count, confidence score, when it was last updated
4. **See the radar chart** — A visual overview of their voice profile across 7 axes
5. **Click "Show Me The Difference"** — Generates the same content with vs. without the fingerprint so they can see the impact side-by-side

### Step-by-Step: How It Works During Content Check

1. Creator pastes content in **Check** phase (same as before)
2. BrandOS runs the **brand alignment check** (existing feature — scores against tone, keywords, patterns)
3. If a Voice Fingerprint exists, BrandOS **also** runs an **authenticity check** (new)
4. Two scores appear side by side:
   - **Brand Alignment** — Does this match the brand guidelines? (0-100)
   - **Authenticity** — Does this sound like the creator actually wrote it? (0-100)
5. If authenticity is low, **specific flags** appear:
   - Each flag highlights the exact phrase that sounds generic/AI-written
   - Shows the severity (low/medium/high)
   - Explains *why* it was flagged (e.g., "This creator never uses corporate filler like 'leverage'")
   - Suggests a rewrite in the creator's actual voice
6. Creator can click **"Rewrite All Flagged"** — BrandOS rewrites every flagged phrase to match their voice, then re-scores

### Step-by-Step: How It Works During Content Generation

1. Creator enters a prompt in **Generate** phase (same as before)
2. If a Voice Fingerprint exists, BrandOS automatically:
   - Compresses the fingerprint into a ~200-token summary
   - Injects it into the generation prompt alongside brand DNA
   - Adds explicit anti-AI rules ("never use these phrases")
3. The generated content comes out already matching the creator's voice
4. BrandOS **auto-runs an authenticity check** on the output
5. An authenticity score badge appears on the generated content
6. If the score is low, the **authenticity pipeline** can retry:
   - Flag the AI-sounding phrases
   - Rewrite them in the creator's voice
   - Re-check the score
   - Accept if improved, keep the best version (max 2 retries)

### Where the Fingerprint Gets Used

- **Check API** (`/api/check`) — Returns authenticity score alongside brand alignment
- **Generate API** (`/api/generate`) — Fingerprint summary injected into prompt
- **Content Agent** — All agent-generated content uses the fingerprint
- **Brand Advisor** — Chat responses match the creator's voice in examples
- **Brand Health** — Voice Match dimension uses fingerprint for more accurate scoring

### Key Concept: Summary vs Full Fingerprint

- The **full fingerprint** is ~2000 tokens of structured JSON — too large to include in every prompt
- The **summary** is ~200 tokens — a compressed version with just the rules, anti-rules, and signature markers
- Full fingerprint is used for **scoring** (needs all the detail to evaluate)
- Summary is used for **generation** (gives the AI enough to match the voice without eating prompt budget)

---

## Visual Diagrams

### How It Works (High-Level Flow)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DEFINE PHASE                                     │
│                                                                         │
│  ┌──────────────┐    ┌──────────────────┐    ┌────────────────────┐    │
│  │ Creator       │───▶│ Extraction API   │───▶│ Voice Fingerprint  │    │
│  │ Writing       │    │ (Claude Sonnet)  │    │ (stored per brand) │    │
│  │ Samples       │    │                  │    │                    │    │
│  │ (5+ pieces)   │    │ Analyzes:        │    │ 9 dimensions:      │    │
│  │               │    │ - Patterns       │    │ - Sentences        │    │
│  │ Tweets,       │    │ - Vocabulary     │    │ - Vocabulary       │    │
│  │ Posts,        │    │ - Rhetoric       │    │ - Formatting       │    │
│  │ Emails...     │    │ - Anti-patterns  │    │ - Rhetoric         │    │
│  └──────────────┘    └──────────────────┘    │ - Thinking Style   │    │
│                                               │ - Content Struct.  │    │
│                                               │ - Signatures       │    │
│                                               │ - Anti-patterns    │    │
│                                               │ - Metadata         │    │
│                                               └────────┬───────────┘    │
│                                                        │                │
│                              ┌──────────────────────────┘                │
│                              ▼                                           │
│                    ┌──────────────────┐                                  │
│                    │ Summary (~200    │  Compact version for             │
│                    │ tokens)          │  embedding in prompts            │
│                    │ - Voice rules    │                                  │
│                    │ - Anti-rules     │                                  │
│                    │ - Markers        │                                  │
│                    └────────┬─────────┘                                  │
└─────────────────────────────┼───────────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   CHECK PHASE    │ │  GENERATE PHASE  │ │  AGENTS          │
│                  │ │                  │ │                  │
│ Content in ──────│ │ Prompt in ───────│ │ Content Agent    │
│      │           │ │      │           │ │ Brand Advisor    │
│      ▼           │ │      ▼           │ │      │           │
│ Brand Check +    │ │ Generate with    │ │ Fingerprint      │
│ Authenticity     │ │ Voice Fingerprint│ │ injected into    │
│ Check            │ │ Instructions     │ │ all prompts      │
│      │           │ │      │           │ │                  │
│      ▼           │ │      ▼           │ └──────────────────┘
│ ┌────────────┐   │ │ ┌────────────┐   │
│ │ Dual Score │   │ │ │ Content    │   │
│ │ Display:   │   │ │ │ Output     │   │
│ │            │   │ │ │      │     │   │
│ │ Brand: 85  │   │ │ │      ▼     │   │
│ │ Auth:  72  │   │ │ │ Auto-check │   │
│ │            │   │ │ │ Authenticity│   │
│ │ + Flags    │   │ │ │      │     │   │
│ │ + Fix      │   │ │ │      ▼     │   │
│ │   button   │   │ │ │ Score badge│   │
│ └────────────┘   │ │ └────────────┘   │
└──────────────────┘ └──────────────────┘
```

### The Authenticity Loop (Post-Generation Pipeline)

**What it does:** After generating content, this loop ensures the output actually sounds like the creator — not like generic AI.

1. Content is generated using the fingerprint-enhanced prompt
2. The authenticity engine scores it (0-100 across 7 dimensions)
3. **If score >= 70** — Content passes. Ship it.
4. **If score < 70** — The engine flags every phrase that sounds AI-generated or generic
5. A rewrite pass fixes each flagged phrase in the creator's actual voice
6. The rewritten version is scored again
7. If the new score is better, it replaces the original. If not, keep the best version.
8. This repeats up to 2 times total, then returns the best result regardless

```
  Generate          Check               Rewrite (if <70)      Re-check
  Content    ───▶   Authenticity  ───▶  Flagged Phrases  ───▶  Score
     │              Score                    │                    │
     │              ┌────┐                   │                    │
     │              │ 85 │ ≥ 70? ── YES ──▶ DONE (ship it)      │
     │              └────┘                                       │
     │                │ NO                                       │
     │                ▼                                          │
     │           Flag specific                                   │
     │           phrases that                                    │
     │           sound "AI"                                      │
     │                │                                          │
     │                ▼                                          │
     │           Rewrite in                                      │
     │           creator's voice ──────────────────────────────▶ │
     │                                                           │
     │                                         Improved?         │
     │                                         YES → Accept      │
     │                                         NO  → Keep best   │
     │                                                           │
     └───────────────── max 2 retries ──────────────────────────┘
```

## File Map

Where everything lives in the codebase. Three layers:

- **`lib/`** — Types, state, and business logic (the "brain")
- **`prompts/`** + **`app/api/`** — AI prompts and API endpoints (the "voice")
- **`components/`** + **`app/app/page.tsx`** — UI components and page wiring (the "face")

```
src/
├── lib/
│   ├── voice-fingerprint.ts         ← Types: VoiceFingerprint, AuthenticityScore,
│   │                                   AuthenticityFlag, VoiceFingerprintSummary
│   │                                   Helpers: summarizeFingerprint(), formatSummaryForPrompt()
│   │
│   ├── voice-fingerprint-pipeline.ts ← generateWithAuthenticity() — the retry loop
│   │
│   ├── types.ts                     ← Added: voiceFingerprint? to BrandDNA
│   ├── store.ts                     ← Added: voiceFingerprints (Record<brandId, VoiceFingerprint>)
│   ├── brand-health.ts              ← Enhanced: computeVoiceMatch() uses fingerprint
│   │
│   └── agents/
│       ├── types.ts                 ← Added: voiceFingerprint? to AgentContext
│       └── content.agent.ts         ← Injects fingerprint summary into content prompts
│
├── prompts/
│   ├── voice-fingerprint.ts         ← All AI prompts:
│   │                                   - buildFingerprintExtractionPrompt()
│   │                                   - buildFingerprintRefinementPrompt()
│   │                                   - buildAuthenticityCheckPrompt()
│   │                                   - buildAuthenticityRewritePrompt()
│   │                                   - buildVoiceFingerprintInstructions()
│   │
│   ├── brand-guardian.ts            ← Enhanced: buildBrandContext() + buildGeneratePrompt()
│   │                                   accept + inject fingerprint summary
│   │
│   └── brand-advisor.ts             ← Enhanced: buildAdvisorSystemPrompt()
│                                       includes fingerprint for advisor chat
│
├── app/api/voice-fingerprint/
│   ├── extract/route.ts             ← POST: samples[] → VoiceFingerprint + Summary
│   ├── check-authenticity/route.ts  ← POST: content + fingerprint → AuthenticityScore
│   └── rewrite/route.ts             ← POST: content + fingerprint + flags → rewritten content
│
├── app/api/
│   ├── check/route.ts               ← Enhanced: accepts voiceFingerprint, returns authenticityScore
│   └── generate/route.ts            ← Enhanced: accepts voiceFingerprint summary
│
├── components/
│   ├── VoiceFingerprint.tsx          ← Main Define > Voice Print page
│   │                                   Sample collection, radar chart, before/after preview
│   │
│   ├── VoiceFingerprintRadar.tsx     ← SVG radar chart (7 axes)
│   │
│   ├── VoiceFingerprintMini.tsx      ← Compact badge for Check/Generate phases
│   │
│   └── PhaseNavigation.tsx           ← Added 'voiceprint' tab to Define phase
│
├── app/app/page.tsx                  ← Wired in:
│                                       - Voice Print tab in Define
│                                       - Authenticity score + flags in Check
│                                       - Auto authenticity check after Generate
│                                       - VoiceFingerprintMini indicator
│
└── prisma/schema.prisma              ← Added: voiceFingerprint String? to Brand model
```

## Data Flow Summary

| Action | Input | AI Model | Output |
|--------|-------|----------|--------|
| Extract fingerprint | 5+ writing samples | Claude Sonnet 4 | VoiceFingerprint JSON |
| Refine fingerprint | existing FP + new samples | Claude Sonnet 4 | Updated VoiceFingerprint |
| Check authenticity | content + fingerprint | Claude Sonnet 4 | 0-100 score + flags |
| Rewrite flagged | content + FP + flags | Claude Sonnet 4 | Rewritten content |
| Generate with FP | prompt + brand DNA + FP summary | Claude Sonnet 4 | Fingerprinted content |

## Why This Matters

**Problem:** 52% of consumers disengage with content they suspect is AI-generated. Trust in AI content dropped from 60% → 26%.

**Solution:** Every piece of content gets filtered through a granular model of the creator's actual writing style. The fingerprint captures _how_ they write (sentence rhythms, vocabulary quirks, formatting habits, rhetorical patterns) — not just tone sliders.

**Result:** AI-generated content that sounds unmistakably like the creator, not like "ChatGPT wrote this."
