# Spec: Voice rules (28 Oct 2026)

Status: spec. **Build after Nov 2**, after or alongside [Rough thought → angles](ROUGH-THOUGHT-ANGLES-SPEC.md).
Needs one migration, which Bawsa applies. Lives in dashboard v2, behind `DASHBOARD_V2`.

## Why

Bawsa's VOICE.md (content project) showed that **explicit rules** make AI drafts sound like the person far more reliably than example posts alone. Examples:

- "zero em-dashes"
- "`>` is your bullet"
- "lowercase = thinking out loud, Titlecase = announcement"
- "never: leverage, unlock, 10x"

Three payoffs:

1. **Every draft gets better.** This covers the writing room (Post, Thread, Article), the angle step, the copywriter chat and Score this draft.
2. **The Playbook becomes theirs.** The voice section turns from 3 read-only lines into a rule set they can see, correct and own. That's the IKEA effect from the redesign prompt.
3. **It's the identity layer.** The API thesis says other tools should call BrandOS *before* they generate. A structured, user-confirmed voice is the thing they'd call.

## What exists today (checked on `staging`, 28 Oct)

| Piece | Where | State |
|---|---|---|
| `VoiceFingerprint` type: ~30 fields across sentence patterns, vocabulary, formatting, rhetoric, thinking style, structure, signature elements, anti-patterns | `src/lib/voice-fingerprint.ts` | Good shape. Has `summarizeFingerprint()` → ~200-token `keyRules` / `antiRules` / `signatureMarkers` |
| Extraction | `/api/voice-fingerprint/extract` | **Pro-only and manual.** It runs on samples the user pasted into the old Brand DNA, not on their real posts |
| Storage | `Brand.voiceFingerprint` (JSON string on the legacy `Brand` model) | Not tied to `BrandScan` or the workspace-era data. Panel state is client-side |
| UI | `VoiceFingerprintPanel` on the legacy dashboard | Cut from v2 |
| Authenticity check / rewrite | `/api/voice-fingerprint/check-authenticity`, `/rewrite` | Exist and use the fingerprint |
| Copywriter | `src/lib/copywriter.ts` `copyBrandForUser` | **Doesn't use the fingerprint.** Voice = up to 6 on-brand `PostScore` excerpts |
| Draft score | `src/lib/draft-score.ts` | Has a `voice` read, but no rules to check against |
| Playbook | "Voice and consistency" section, `d.voice.slice(0, 3)` (from `src/app/dashboard/page.tsx`) | Read-only lines |

So the engine is mostly built. What's missing is that it runs **automatically on real posts**, is **stored per user/workspace**, is **shown and editable**, and is **fed into generation**.

## What we're building

### 1. Generate rules from real posts, automatically

- **Input:** the user's on-brand posts from `PostScore`. Use the top ~20 by `fit`, then by recency, falling back to the latest scan's posts.
  - Run the cheap stats in code, not the model. VOICE.md-style counts:
    - lowercase-start ratio;
    - em-dash and ellipsis counts;
    - bullet character;
    - average length and line breaks;
    - emoji set;
    - arrow and CTA characters.
  - Then the model extracts the rest, using the existing extraction prompt plus the computed stats as facts it must not contradict.
- **When:**
  - after a scan completes and its posts are scored;
  - again on rescan, using the existing *refinement* prompt so user edits are kept (below);
  - never more than once per 24h per user.
- **Who:** every signed-in user, including during the trial. The Pro gate moves from *having* rules to how far they reach (see Plans).
- **Confidence:** keep `metadata.confidence`.
  - Under ~8 on-brand posts: show the rules as "early read" and keep them lighter in prompts.
  - Under 3: don't generate. Show "Post a few more and BrandOS will read your voice."

### 2. Store per user (the migration)

New table `voice_rules`, at the next free migration number. Write the SQL to `supabase-migrations/` and Bawsa applies it.

- Columns:
  - `id`, `user_id`, `workspace_id`, `handle`;
  - `fingerprint jsonb`: the full `VoiceFingerprint`, model + stats;
  - `rules jsonb`: the short, user-facing list (below);
  - `edits jsonb`: the user's changes, kept separately so a rescan never overwrites them;
  - `confidence int`, `source_post_count int`, `generated_at`, `updated_at`.
- Unique on (`workspace_id`, `handle`) so multi-brand workspaces work.
- **RLS:**
  - the owner and workspace members can read;
  - writes go only through the server, using the existing private RLS helpers (023).
- Add the table to `npm run test:rls`.
- Leave `Brand.voiceFingerprint` alone. It's legacy and keeps working for the old panel until that page is retired.

