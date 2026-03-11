---
name: content-calendar
description: >
  Creates structured weekly or monthly content calendars for X/Twitter with
  2x/day posting cadence. Generates Notion database entries and Typefully drafts.
  TRIGGER when user says 'content calendar', 'plan my week', 'schedule content',
  'plan my posts', 'weekly content', 'monthly calendar', or 'what should I post this week'.
---

# Content Calendar Skill

You build structured content calendars that follow the 2x/day posting system and can push them to Notion and Typefully.

## Context

Read `references/weekly-cadence.md` for the posting system rules.

This skill coordinates across:
- **Notion** — creates database entries in the BrandOS Content Calendar
- **Typefully** — creates drafts ready to schedule for @BawsaXBT (social set ID: 127543)

## Workflow

### Step 1: Determine Scope
Ask the user:
- How many days? (default: 7 days / 1 week)
- Starting from which date?
- Any specific topics or events to include?
- Any posts to skip or adjust?

### Step 2: Generate Calendar
For each day, produce:
- **Post 1** (Anchor) — format, theme, CTA type, gap targeted, full post text
- **Post 2** (Lighter) — format, theme, CTA type, gap targeted, full post text

Follow the weekly cadence:
| Day | Post 1 | Post 2 |
|-----|--------|--------|
| Mon | Framework | Conversational |
| Tue | Thread | Observation / QRT |
| Wed | Hot Take | Personal Insight |
| Thu | Build Log | Quick Insight |
| Fri | Thread / Data | Shipping Update |
| Sat | Community | Weekend Personal |
| Sun | Reflection | Week Recap |

### Step 3: Present for Review
Show the full calendar in a table format:

```
| Date | Slot | Title | Format | CTA | Gap |
|------|------|-------|--------|-----|-----|
| Mar 11 | P1 | brand DNA framework | Thread | RT + Follow | CTA, Format |
| Mar 11 | P2 | name your 3 themes | Single Tweet | Reply | CTA |
```

Then show each post's full content.

### Step 4: Push to Notion (if requested)
Create entries in the BrandOS Content Calendar database:
- Data source ID: `79c5e486-0e2a-4a39-a0cf-2551b7c01ea3`
- Properties: Post (title), Date, Day, Format, Theme, CTA Type, Gap Targeted, Week
- Content: the full post text in a code block

### Step 5: Push to Typefully (if requested)
Create drafts on @BawsaXBT (social set ID: 127543):
- Platform: X only (enabled)
- For threads: split into multiple posts array
- Set draft_title with the P1/P2 prefix and topic
- Do NOT schedule — leave as drafts unless the user explicitly asks to schedule

## Rules

1. Every post has a CTA — no exceptions
2. Vary CTA types — don't repeat the same one 3 days in a row
3. At least 2 threads per week (Tuesday + Friday)
4. Maximum 1 value offer / reply trigger per week
5. Sunday Post 2 is always a week recap
6. Use lowercase voice, direct, code-aesthetic
7. Reference real things: BrandOS, content intelligence, vibe coding journey
8. Include hashtags where natural: #buildinpublic, #vibecoding

## Notion Database Schema

```
Post: title (string)
Date: date
Day: select [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
Format: select [Thread, Single Tweet, Data Post]
Theme: select [Framework, Hot Take, Behind the Scenes, Community, Reflection, Data Analysis, Educational]
CTA Type: select [RT + Follow, Agree/Disagree, Reply With Yours, Tag Someone, Save This, Drop Handle, Quote RT]
Gap Targeted: multi_select [CTA, Format, Velocity, Hook]
Week: select [Week 1 (Mar 11-16), Week 2 (Mar 17-23), Week 3 (Mar 24-31)]
```

## Typefully Integration

Social sets available:
- BAWSA: social_set_id = 127543, username = @nftbawsa / @BawsaXBT
- Relique: social_set_id = 258268, username = @ReliqueGlobal
- Skillcade: social_set_id = 260664, username = @skllcade

Default to BAWSA unless specified otherwise.
