# MRR plan

Started 2026-10-27. Numbers below come from `snapshots/` or a named source. Nothing is
estimated without saying so.

## Target ladder

Bawsa sets these. The agent measures against the **current rung** and only talks about
the next one once it's hit.

| Rung | MRR     | What it proves                                      | By (target)  | Hit on |
| ---- | ------- | --------------------------------------------------- | ------------ | ------ |
| 0    | $1      | Someone pays at all                                 | Dec 3, 2026  |        |
| 1    | $1,450  | Launch goal: 50 founding members (LAUNCH-PLAN)      | Dec 31, 2026 |        |
| 2    | $5,000  | A repeatable channel, not just the launch spike     | —            |        |
| 3    | $15,000 | Bawsa's income goal ($15–20k/mo)                    | —            |        |
| 4    | $83,333 | $1M a year (`docs/strategy/MILLION-DOLLAR-PLAN.md`) | —            |        |

**Current rung: 0.** Checkout isn't live on prod yet; the Founding 100 card lock opens with
the Nov 2 launch and first charges land Dec 3 (`docs/LAUNCH-PLAN.md`).

## The funnel the agent manages

MRR only moves through these levers. Every build in `BUILD-LEDGER.md` names one.

| Lever           | Metric                                   | Last measured (source)                                |
| --------------- | ---------------------------------------- | ----------------------------------------------------- |
| **Traffic**     | scanned handles / week                   | ~250 new / month in Oct (MILLION-DOLLAR-PLAN, Oct 26) |
| **Activation**  | scanned handle → signup                  | 14.7% Oct 1–26 (MILLION-DOLLAR-PLAN)                  |
| **Card**        | signup → card on file                    | unmeasured (checkout not live)                        |
| **Convert**     | card → first paid invoice                | unmeasured (first charges Dec 3)                      |
| **Retain**      | monthly logo churn                       | unmeasured                                            |
| **Price / mix** | ARPA (avg revenue per paying account)    | $29 founding · $39 Pro · $249 Agency (not launched)   |
| **New line**    | revenue outside creator Pro (B2B Index…) | 0 LOIs (MILLION-DOLLAR-PLAN test: 3 by Dec 3)         |

Rough math to the next rung: `MRR = handles × activation × card × convert × ARPA`, minus
churn. The agent replaces each guessed rate with the measured one as soon as a snapshot has
it, and names the lever with the biggest gap as the week's focus.

## Weekly numbers

Appended by the agent from each snapshot (newest first).

| Week of | MRR | Source | Paying | Cards | Cancels 28d | Handles 7d | Signups 7d | Handle→signup | Focus lever |
| ------- | --- | ------ | ------ | ----- | ----------- | ---------- | ---------- | ------------- | ----------- |
|         |     |        |        |       |             |            |            |               |             |
