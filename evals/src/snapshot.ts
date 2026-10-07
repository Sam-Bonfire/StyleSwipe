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
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type { EvalProduct } from './types.js';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function pickCategory(raw: Record<string, unknown>): string {
  const direct = raw['category'];
  if (typeof direct === 'string' && direct) return direct;
  if (typeof direct === 'object' && direct !== null) {
    const obj = direct as Record<string, unknown>;
    if (typeof obj['typeName'] === 'string') return obj['typeName'] as string;
    if (typeof obj['name'] === 'string') return obj['name'] as string;
  }
  const analytics = raw['analytics'] as Record<string, unknown> | undefined;
  const articleType = analytics?.['articleType'] ?? raw['articleType'];
  if (typeof articleType === 'string' && articleType) return articleType;
  return 'uncategorized';
}

function pickGender(raw: Record<string, unknown>): string {
  const g = raw['gender'] ?? (raw['core'] as Record<string, unknown> | undefined)?.['gender'];
  return typeof g === 'string' && g ? g.toLowerCase() : 'unisex';
}

function priceTier(price: number): string {
  if (price < 1000) return 'budget';
  if (price < 3000) return 'mid';
  if (price < 10000) return 'premium';
  return 'luxury';
}

function pickAttrs(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const article = raw['articleAttributes'];
  if (typeof article === 'object' && article !== null) Object.assign(out, article);
  const attrs = raw['attributes'];
  if (typeof attrs === 'object' && attrs !== null) Object.assign(out, attrs);
  for (const key of ['color', 'colour', 'fit', 'occasion', 'fabric', 'material', 'pattern']) {
    if (out[key] === undefined && raw[key] !== undefined) out[key] = raw[key];
  }
  return out;
}

function toProduct(raw: Record<string, unknown>, index: number): EvalProduct | null {
  const id = str(raw['externalId'] || raw['productId'] || raw['id']) || `row-${index}`;
  const brandRaw = raw['brand'];
  const brand =
    typeof brandRaw === 'object' && brandRaw !== null
      ? str((brandRaw as Record<string, unknown>)['name'])
      : str(brandRaw);
  const title = str(raw['title'] || raw['name'] || raw['productName'] || raw['product']);
  if (!title) return null;
  const priceObj = raw['price'];
  const price =
    typeof priceObj === 'object' && priceObj !== null
      ? Number(
          (priceObj as Record<string, unknown>)['discounted'] ??
            (priceObj as Record<string, unknown>)['discountedPrice'] ??
            0,
        ) || 0
      : Number(priceObj) || 0;
  const description = str(raw['description']);
  const attributes = pickAttrs(raw);
  const colorRaw =
    attributes['color'] ?? attributes['colour'] ?? attributes['primaryColor'] ?? '';
  const occasionRaw = attributes['occasion'];
  return {
    id,
    title,
    brand,
    description,
    category: pickCategory(raw),
    gender: pickGender(raw),
    priceTier: priceTier(price),
    attributes,
    color: String(colorRaw || '').toLowerCase(),
    fit: String(attributes['fit'] || '').toLowerCase(),
    occasion: Array.isArray(occasionRaw)
      ? occasionRaw.map((o) => String(o).toLowerCase())
      : typeof occasionRaw === 'string' && occasionRaw
        ? [occasionRaw.toLowerCase()]
        : [],
  };
}

const from = arg('--from');
const out = arg('--out') || 'data/corpus.v1.jsonl';
const limit = Number(arg('--limit') || '1000000');

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

const outPath = path.isAbsolute(out) ? out : path.join(process.cwd(), out);
mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, products.map((p) => JSON.stringify(p)).join('\n') + '\n');
console.log(`Wrote ${products.length} products to ${outPath} (skipped ${rows.length - products.length})`);
