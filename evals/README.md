# evals — embedding + retrieval eval harness

DB-free, reproducible, TypeScript. Answers "which embedding setup is actually
better, by how much, and at what cost" with numbers instead of vibes.

## Quickstart

```sh
# anyone, fresh clone: one command to install, then everything below works
mise run init

# smoke (fake embedder, fixture data, seconds, offline)
mise run evals:test
mise run evals:smoke

# real sweep (downloads HF models on first run, still DB-free at eval time)
mise run evals:fetch      # 500 products from dev DB (read-only) -> data/raw-convex.json
mise run evals:snapshot   # normalize -> pinned data/corpus.v1.jsonl
mise run evals:judge      # persona rules -> data/judgments.v1.json (weak labels, documented)
mise run evals:real       # 5 models x 7 layouts x 2 queries x 3 dims x 3 seeds
mise run evals:multilingual  # Hinglish probe (ml-e5-small, over device budget, eval-only)

# custom sweep: copy configs/eval-real.config.ts, edit the matrix, then
#   pnpm --filter @app/evals eval -- --config configs/eval-x.config.ts --out results/x

# learning dynamics + diversity caps (real core functions, 128 configs)
mise run evals:tune

# vet a HuggingFace id before it earns a matrix slot (catches bge-micro-style 401s)
#   pnpm --filter @app/evals probe -- --model <hf-id> --dims <N>
```

Every run narrates itself (`[evals] [2/5] e5-small-384: done (252/630
configs)`), so long sweeps never go silent. `results/<run>/leaderboard.md`
is a plain ranked table — no tooling needed to read it; `RESULTS-*.md`
hold the prose verdicts.

## Adding a hypothesis (10 minutes)

1. Implement **one** interface from `src/types.ts` in the matching folder:
   - new model → `src/models/<name>.ts` (`ModelAdapter`)
   - new doc text (data/layout axis) → `src/docs/builders.ts` (`DocBuilder`)
   - new query text → `src/queries/builders.ts` (`QueryBuilder`)
2. Register it in `src/builtins.ts` (one line).
3. Reference its id in your `configs/eval-*.config.ts` matrix.
4. Run. The leaderboard compares it against everything else automatically.

The `canonical` doc builder mirrors
`packages/infrastructure/src/embedder/EmbedderAdapter.ts: formatProductForEmbedding`.
If that function changes, update `canonical` too (or better: the eval diff will
tell you the two drifted).

## External vectors (custom runtimes, vendor APIs)

Models that don't run in transformers.js (Cactus Needle, API embeddings)
enter through precomputed vectors:

1. `pnpm --filter @app/evals texts -- --corpus ... --judgments ... --docs canonical,tagged --queries raw --out data/external/texts.jsonl`
2. Embed each line's `text` with the external runtime, write
   `data/external/<id>.json` as `{ dims, version, vectors: { <sha1(text)[:16]>: [...] } }`
   (see `evals/scripts/export_needle.py` for a worked example).
3. Register via `precomputedVectors('<id>', 'data/external/<id>.json')` in
   `src/builtins.ts` and reference the id in a config. Missing keys throw —
   never silent zeros. Precomputed adapters bypass the shared JSON cache
   (`cacheable: false`) since their vectors already live on disk.

## Interpreting results

`results/<run>/leaderboard.md` ranks configs by nDCG@K. Columns:

- **recall / nDCG** — retrieval quality vs judged relevants.
- **attr-hit** — fraction of top-K matching required color/occasion/fit.
  This is the "dark + casual ignored" metric.
- **coverage** — % queries with ≥1 relevant retrieved (cold-start health).
- **diversity** — 1 − mean pairwise cosine ("same 10 items" detector).
- Generic-baseline recall is printed in the header: a config only counts as
  personalized if it beats corpus-order by a margin.

## Statistical honesty (enforced, not suggested)

- `loadJudgments` **drops** queries below `minRelevantsPerQuery` and lists
  them in every summary (`droppedQueries`) — thin labels can't silently win.
- Minimums the runner warns on: <10 products (toy), <3 queries (directional
  only). Real decisions want ≥300 products, ≥30 queries, ≥5 relevants/query,
  3+ seeds — see configs.
- Seeds shuffle tie-break order only (embeddings are deterministic), so seed
  spread measures ranking stability, not noise you invented.
- Embeddings are content-hash cached in `.cache/` — re-runs are free and
  bit-identical. Every result dir echoes the full config.

## On-device constraints

`ModelAdapter.approxBytes` is the phone-size column. Candidates must be
quantizable to int8 and phone-loadable (bge-small ≈133MB fp32 is the
incumbent ceiling, not the target). Embed/search ms in the summary are
node-side transformers.js timings — relative comparisons, not phone promises.
Phone numbers come later by running the winning config's texts through the
app's `InferenceEngine`.
