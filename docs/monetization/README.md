# Monetization desk

The monetization agent's working files. Its job: get BrandOS to the MRR target in
`MRR-PLAN.md`, keep Bawsa updated on what's working (in BrandOS and in the market),
and judge every build by what it did to the money, not by how it felt to ship.

Run it with `/monetization` (skill in `.claude/skills/monetization/`, agent in
`.claude/agents/monetization.md`, both in the main checkout because `.claude/` is
gitignored).

## The loop

```
ship a build ──► log it in BUILD-LEDGER (lever + hypothesis + baseline)
     ▲                                   │
     │                                   ▼
 pick the next build ◄── weekly pulse reads snapshots, scores each open
 from the gap + radar     ledger entry at +7 / +14 days, finds the
                          weakest funnel step, checks STRATEGY-RADAR
```

## Files

| File                        | What it is                                                                                                                | Who writes it                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `MRR-PLAN.md`               | Target ladder, funnel math, the current gap, the weekly number history                                                    | Agent (numbers), Bawsa (target)                    |
| `BUILD-LEDGER.md`           | Every shipped build that touches the funnel: which lever, the bet, the before number, the +7/+14 day readout, the verdict | Agent, from git merges to `main` and the snapshots |
| `STRATEGY-RADAR.md`         | Monetization plays seen working elsewhere right now, cited, with a status (watching → testing → adopted / rejected)       | Agent, from web research                           |
| `snapshots/YYYY-MM-DD.json` | Raw numbers: MRR, paying, cards, cancels, founding seats, 7d/28d funnel                                                   | `scripts/mrr-snapshot.mjs`                         |
| `pulse/YYYY-MM-DD.md`       | The update Bawsa reads: MRR vs target, what each recent build did, the one next move, new plays                           | Agent                                              |

## Taking a snapshot

```bash
node --env-file=.env.prod.local scripts/mrr-snapshot.mjs
```

Read-only. MRR comes from Stripe when `STRIPE_SECRET_KEY` is in the env file, otherwise
it's a DB estimate and says so. Run it from the main checkout (that's where
`.env.prod.local` lives).
