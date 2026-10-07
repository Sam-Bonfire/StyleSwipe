/**
 * Builds a pinned corpus snapshot: raw scraper JSON -> evals/data/corpus.*.jsonl
 *
 * DB-free by design: input is a JSON file (array) of raw Myntra product
 * objects (as produced by the scraper-service / browser extension), output
 * is a stable, versioned JSONL file the runner consumes.
 *
 * Usage:
 *   pnpm --filter @app/evals snapshot -- --from ./raw.json --out data/corpus.v1.jsonl --limit 500
 */
import { readFileSync, writeFileSync } from 'node:fs';

import type { EvalProduct } from './types.js';

import { readArg, resolveOut } from './cli.js';
import { toProduct } from './product.js';

const from = readArg(process.argv, '--from');
const out = readArg(process.argv, '--out') || 'data/corpus.v1.jsonl';
const limit = Number(readArg(process.argv, '--limit') || '1000000');

if (!from) {
  console.error('Usage: snapshot -- --from <raw.json> [--out data/corpus.v1.jsonl] [--limit N]');
  process.exit(1);
}

const rawData: unknown = JSON.parse(readFileSync(from, 'utf8'));
const rows = Array.isArray(rawData) ? rawData : [rawData];
const seen = new Set<string>();
const products: EvalProduct[] = [];
rows.slice(0, limit).forEach((row, i) => {
  if (typeof row !== 'object' || row === null) return;
  const product = toProduct(row as Record<string, unknown>, i);
  if (!product || seen.has(product.id)) return;
  seen.add(product.id);
  products.push(product);
});

const outPath = resolveOut(out);
writeFileSync(outPath, products.map((p) => JSON.stringify(p)).join('\n') + '\n');
console.log(`Wrote ${products.length} products to ${outPath} (skipped ${rows.length - products.length})`);
