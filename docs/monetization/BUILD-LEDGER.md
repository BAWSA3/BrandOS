# Build ledger

Every build that reaches prod and could move money gets a row. The point is that feedback
on a build comes from **what it did to its metric**, not from how it looks.

## How an entry works

- **Lever**: one of Traffic · Activation · Card · Convert · Retain · Price/mix · New line
  (`MRR-PLAN.md`). A build with no lever is logged as `none` and doesn't get a readout.
- **Bet**: "this should move <metric> from <baseline> toward <number> because <reason>."
  Written before (or on) the ship date. If the agent writes it after the fact it says
  `(retro)`.
- **Baseline**: the metric in the last snapshot before the ship date.
- **+7d / +14d**: the metric in the first snapshot at least 7 / 14 days after shipping.
- **Verdict**: `worked` · `no effect` · `hurt` · `too early` · `can't tell` (another change
  or a launch spike landed the same week; say which). Small numbers get `can't tell`, not
  a confident call: under ~30 events in the window, say so.
- **Ship date** is the date it merged to `main` (prod), not staging.

## Open (waiting on a readout)

Seed rows were added by hand on 2026-10-27 from staging merges; the first agent run
confirms each prod ship date from the `main` promotion that carried it.

| Ship (prod)  | PR (feature)   | Build                                                | Lever      | Bet                                                                                    | Baseline               | +7d | +14d | Verdict   |
| ------------ | -------------- | ---------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------- | ---------------------- | --- | ---- | --------- |
| 2026-10-27 ? | #233 #236 #231 | Invite codes + invite-only gate + early-access email | Activation | (retro) hand-picked testers go scan → signup → weekly use more than open traffic       | pending first snapshot |     |      | too early |
| 2026-10-27 ? | #240 #238      | "Why your score moved" + score this draft            | Retain     | (retro) a reason to come back weekly lifts return visits; March return rate was 0.3%   | pending first snapshot |     |      | too early |
| 2026-10-26 ? | #206 #217      | Copywriter chat (/dashboard/write)                   | Retain     | (retro) drafting in-product makes the dashboard a weekly tool, not a one-time read     | pending first snapshot |     |      | too early |
| 2026-10-22 ? | #200 #202      | Creator Index + reservations                         | New line   | (retro) a browsable Index is what a brand would pay $249/mo for; tested by the LOI ask | 0 LOIs                 |     |      | too early |

## Closed

| Ship (prod) | PR  | Build | Lever | Bet | Baseline | +7d | +14d | Verdict | What we learned |
| ----------- | --- | ----- | ----- | --- | -------- | --- | ---- | ------- | --------------- |
|             |     |       |       |     |          |     |      |         |                 |
