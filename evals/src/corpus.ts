import { readFileSync } from 'node:fs';

import type { EvalProduct, PersonaQuery } from './types.js';

import { ensureProduct, isRecord } from './product.js';

/** Loads a JSONL corpus (one EvalProduct per line, `#` comment lines skipped). */
export function loadCorpus(path: string): EvalProduct[] {
  const raw = readFileSync(path, 'utf8');
  const products: EvalProduct[] = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parsed: unknown = JSON.parse(trimmed);
    if (!isRecord(parsed) || typeof parsed['id'] !== 'string') {
      throw new Error(`Invalid corpus line in ${path}: missing string id`);
    }
    products.push(ensureProduct(parsed));
  }
  const ids = new Set(products.map((p) => p.id));
  if (ids.size !== products.length) throw new Error(`Duplicate product ids in ${path}`);
  return products;
}

export interface LoadedJudgments {
  queries: PersonaQuery[];
  dropped: string[];
}

/**
 * Loads judgments JSON ({ queries: PersonaQuery[] }) and drops queries with
 * fewer relevant ids than minRelevants (returned in `dropped` so runs stay honest).
 */
export function loadJudgments(path: string, minRelevants: number): LoadedJudgments {
  const raw = readFileSync(path, 'utf8');
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || !Array.isArray(parsed['queries'])) {
    throw new Error(`Invalid judgments file ${path}: expected { queries: [] }`);
  }
  const queries: PersonaQuery[] = [];
  const dropped: string[] = [];
  for (const q of parsed['queries'] as unknown[]) {
    if (!isRecord(q) || typeof q['id'] !== 'string') throw new Error(`Invalid query in ${path}`);
    const query: PersonaQuery = {
      id: q['id'] as string,
      text: (q['text'] as string) || '',
      relevantIds: Array.isArray(q['relevantIds'])
        ? (q['relevantIds'] as unknown[]).map(String)
        : [],
      requiredAttrs: {
        color: toLowerList((q['requiredAttrs'] as Record<string, unknown> | undefined)?.['color']),
        occasion: toLowerList(
          (q['requiredAttrs'] as Record<string, unknown> | undefined)?.['occasion'],
        ),
        fit: toLowerList((q['requiredAttrs'] as Record<string, unknown> | undefined)?.['fit']),
      },
    };
    if (query.relevantIds.length < minRelevants) {
      dropped.push(query.id);
      continue;
    }
    queries.push(query);
  }
  return { queries, dropped };
}

function toLowerList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v).toLowerCase());
}
