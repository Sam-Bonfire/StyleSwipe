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

# real sweep (downloads HF models on first run, still DB-free)
# 1. snapshot a corpus: mise run evals:snapshot ./raw.json data/corpus.v1.jsonl
# 2. write judgments in data/judgments.v1.json format (see judgments.fixture.json)
# 3. copy configs/eval.config.ts -> configs/eval-real.config.ts, point at real data + models
# 4. mise run evals:run configs/eval-real.config.ts v1
```

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
