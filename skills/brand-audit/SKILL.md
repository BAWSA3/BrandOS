---
name: brand-audit
description: >
  Analyzes any creator or brand's content to produce a brand DNA audit.
  Reverse-engineers themes, content ratios, CTA patterns, voice, and gaps.
  TRIGGER when user says 'brand audit', 'audit this profile', 'analyze their brand',
  'score this brand', 'brand DNA', 'review their content', or 'what's their brand?'
---

# Brand Audit Skill

You perform brand DNA audits on creator/brand X profiles using the BrandOS framework.

## What This Produces

A complete brand audit report with:
1. Theme mapping (what topics they repeat)
2. Content ratio analysis (vulnerability vs expertise, tactical vs philosophical)
3. CTA pattern analysis (what actions they ask for, how often)
4. Voice fingerprint (tone, style, distinguishing patterns)
5. Gap analysis with scores
6. Actionable recommendations

## Workflow

### Step 1: Gather Content
Ask the user for one of:
- An X handle to analyze
- A set of 10-20 recent posts (pasted or linked)
- A Typefully draft list

If given a handle, ask the user to paste their last 15-20 posts so you can analyze them.

### Step 2: Theme Mapping
Read `references/theme-framework.md` for the analysis methodology.

Identify the 3-5 recurring themes across their posts:
- What topics appear most frequently?
- What's their core message (the one thing they repeat)?
- What are they fighting AGAINST? (their enemy/positioning)

### Step 3: Content Ratio Analysis
Categorize each post:
- Tactical (how-to, framework, data) vs Philosophical (takes, reflections)
- Vulnerable (struggles, failures) vs Authoritative (expertise, wins)
- Hot take vs Helpful
- Single tweet vs Thread vs Other format

Calculate the ratios. Strong brands have consistent ratios.

### Step 4: CTA Analysis
For each post, identify:
- Does it have an explicit CTA? (yes/no)
- What type? (reply, RT, save, tag, follow, quote RT, none)
- How specific is it? (vague vs actionable)

Calculate: CTA rate (% of posts with CTAs) and CTA variety.

### Step 5: Voice Fingerprint
Analyze:
- Case style (lowercase? Title Case? Mixed?)
- Sentence length (short punchy? long flowing?)
- Punctuation habits (periods? em dashes? ellipsis?)
- Signature phrases or patterns
- Emoji usage (heavy? light? none?)
- Overall tone (casual? professional? irreverent? motivational?)

### Step 6: Gap Analysis Scoring
Score each dimension 0-100:

| Dimension | What It Measures |
|-----------|-----------------|
| Tone Alignment | How consistent is their voice across posts? |
| Consistency | Do they post regularly with predictable themes? |
| Hook Strength | Do their first lines stop the scroll? |
| Format Match | Are they using the right formats for their goals? |
| Engagement Velocity | Are impressions/engagement growing or flat? |
| CTA Effectiveness | Do their posts drive action beyond likes? |

### Step 7: Generate Report

Output the report in this format:

```
BRAND AUDIT: @[handle]
Generated: [date]

═══════════════════════════════
BRAND DNA SUMMARY
═══════════════════════════════

CORE MESSAGE: [1 sentence]
ENEMY: [what they're against]
ARCHETYPE: [builder / educator / provocateur / curator / storyteller]

═══════════════════════════════
THEME MAP
═══════════════════════════════

1. [Theme] — [frequency %] — [example post excerpt]
2. [Theme] — [frequency %] — [example]
3. [Theme] — [frequency %] — [example]
4. [Theme] — [frequency %] — [example]
5. [Theme] — [frequency %] — [example]

═══════════════════════════════
CONTENT RATIOS
═══════════════════════════════

Tactical ████████░░ vs Philosophical ██░░░░░░░░
Authority ██████░░░░ vs Vulnerability ████░░░░░░
Hot Takes ███░░░░░░░ vs Helpful ███████░░░

Format: [X]% single tweets / [X]% threads / [X]% other

═══════════════════════════════
CTA ANALYSIS
═══════════════════════════════

CTA Rate: [X]% of posts have a CTA
Most Used: [type]
Missing: [types they never use]
Quality: [vague / decent / sharp]

═══════════════════════════════
VOICE FINGERPRINT
═══════════════════════════════

Style: [description]
Distinguishing patterns: [list]
Reads like: [comparison or vibe]

═══════════════════════════════
GAP SCORES
═══════════════════════════════

TONE ALIGNMENT    [████████████████░░░░]  [XX]
CONSISTENCY       [███████████████░░░░░]  [XX]
HOOK STRENGTH     [██████████████░░░░░░]  [XX]
FORMAT MATCH      [█████████████░░░░░░░]  [XX]
ENGAGEMENT VEL.   [███████████░░░░░░░░░]  [XX]
CTA EFFECTIVENESS [████████░░░░░░░░░░░░]  [XX]

═══════════════════════════════
TOP 3 RECOMMENDATIONS
═══════════════════════════════

1. [Most impactful change]
2. [Second priority]
3. [Third priority]
```

## Comparison Mode

If the user asks to compare two profiles, run the audit on both and add a comparison section showing where each profile is stronger/weaker.
