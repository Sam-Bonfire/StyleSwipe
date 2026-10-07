/**
 * Eval harness contracts.
 *
 * Adding a hypothesis = implement one of these interfaces in
 * src/models|docs|queries/*.ts and register it in src/registry.ts.
 * Nothing else changes.
 */

/** One catalog product as seen by the eval (subset of scraper output). */
export interface EvalProduct {
  id: string;
  title: string;
  brand: string;
  description: string;
  category: string;
  gender: string;
  priceTier: string;
  attributes: Record<string, unknown>;
  /** Normalized for the attr-hit metric (lowercase, e.g. "black"). */
  color: string;
  fit: string;
  occasion: string[];
}

/** One persona query + its judged relevant set. */
export interface PersonaQuery {
  id: string;
  /** Raw user-side text (onboarding-style, as a user would express it). */
  text: string;
  /** Product ids judged relevant. Minimum 5, else the query is dropped. */
  relevantIds: string[];
  /** Attribute-level expectations for the attr-hit metric. */
  requiredAttrs: {
    color: string[];
    occasion: string[];
    fit: string[];
  };
}

/** Text -> vectors. Real (transformers.js) or deterministic fake for tests. */
export interface ModelAdapter {
  readonly id: string;
  readonly dims: number;
  /** On-disk quantized size in bytes (cost column, 0 = unknown). */
  readonly approxBytes: number;
  embed(texts: string[]): Promise<number[][]>;
}

/** Product -> embed text. This is the "data + layout" axis. */
export interface DocBuilder {
  readonly id: string;
  build(product: EvalProduct): string;
}

/** PersonaQuery -> embed text. This is the "user-side construction" axis. */
export interface QueryBuilder {
  readonly id: string;
  build(query: PersonaQuery): string;
}

/** One experiment cell. */
export interface ExperimentConfig {
  corpus: string;
  judgments: string;
  models: string[];
  docs: string[];
  queries: string[];
  /** Prefix-truncation levels to evaluate (full dims when omitted). */
  dims: number[];
  topK: number[];
  seeds: number[];
  minRelevantsPerQuery: number;
  outDir: string;
}

export interface RankedId {
  id: string;
  score: number;
  rank: number;
}

/** Scores for one query at each K. */
export interface QueryScores {
  queryId: string;
  recallAtK: Record<number, number>;
  ndcgAtK: Record<number, number>;
  attrHitAtK: Record<number, number>;
  coverageAtK: Record<number, number>;
  diversityAtK: Record<number, number>;
}

export interface ConfigSummary {
  key: string;
  model: string;
  doc: string;
  query: string;
  dims: number;
  seed: number;
  corpusSize: number;
  queryCount: number;
  droppedQueries: string[];
  avg: {
    recallAtK: Record<number, number>;
    ndcgAtK: Record<number, number>;
    attrHitAtK: Record<number, number>;
    coverageAtK: Record<number, number>;
    diversityAtK: Record<number, number>;
  };
  cost: {
    docEmbedMsP50: number;
    queryEmbedMsP50: number;
    searchMsP50: number;
    modelBytes: number;
    indexBytes: number;
  };
  perQuery: QueryScores[];
}
