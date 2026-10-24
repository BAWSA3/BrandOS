---
name: market-research
description: >
  Runs the BrandOS market research agent: competitor profiles and demand
  signals for strategy and GTM, written as cited briefs to docs/research/.
  TRIGGER when user says '/market-research', 'market research', 'research
  competitors', 'competitor research', 'who else does this', 'demand signals',
  'what are creators asking for', or 'deep dive on <competitor>'.
---

# /market-research

Usage:

- `/market-research` or `/market-research competitors`: competitor sweep
- `/market-research demand`: demand signals (what creators, SMMs, brands want)
- `/market-research deep-dive <name or question>`: one company or one question

## What to do

1. Work out the mode from the arguments. No arguments → `competitors`.
2. Launch the `market-research` subagent (Agent tool,
   `subagent_type: "market-research"`) with a prompt that gives: the mode, any
   name/question, today's date, and anything the user said about focus
   (a niche, a competitor, a market). Run `competitors` and `demand` as two
   agents in parallel when the user asks for both.
3. When it returns, read the brief it wrote and check it before relaying:
   every claim has a link, prices have an "as of" date, and nothing looks
   invented. Fix or flag what doesn't pass.
4. Tell the user: the five-line answer, the brief's path as a link, and the one
   thing to act on. Don't paste the whole brief.
5. Don't commit. If they want it kept, the research files go in a docs PR into
   `staging` like everything else (docs/AGENT-PROTOCOL.md).
