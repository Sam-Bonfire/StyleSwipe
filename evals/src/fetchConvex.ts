import { ConvexHttpClient } from 'convex/browser';
import { anyApi, type FunctionReference } from 'convex/server';
/**
 * Fetches real products from the dev Convex DB (read-only) for the corpus.
 *
 * DB-free at eval time: this script runs ONCE to snapshot data into
 * data/raw-convex.json, then snapshot.ts normalizes it into a pinned
 * corpus JSONL. Never run against prod.
 *
 * Usage:
 *   mise run evals:fetch
 *   (or: pnpm --filter @app/evals fetch -- --limit 500 --out data/raw-convex.json)
 */
import { writeFileSync } from 'node:fs';

import { readArg, resolveOut } from './cli.js';

const limit = Number(readArg(process.argv, '--limit') || '500');
const out = readArg(process.argv, '--out') || 'data/raw-convex.json';
const url = process.env['EXPO_PUBLIC_CONSUMER_APP_CONVEX_URL'] || process.env['CONVEX_URL'];

if (!url) {
  console.error('Missing EXPO_PUBLIC_CONSUMER_APP_CONVEX_URL / CONVEX_URL in env.');
  process.exit(1);
}

const client = new ConvexHttpClient(url);
type GetLatest = FunctionReference<'query', 'public', { limit?: number }, unknown[]>;
const getLatest = (anyApi as unknown as { products: { getLatest: GetLatest } }).products.getLatest;
const products = await client.query(getLatest, { limit });

const outPath = resolveOut(out);
writeFileSync(outPath, JSON.stringify(products, null, 1));
console.log(`Fetched ${products.length} products -> ${outPath}`);