### 3. Show and edit on the Playbook

The Playbook's "Voice and consistency" section becomes **"How you write"**:

- **5–8 rules** in plain language, each one line, each with a tiny "seen in N of 20 posts" proof where there is one. For example:
  - "You start lowercase when you're thinking out loud, Titlecase when you're announcing."
  - "You never use em-dashes."
  - "Lists use `>` not bullets."
- **"Never"**: 3–5 words or moves they avoid.
- **Signature moves**: 2–4 markers.
- **Editing.** Every line can be:
  - removed ("that's not me");
  - edited in place;
  - added to ("+ add a rule").

  Edits save automatically, optimistically, with undo, no dialogs. They are marked as theirs (a small "yours" mark). That's endowed progress: the list arrives 70% done, and every edit makes it more theirs.
- **Phones:** same list, full-width rows, swipe-left to remove, with undo.
- **Motion+:** the headline moment is the rules appearing one by one on first generation. Use `AnimateText` or a stagger, reduced-motion safe. Nothing else animates.

This lands with **Playbook editing**, which is already on the post-launch list. It's the first editable section.

### 4. Feed into generation

- **`copyBrandForUser` gains `rules`.** Use the user-facing rules plus edits, compressed with `summarizeFingerprint` into ~200 tokens. User edits win over model rules.
- **Prompt** (`buildCopywriterPrompt`):
  - add a `THEIR VOICE RULES` block above the samples;
  - the samples stay, as the *feel*, with the rules as the *law*;
  - wrap the rules with `wrapUntrusted`, because users can edit them, so they're user text.
- **Draft score** (`src/lib/draft-score.ts`): check the draft against the rules and name the broken one ("uses an em-dash; you never do"). It must point to a specific rule, never a vague "doesn't sound like you".
- **Same rails as today:**
  - `NO_HASHTAG_ADVICE` opens every prompt;
  - threads are one depth format, never a growth tactic;
  - existing input caps.

### 5. Hashtags

`VoiceFingerprint.formatting.hashtagStyle` exists. It may *describe* their past posts, e.g. "you rarely use hashtags". It must **never** become an instruction to add hashtags, a hashtag "rule" in the user-facing list, or advice.

- Filter it out of `rules`.
- Run the `test:hashtags` output filter over the rule text.
- Add a test case: a fingerprint with `hashtagStyle: 'heavy'` must yield no hashtag rule and no hashtag in drafts.

## Plans (proposal, Bawsa decides)

| | Free / trial | Pro $29 |
|---|---|---|
| Rules generated + shown on Playbook | ✓ (read-only on Free) | ✓ |
| Edit rules | Trial ✓ | ✓ |
| Rules used in every draft + Score this draft | Trial ✓ | ✓ |
| Multiple brands' rules | n/a | Team / Agency |

Seeing your voice read accurately is the hook. Having every draft obey it is the reason to pay.

## API (later, not in this build)

Once rules exist per handle, a read-only endpoint can return the user-confirmed rules and signature moves to tools the user authorises. It would use the same OAuth/MCP account model as the BrandOS MCP (`project_brandos_mcp`): `GET /api/v1/voice/:handle`. Spec it separately. **Opt-in only. Never public by default.**

## Measure

- **Accuracy:** the share of generated rules users delete in their first week. Target: fewer than 1 in 5. If it's higher, the extraction is wrong; fix that before anything else.
- **Ownership:** the share of users who edit or add at least one rule.
- **Drafts:** Score this draft's voice-fit on drafts made with rules vs the 2 weeks before. Also how often a draft gets copied out without being regenerated.
- **Money:** trial-to-paid for users who edited their rules vs those who didn't.

## Checks before merge

- `npm run test:rls`, with the new `voice_rules` table covered, against real staging.
- `npm run test:safety` and `npm run test:hashtags`.
- `npm run test:dash-v2`, plus new cases:
  - edits survive a rescan;
  - fewer than 3 posts means no generation;
  - an injection string inside an edited rule doesn't change the prompt's behaviour.
- The security guardrail. Rules are user-editable text that flows into prompts, so treat them like any untrusted input.

## Build order

1. Migration SQL + `voice_rules` read/write on the server, plus RLS tests. Bawsa applies the migration.
2. Auto-generation after a scan (stats in code + existing extraction prompt).
3. Copywriter + draft score read the rules. **Ship this before the UI**, so drafts improve even before anyone sees the list.
4. Playbook "How you write": view, then edit.
5. Measure for 2 weeks, then decide on the API endpoint.
