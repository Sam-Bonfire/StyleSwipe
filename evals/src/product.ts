import type { EvalProduct } from './types.js';

/**
 * Single home for "what is an EvalProduct". Both the snapshot script
 * (Myntra-raw -> EvalProduct) and the corpus loader (JSONL line ->
 * EvalProduct) normalize through here, so gender lowercasing, occasion
 * shapes, and price-tier thresholds can't drift apart again.
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function pickCategory(raw: Record<string, unknown>): string {
  const direct = raw['category'];
  if (typeof direct === 'string' && direct) return direct;
  if (isRecord(direct)) {
    if (typeof direct['typeName'] === 'string') return direct['typeName'] as string;
    if (typeof direct['name'] === 'string') return direct['name'] as string;
  }
  const analytics = raw['analytics'];
  const articleType = isRecord(analytics) ? analytics['articleType'] : raw['articleType'];
  if (typeof articleType === 'string' && articleType) return articleType;
  return 'uncategorized';
}

export function pickGender(raw: Record<string, unknown>): string {
  const core = raw['core'];
  const g = raw['gender'] ?? (isRecord(core) ? core['gender'] : undefined);
  return typeof g === 'string' && g ? g.toLowerCase() : 'unisex';
}

export function priceTier(price: number): string {
  if (price < 1000) return 'budget';
  if (price < 3000) return 'mid';
  if (price < 10000) return 'premium';
  return 'luxury';
}

export function pickAttrs(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const article = raw['articleAttributes'];
  if (isRecord(article)) Object.assign(out, article);
  const attrs = raw['attributes'];
  if (isRecord(attrs)) Object.assign(out, attrs);
  for (const key of ['color', 'colour', 'fit', 'occasion', 'fabric', 'material', 'pattern']) {
    if (out[key] === undefined && raw[key] !== undefined) out[key] = raw[key];
  }
  return out;
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((o) => String(o).toLowerCase()).filter(Boolean);
  if (typeof value === 'string' && value) return [value.toLowerCase()];
  return [];
}

/** Myntra-raw object -> EvalProduct (null when untitled). Used by snapshot. */
export function toProduct(raw: Record<string, unknown>, index: number): EvalProduct | null {
  const id = str(raw['externalId'] || raw['productId'] || raw['id']) || `row-${index}`;
  const brandRaw = raw['brand'];
  const brand = isRecord(brandRaw) ? str(brandRaw['name']) : str(brandRaw);
  const title = str(raw['title'] || raw['name'] || raw['productName'] || raw['product']);
  if (!title) return null;
  const priceObj = raw['price'];
  const price = isRecord(priceObj)
    ? Number(priceObj['discounted'] ?? priceObj['discountedPrice'] ?? 0) || 0
    : Number(priceObj) || 0;
  const attributes = pickAttrs(raw);
  const colorRaw = attributes['color'] ?? attributes['colour'] ?? attributes['primaryColor'] ?? '';
  return {
    id,
    title,
    brand,
    description: str(raw['description']),
    category: pickCategory(raw),
    gender: pickGender(raw),
    priceTier: typeof raw['priceTier'] === 'string' ? (raw['priceTier'] as string) : priceTier(price),
    attributes,
    color: String(colorRaw || '').toLowerCase(),
    fit: String(attributes['fit'] || '').toLowerCase(),
    occasion: asStringList(attributes['occasion']),
  };
}

/** JSONL record -> EvalProduct with the same defaults (used by the loader). */
export function ensureProduct(record: Record<string, unknown>): EvalProduct {
  return {
    id: record['id'] as string,
    title: str(record['title']),
    brand: str(record['brand']),
    description: str(record['description']),
    category: str(record['category']) || 'uncategorized',
    gender: str(record['gender']).toLowerCase() || 'unisex',
    priceTier: str(record['priceTier']) || 'mid',
    attributes: isRecord(record['attributes'])
      ? (record['attributes'] as Record<string, unknown>)
      : {},
    color: str(record['color']).toLowerCase(),
    fit: str(record['fit']).toLowerCase(),
    occasion: asStringList(record['occasion']),
  };
}
