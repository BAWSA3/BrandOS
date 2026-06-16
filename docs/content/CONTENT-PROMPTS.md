# Content Prompt Snippets — mode switches for Jeffrey's Content project

Paste one at the start of a chat to lock Claude into a mode.

---

## Long-form ideation
```
Read VOICE.md, META.md, AUDIENCE.md, CONTENT-DECISIONS.md.
Current meta: articles / long-form single posts win — threads are
de-prioritized by the algorithm right now.

Generate 5 hooks for long-form posts (article or multi-paragraph
single) that either:
(a) build creator-economy-intelligence authority
(b) drive scans at brandos.com
(c) convert high-intent users to paid

Each hook must:
- Pass the "stranger stops scrolling" test
- Sound like me (match VOICE.md — titlecase for announcement
  register, lowercase for thinking-out-loud register)
- Avoid every word in CONTENT-CONSTRAINTS.md
- Be different from my recent wins in CONTENT-DECISIONS.md
- Work as an article or long-form single, not a numbered thread

Rank them from strongest to weakest. Defend #1.
```

## Draft in my voice
```
Draft this as a [article / long-form single / short single / quote tweet].
Default to long-form single or article unless I specify otherwise —
that's the current meta (see META.md).

Match VOICE.md EXACTLY:
- Dual-register caps (lowercase vs titlecase by mode)
- `>` for bullets, never `-` or `•`
- Zero em-dashes, zero ellipses
- Heavy line breaks (every sentence on its own line)
- Arrow CTAs (↴ →) when a CTA is needed
- "vibe coded" / "bawsa" / "hot take:" if they fit

If you use a word not in my samples, flag it with [NEW WORD].
If you use a construction I don't use, flag it with [NEW PATTERN].

Topic/angle:
[paste]
```

## Hook roast
```
Roast these hooks. For each one tell me:
- Which CONTENT-CONSTRAINTS it violates
- Whether it matches VOICE.md
- If a stranger would stop scrolling
- What it's trying too hard at

Then pick the strongest and rewrite it three ways.

Hooks:
[paste]
```

## Newsletter brief
```
Pull from project_soft_launch_metrics.md and whatever product
context I paste below.

Draft a newsletter issue with:
1. One real insight (not a recap — an argument)
2. One concrete story or example
3. One CTA — either scan at brandos.com OR upgrade to PRO

Length: ~400 words. Match VOICE.md. No fluff opener like
"Hope your week is going well."

Context from BrandOS HQ:
[paste]
```

## Content → product loop
```
I just got this reaction to a post:

[paste the reply / DM / quote]

1. Does this reveal a product gap BrandOS should know about?
2. If yes, format it for CUSTOMER-VOICE.md in the BrandOS HQ
   project (handle, date, quote verbatim, theme tag).
3. Does this suggest a follow-up post? If yes, draft one.
```

## Product → content loop
```
I just shipped this in BrandOS:

[paste — the feature, the why, the before/after]

Draft a thread about it that:
- Doesn't read like a product announcement
- Leads with the INSIGHT (why this matters), not the FEATURE
- Ends with something a non-customer would find useful even
  if they never try BrandOS

Match VOICE.md.
```

## Audience check
```
Read AUDIENCE.md. Given this post idea, tell me:
- Which audience segment does it land with
- Which does it alienate
- Is this a primary-audience post or secondary?
- Should I even write it this week given the April goal?

Idea:
[paste]
```

## Weekly content review (Sunday)
```
Pull from CONTENT-DECISIONS.md.
1. What pattern worked this week that I should run 3 more times?
2. What flopped and why?
3. What did I post that broke my CONTENT-CONSTRAINTS?
4. What's the single best post idea for next week?

Be specific. No "try different formats" fluff.
```

## Kill-or-ship mode (content version)
```
Given VOICE.md, AUDIENCE.md, CONTENT-CONSTRAINTS.md, and my
April paying-customer goal, should I post this?

Pick one: SHIP / KILL / REWRITE. Defend in 3 sentences.

Draft:
[paste]
```

---

## Adding new prompts
When you find yourself pasting the same context in 2+ chats,
distill into a snippet and add here.
