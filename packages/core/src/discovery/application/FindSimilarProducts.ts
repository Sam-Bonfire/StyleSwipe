import { Effect } from 'effect';

import { RepositoryError } from '../../../shared/domain/errors';
import { SimilarProductStore } from './DiscoveryPorts';

export interface FindSimilarInput {
  productId?: string;
  embedding?: number[];
  limit?: number;
  brand?: string;
  category?: string;
}

/**
 * Orders candidate product ids by embedding similarity with
 * brand/category shaping. Vector search when an embedding is available,
 * category listing fallback otherwise. Pure orchestration over the
 * SimilarProductStore port — no database or vector primitives here.
 */
export const findSimilarProductIds = (
  input: FindSimilarInput,
): Effect.Effect<string[], RepositoryError, SimilarProductStore> =>
  Effect.gen(function* (_) {
    const store = yield* _(SimilarProductStore);
    const limit = input.limit ?? 10;

    const vector = input.embedding ?? (input.productId ? yield* _(store.getEmbedding(input.productId)) : null);

    if (vector) {
      const ids = yield* _(store.searchSimilar(vector, limit + 1, input.category));
      const views = yield* _(store.getViews(ids));
      return views
        .filter((v) => (!input.productId || v.id !== input.productId) && (!input.brand || v.brand === input.brand))
        .map((v) => v.id)
        .slice(0, limit);
    }

    if (input.productId) {
      const [self] = yield* _(store.getViews([input.productId]));
      if (!self?.category) return [];
      const byCategory = yield* _(store.getViewsByCategory(self.category, limit + 1));
      return byCategory
        .filter((v) => v.id !== input.productId)
        .map((v) => v.id)
        .slice(0, limit);
    }

    return [];
  });
