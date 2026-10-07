# Eval results v2 — scaled judgments (2026-10-07)

Same corpus (`data/corpus.v1.jsonl`, 500 products). Judgments v2:
450 positives (combinatorial color × style × phrasing, 24 Hinglish) + 30
negatives (out-of-corpus intents, abstention-scored). Full run:
`results/v1/` (gitignored, reproduce with `mise run evals:real`).
Leaderboard now carries bootstrap 95% CIs (500 resamples) and abst@0.3.

## Headline (nDCG@10, best layout per model, dim384, raw queries)

| model | nDCG [95% CI] | layout |
| --- | --- | --- |
| e5-small-384 (34MB) | 0.569 [0.546, 0.593] | tagged |
| nomic-embed-768 (138MB int8) | 0.557 [0.528, 0.584] | tagged |
| bge-small + instruction | 0.504 [0.479, 0.529] | attrs-only |
| gte-small-384 (~33MB int8) | 0.483 [0.460, 0.509] | color-weighted |
| bge-small (incumbent) | 0.475 [0.449, 0.500] | attrs-only |
| minilm-l6 | 0.399 [0.379, 0.421] | color-weighted |
| ml-e5-small | 0.369 | tagged |

E5's CI sits entirely above every other device-class model's best point:
the lead is real, not noise. Nomic ties E5 within CIs (long-context
architecture, 4x the bytes — not worth it here). gte-small edges the
incumbent within noise. EmbeddingGemma was attempted but is unloadable on
the app's transformers v2 (`gemma3_text` class unknown — needs a v3
upgrade); recorded, not retried. "Cactus needle 3" matched no known
embedding model — confirm the exact name if you meant something specific.

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

## Multilingual probe (separate sweep, `results/multilingual/`)

`ml-e5-small` vs incumbent on the same v2 judgments: 0.369 vs 0.425
overall (BGE wins). On the 24 Hinglish queries alone: ml-e5 0.080–0.091
vs BGE 0.065–0.084 — both effectively zero. A multilingual encoder does
NOT solve Romanized-Hindi queries against English product text; that gap
needs translated/expanded queries or Hinglish training pairs, not a bigger
model. Stay English-only until query-side Hinglish handling exists.

## Large-model probe (separate sweep, `results/large/`, 108 configs)

768-dim models that break the device budget AND the 384 index, run to
quantify what staying small costs. Answer: nothing measurable.

| model | nDCG [95% CI] | layout |
| --- | --- | --- |
| e5-large-1024 (~1.3GB) | 0.605 [0.578, 0.631] | tagged |
| e5-small-384 (34MB) | 0.569 [0.546, 0.593] | tagged |
| e5-base-768 | 0.552 [0.527, 0.574] | tagged |
| bge-large-1024 (~1.3GB) | ~0.55 | tagged |
| bge-base-768 | 0.530 [0.505, 0.555] | canonical |
| mpnet-base-768 | 0.299 [0.280, 0.318] | canonical |

e5-large's CI ([0.578, 0.631]) overlaps e5-small's ([0.546, 0.593]) —
40x the size for +0.036 nDCG that isn't statistically significant. The
server-side move is NOT justified on quality: no gain covers an index
migration + serving latency + infra cost. e5-base truncated to 384
(0.508) loses to native e5-small, so "big model, sliced down" is not a
shortcut either. mpnet's collapse (0.299) says retrieval tuning matters
more than size. Stay small; revisit only on a broader corpus.

## Still open (unchanged)

Weak rule-derived labels (circularity risk with keyword-heavy layouts stands);
single-category corpus, no descriptions; node timings, not on-device;
brute-force, not Convex ANN + filters. Human-pooled judging remains the v2-labels upgrade.
