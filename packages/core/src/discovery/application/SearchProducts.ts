import { Effect } from 'effect';

import { Embedder } from '../../../shared/application/ports';
import { RepositoryError } from '../../../shared/domain/errors';
import { ProductSearchRepository, SearchResult, SearchError } from './DiscoveryPorts';

export const execute = (
  query: string,
  limit: number = 10,
): Effect.Effect<SearchResult, SearchError | RepositoryError, Embedder | ProductSearchRepository> =>
  Effect.gen(function* (_) {
    if (query.length < 3) {
      return { products: [] };
    }

    const embedder = yield* _(Embedder);
    const repo = yield* _(ProductSearchRepository);

    const vector = yield* _(embedder.generateEmbedding(query));
    const results = yield* _(repo.search(vector, limit));

    return results;
  });

export const getSuggestions = (query: string, limit: number = 3): Effect.Effect<string[], SearchError | RepositoryError, ProductSearchRepository> =>
  Effect.gen(function* (_) {
    if (query.length < 1) return [];
    
    const repo = yield* _(ProductSearchRepository);
    return yield* _(repo.getSuggestions(query, limit));
  });
