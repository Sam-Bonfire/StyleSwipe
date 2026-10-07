# Tune results — learning rates + diversity caps (2026-10-07)

Setup: winner embeddings (e5-small + tagged + raw + 384), 450 persona
queries, 5 likes + 5 passes per session (interleaved, first like as super),
scored nDCG@10. Sessions replay through the REAL core `applyDisplacement`
and `diversifyAndLimit` — this tunes the app's actual functions, not copies.
Full run: `results/tune/` (gitignored, reproduce with `mise run evals:tune`).

## Learning rates (128 configs: 4 alphas x 4 betas x 4 supers x 2 seeds)

| values | nDCG | delta vs no-learning |
| --- | --- | --- |
| **a0.2 b0.1 s1 (winner)** | **0.846** | **+0.276** |
| current app defaults (a0.1 b0.05 s3) | 0.816 | +0.247 |
| no learning (query vector only) | 0.569 | — |

1. **Learning works**: +0.276 nDCG after 10 swipes (0.569 → 0.846).
   The swipe engine is the highest-leverage part of the system — bigger than
   any model swap measured so far.
2. **Ship alpha=0.2, beta=0.1**: double both defaults. Alpha dominates
   (all top rows are a0.2); beta 0.1–0.2 all fine, 0.02 trails.
3. **Super-like multiplier is dead weight**: s1 tops the board; s2/s3 trail
   at every alpha/beta. The app's ×3 super is pure placebo — set super == like
   (or find a UX where super means something before keeping the parameter).
4. Biggest single jump is swipe #1 (+0.107). Curve is monotonic to step 10:
   0.569 → 0.676 → 0.671 → 0.738 → 0.742 → 0.788 → 0.791 → 0.821 → 0.831 → 0.838 → 0.846.

## Diversity caps (25 combos on no-learning rankings)

No measurable effect at K=10 on this corpus: nDCG 0.568–0.570 and
diversity flat across every (brand, category) cap pair. The top-10 never
concentrates enough for caps to bind (few brands per query neighborhood).
Not a verdict on caps — an untestable axis here. Revisit on a
multi-brand corpus or larger K.

## Caveats

Sessions are likes-then-interleaved synthetic swipes from weak labels
(relevants liked, non-relevants passed); real users pass relevant-looking
items too. Pass sampling is seeded (2 seeds, stable). Core change shipped
alongside: `DisplacementConfig.superLikeMultiplier` is now honored instead
of a hardcoded ×3 (backward compatible, defaults unchanged).
