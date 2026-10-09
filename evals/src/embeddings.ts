import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { registry } from './registry.js';

export type EmbedRole = 'query' | 'doc';

export interface EmbeddingCache {
  embed(
    modelId: string,
    kind: string,
    texts: string[],
    timings: number[],
    role: EmbedRole,
  ): Promise<number[][]>;
  flush(): void;
}

function textHash(text: string): string {
  return createHash('sha1').update(text).digest('hex').slice(0, 16);
}

/**
 * Content-hash embedding cache shared by every experiment script.
 * Keys include the adapter version, so logic changes recompute instead of
 * silently reusing stale vectors. Flush after each model to survive crashes.
 */
export function createEmbeddingCache(): EmbeddingCache {
  const cacheDir = path.join(process.cwd(), '.cache');
  mkdirSync(cacheDir, { recursive: true });
  const file = path.join(cacheDir, 'embeddings.json');
  let cache: Record<string, number[]> = {};
  try {
    cache = JSON.parse(readFileSync(file, 'utf8')) as Record<string, number[]>;
  } catch {
    cache = {};
  }
  let dirty = false;
  return {
    embed: async (modelId, kind, texts, timings, role) => {
      const model = registry.model(modelId);
      if (model.cacheable === false) {
        const started = performance.now();
        const vectors = await model.embed(texts, role);
        timings.push((performance.now() - started) / Math.max(1, texts.length));
        return vectors;
      }
      const keys = texts.map((t) => `${modelId}::v${model.version}::${kind}::${role}::${textHash(t)}`);
      const missingIdx: number[] = [];
      const missingTexts: string[] = [];
      keys.forEach((key, i) => {
        if (cache[key] === undefined) {
          missingIdx.push(i);
          missingTexts.push(texts[i] as string);
        }
      });
      if (missingTexts.length > 0) {
        const started = performance.now();
        const vectors = await model.embed(missingTexts, role);
        timings.push((performance.now() - started) / missingTexts.length);
        missingIdx.forEach((target, k) => {
          cache[keys[target] as string] = vectors[k] as number[];
        });
        dirty = true;
      }
      return keys.map((key) => cache[key] as number[]);
    },
    flush: () => {
      if (dirty) {
        writeFileSync(file, JSON.stringify(cache));
        dirty = false;
      }
    },
  };
}
