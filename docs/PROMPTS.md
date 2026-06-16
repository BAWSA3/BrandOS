# Prompt Snippets — mode switches for Claude.ai Project

Paste one of these at the start of a chat to lock Claude into a mode.
Stops the "re-explain what we're doing" overhead every conversation.

---

## Roast mode — stress-test an idea
```
Roast this idea. Stress-test the revenue thesis.
Who would cancel after 30 days?
What does CUSTOMER-VOICE.md actually say about this need?
Does CURRENT-STATE.md show we already have something that solves it?
Does DECISIONS.md or KILLED-IDEAS.md already rule on this?
Be blunt. No hedging.

Idea:
[paste idea]
```

## Handoff mode — planning → Claude Code
```
Turn this into a Claude Code brief. Include:
1. Goal (1 sentence, measurable)
2. Acceptance criteria (bullets)
3. Files likely touched — check CURRENT-STATE.md
4. Non-goals — what NOT to build
5. Revenue or retention thesis — one line
6. Rollback plan if it bombs

Idea:
[paste]
```

## Kill-or-ship mode — force a decision
```
Given DECISIONS.md, KILLED-IDEAS.md, CONSTRAINTS.md, and my
April paying-customer goal, should this live or die?
Pick one. Defend it in 3 sentences. No "it depends."

Idea:
[paste]
```

## Prioritization mode — what to do this week
```
Read CURRENT-STATE.md and CUSTOMER-VOICE.md.
Given April paying-customer goal and $15-20k/mo target, what's
the ONE bet this week?
Output:
- The bet (1 sentence)
- Why this over the 3 most tempting alternatives
- What "shipped" looks like by Friday
- What I explicitly won't do this week
```

## Weekly review — Sunday evening
```
Weekly review. Pull from DECISIONS.md, CUSTOMER-VOICE.md,
CURRENT-STATE.md, KILLED-IDEAS.md.
1. What should I kill this week?
2. What's the one bet for next week?
3. What feedback am I ignoring?
4. What decision am I avoiding making?
Be direct.
```

## Positioning mode — sharpen the pitch
```
Read docs 19-competitive-positioning.md, 20-category-definition.md,
project_strategic_vision.md, CUSTOMER-VOICE.md.
Pitch BrandOS in:
- 1 sentence for a retail creator
- 1 sentence for a B2B platform buyer (Kreatorsverse-style)
- 1 sentence for an investor
Each must pass the "so what" test.
```

## Pricing mode — evaluate a price change
```
Current pricing: FREE / PRO $29 / AGENCY $99 / ENTERPRISE custom
+ one-time products ($4.99 / $9 / $19 / $39).
Proposed change:
[paste change]
Evaluate:
- Who this wins
- Who this loses
- What CUSTOMER-VOICE.md says about willingness to pay
- Competitive implications (check 19-competitive-positioning.md)
Recommend: ship / A-B / reject.
```

---

## Adding new prompts
When you find yourself re-typing the same context in 2+ chats,
distill it into a snippet and add it here.
