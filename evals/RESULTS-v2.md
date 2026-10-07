# Eval results v2 — scaled judgments (2026-10-07)

Same corpus (`data/corpus.v1.jsonl`, 500 products). Judgments v2:
450 positives (combinatorial color × style × phrasing, 24 Hinglish) + 30
negatives (out-of-corpus intents, abstention-scored). Full run:
`results/v1/` (gitignored, reproduce with `mise run evals:real`).
Leaderboard now carries bootstrap 95% CIs (500 resamples) and abst@0.3.

## Headline (nDCG@10, best layout per model, dim384, raw queries)

| model | nDCG [95% CI] | layout |
| --- | --- | --- |
| e5-small | 0.569 [0.546, 0.593] | tagged |
| bge-small + instruction | 0.504 | attrs-only |
| bge-small (incumbent) | 0.475 | attrs-only |
| minilm-l6 | 0.399 | color-weighted |

E5's CI sits entirely above every other model's best point: the lead is
real, not noise. Ordering is identical to v1 (E5 > BGE-I > BGE > MiniLM).

## What scale changed vs v1 (and why that matters)

1. **Absolute numbers moved a lot** (E5 0.679 → 0.569, BGE 0.602 → 0.475)
   while ordering held. Lesson recorded: absolute values are
   label-mix-dependent; only gaps with non-overlapping CIs are shippable.
2. **BGE-instruct flipped from useless to mildly helpful** (0.504 vs 0.475).
   v1's "instruction does nothing" was a 25-query artifact. Vendor guidance:
   weakly positive, not decisive.
3. **Dim axis holds**: E5 tagged/raw 384 → 256 → 128 = 0.569 → 0.541 → 0.467.
   256-dim keeps 95% of quality at 2/3 the index.
4. **Abstention is broken everywhere**: best config abstains on ≤23% of
   negatives @0.3, most near 0%. Cosine scores are uncalibrated on this
   corpus — everything looks vaguely similar, so no threshold cleanly
   separates "match" from "junk". Prod implication: do NOT gate the
   calibration-feed fallback on raw cosine today; it would almost never fire.
   Calibration (score normalization or a learned gate) is open work.
5. MiniLM trails by a wide margin (0.399) — floor confirmed, not the pick.

## Still open (unchanged)

Weak rule-derived labels (circularity risk with keyword-heavy layouts stands);
single-category corpus, no descriptions; node timings, not on-device;
brute-force, not Convex ANN + filters. Human-pooled judging remains the v2-labels upgrade.
