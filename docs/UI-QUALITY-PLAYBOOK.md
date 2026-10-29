# UI Quality Playbook — how every BrandOS UI change gets checked

Adopted 2026-10-28. Applies to every agent and every PR that changes something a
person sees. Sits next to `docs/MOTION-PLUS-PLAYBOOK.md` (feel) — this one is
about correctness and taste: does it hold up, in every state, for every person.

Six practices. The first two happen before code, the middle three while
building, the last one after it ships.

---

## 1. Ask before building (question round)

Before writing UI, the agent asks Bawsa the questions that would change what
gets built. Not "is this okay?": real forks.

Always settle:

- **Who sees it?** anon visitor / member / tester (v2) / admin / paying / trial.
- **What is its one job?** If it has two, it's two pieces.
- **What does it show when the data isn't there?** (new account, 0 posts,
  private account, scan failed)
- **What number or action moves if it works?** (signups, code redemptions,
  Founding purchases, return visits)
- **Where does it live in the world?** Reading surface (bone) or world surface
  (Klein + dither + one signal colour)? See `docs/BRAND-WORLD.md`.

Batch the questions (one AskUserQuestion, up to 4), recommend an answer for
each, and skip anything the code or docs already answer.

## 2. State matrix (write it before the code)

Every surface lists its states up front, and each state gets a way to render
it without a real account: a `?state=` param on its `/world-preview/*`
harness, fed from sample data (pattern: `src/app/world-preview/today/page.tsx`
+ `../growth/sample.ts`).

The BrandOS axes:

| Axis | Values |
| --- | --- |
| Data | loading · empty · partial · full · error |
| Person | anon · member (no code) · tester (DASHBOARD_V2) · admin |
| Plan | open access · trial · Founding · subscribed · lapsed |
| Finish | bone · night · klein · paper |
| Width | phone 375 · desktop 1280 |

Not every cell matters. The PR lists the cells that do and marks each one
checked. If a state can't be previewed, say so in the PR; that's a gap, not a
pass.

## 3. Variants (try, then pick)

For anything where taste decides (a new card, a header, an empty state,
copy-heavy UI), build 2–3 variants behind `?v=a|b|c` on the preview harness
instead of arguing about one. Bawsa picks; the losers are deleted before
merge, never shipped dormant.

## 4. Break it (adversarial pass)

Before opening the PR, the agent tries to break what it built. BrandOS
breakers:

- Long handle / long display name / emoji / RTL text in a bio.
- 0 posts, 1 post, private account, suspended account, scan timeout.
- Double-click on anything that costs money or sends (buy, redeem, send).
- Back button and refresh mid-flow (scan, checkout return, invite redeem).
- Signed out in another tab, then act.
- Phone width with the keyboard open; landscape.
- Each finish (night especially: contrast, the wordmark "OS").
- `prefers-reduced-motion`, keyboard only, zoom 200%.
- Slow 3G: what shows before data arrives?

Anything found gets fixed or written in the PR as a known gap.

## 5. Before / after screenshots

Every UI PR carries before/after screenshots, phone and desktop, taken from
the local preview harness (Vercel previews sit behind login). For a new
surface, "before" is what the person saw there until now. Use the in-app
browser's screenshot; attach to the PR body.

## 6. Loops (keep the bar after it ships)

Quality slips quietly, so some checks run on a schedule, not on memory:

- **Prod smoke** (daily): homepage scan returns a score, `/signup` loads,
  `/i/<code>` redirects, the v2 harness renders in each finish, no new
  runtime errors in Vercel logs.
- **Break-it sweep** (weekly): run section 4 against the top surfaces
  (scan → reveal, signup, dashboard Today, Write) on prod.
- **Watch the funnel** while a send is live (e.g. code redemptions), and
  report drops or errors as they happen.

A loop reports only when something changed or broke. Silence means it ran
clean, and each loop's last run is visible on request.

---

## PR checklist (copy into the PR body)

- [ ] Questions asked and answered (link or summary)
- [ ] State matrix: cells checked listed; gaps named
- [ ] Variants tried (or why not)
- [ ] Break-it pass done; findings fixed or listed
- [ ] Before/after screenshots, phone + desktop
- [ ] Motion+ note (see MOTION-PLUS-PLAYBOOK)
