# Live composer — spec (2026-10-28)

BrandOS reads a draft *while it's being written* and marks what's off, inline.
It replaces paste-and-check in the writing room. Target: testers before Nov 2.

## Decisions (Bawsa, 2026-10-28)

- **No extensions.** BrandOS lives where content is made through its own
  composer, not by injecting into other sites.
- **Copy out to X.** One tap copies the draft and opens `x.com/intent/post`
  prefilled. BrandOS never posts on anyone's behalf.
- **On-brand = three lenses**, each its own mark:
  - **Voice:** does this sound like them?
  - **Lane:** does it reinforce what they're known for (their playbook)?
  - **Landing:** has this shape worked for *them* before?
- **Inline marks, what + why only.** No rewrites in the composer; the person fixes it.
- **Creators and SMMs equally.** Marks follow the selected brand; switching brand re-reads the draft.
- **Pro only.** Free keeps today's paste-and-check.
- **Thin history:** hide Landing marks and say why ("landing marks unlock after N posts").
- **Composer replaces Check.** "Draft in your voice" (CopywriterChat) stays as its own tab.
- **Video (X video first):** script mode + rough-cut upload, judged on *what's said only*.
  Visual checks come after Nov 2.

## How live works

| Tier | When | Cost | Marks |
|---|---|---|---|
| 0 Local | every keystroke | none | Voice: banned words, signature phrases, sentence length, opener shape (from the voice fingerprint) |
| 1 Fast pass | ~1s after typing stops, changed sentence only | small model | Lane, Landing, deeper Voice |
| 2 Full read | on demand / before copy-out | `CHECK_MODEL` | everything, plus an overall read |

- Marks are spans `{start, end, lens, note}`. The client re-anchors spans on edit and drops
  stale ones.
- Lenses differ by underline style (solid / dashed / dotted), not colour. There's one signal
  colour, per brand tokens. A small legend sits under the editor.
- Server routes follow `/api/check` guards: auth, Pro check, rate limit, `wrapUntrusted`, input caps.

## Copy out

- Single post: `https://x.com/intent/post?text=…`.
- Threads / long posts: copy part-by-part with a "copied 2/5" state.
  *To verify:* does intent accept long-post length?
- Every copy-out is logged. **Win metric: copy-outs per Pro member per week.**
  Post performance matching comes after Nov 2.

## Video

- **Script mode:** same composer, plus spoken checks: hook inside the first ~3s of
  speech (≈8 words) and an estimated read-aloud length against X video limits.
- **Rough cut:**
  1. Direct client upload to Vercel Blob (function bodies cap at 4.5 MB).
  2. Speech-to-text with timestamps.
  3. The same three lenses run on the transcript; marks are pinned to timestamps.
  4. The file is deleted after transcription.
- **Needs from Bawsa:** pick a speech-to-text provider and add its key in Vercel
  (agents never enter keys), and connect a Blob store.
- **Cut line:** if rough cut isn't solid by Nov 1 evening, it ships after Nov 2 and script
  mode ships alone.

## Plan to Nov 2

| Day | Ship (behind DASHBOARD_V2, testers) |
|---|---|
| Oct 29–30 | Composer: tier 0 + 1 marks, brand switch, copy-out logging |
| Oct 31 | Tier 2 full read; video script mode |
| Nov 1 | Rough cut (cut line applies); break-it pass; before/after screenshots |
| Nov 2 | Bawsa's go → promote |

UI work follows `docs/UI-QUALITY-PLAYBOOK.md`. The state matrix covers: empty, thin
history, many marks, long thread, SMM brand switch, offline / AI failed, Pro vs free,
and phone vs desktop.
