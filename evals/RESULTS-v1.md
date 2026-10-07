# Eval results v1 — real sweep (2026-10-07)

Corpus: `data/corpus.v1.jsonl` (500 women's ethnic products, dev DB snapshot).
Judgments: `data/judgments.v1.json` (25 persona queries, rule-derived weak
labels; `q-anouk` dropped as too-broad). Full run: `results/v1/` (gitignored,
reproduce with `mise run evals:real`).

## Headline (nDCG@10, generic baseline recall = 0.027)

| rank | config | nDCG | recall | attr-hit |
| --- | --- | --- | --- | --- |
| 1 | e5-small + tagged + raw + 384 | 0.679 | 0.209 | 0.744 |
| 2 | e5-small + tagged + raw + 256 | 0.649 | 0.185 | 0.716 |
| 3 | e5-small + color-weighted + raw + 384 | 0.636 | 0.189 | 0.744 |
| 4 | bge-small (incumbent) + color-weighted + raw + 384 | 0.602 | 0.188 | 0.708 |
| 5 | bge-small + instruction + color-weighted + raw + 384 | 0.594 | 0.184 | 0.704 |
| 6 | minilm-l6 + attrs-only + raw + 256 | 0.548 | — | — |

Best per model: e5 0.679 / bge 0.602 / bge-instruct 0.594 / minilm 0.548.

## Findings

1. **E5-small beats the incumbent by ~13% relative nDCG** (0.679 vs 0.602)
   with correct `query:`/`passage:` prefixes. Same size class, same 384 dims —
   drop-in candidate for the app index.
2. **BGE's vendor-recommended query instruction does nothing here**
   (0.594 vs 0.602). Don't ship it.
3. **Tagged layout wins for E5, color-weighted for BGE.** Layout and model
   interact — tune them jointly, not independently.
4. **My taste-expansion hypothesis was wrong**: raw persona text beats
   taste-expanded queries on every model. The expansion map is deleted-worthy;
   user-side work should go into filters, not embedding tokens.
5. **128-dim truncation is viable for the winner**: e5@128 reaches 0.633,
   still above bge@384 (0.602). A 3x smaller index with better quality than
   today is on the table (naive prefix truncation — Matryoshka training would
   do better).
6. **MiniLM trails by ~9%** (0.548). Respectable floor, not the pick unless
   latency forces it (measure on-device before concluding).
7. **Generic feed is 25x worse than personalized** (baseline recall 0.027).
   Personalization isn't marginal here — it's the whole game.
8. **E5 lists are less diverse** (~0.10 vs BGE ~0.22 intra-list
   dissimilarity): E5 clusters same-color items harder. Pair the model swap
   with diversity caps/MMR in the feed, or the "same 10 items" complaint
   returns in a new form.

## Caveats

- Weak (attribute-rule) labels, narrow corpus (women's ethnic only, no
  descriptions, empty fit/material in dev data). Relative ordering is
  trustworthy; absolute numbers will shift on a broader corpus.
- Timings are node-side transformers.js, not on-device ONNX. Phone numbers
  still needed for the final ship call.
- `Xenova/bge-micro-v2` doesn't exist (HF 401) — dropped from the matrix.

## Recommended next step

Ship E5-small + tagged docs + 256-dim (0.649, 33% smaller index) behind a
rerank/diversity pass, after confirming on-device latency. Re-run this sweep
on a broader corpus first if categories beyond ethnic wear matter for launch.
