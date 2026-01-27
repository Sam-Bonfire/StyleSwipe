import { Effect, Context } from "effect";
import { Embedder, ProductSearchRepository, SearchResult, EmbeddingError, SearchError } from "../domain/ports";

export class SearchProducts {
    constructor(
        private readonly embedder: Embedder,
        private readonly repo: ProductSearchRepository
    ) { }

    execute(query: string, limit: number = 10): Effect.Effect<SearchResult, EmbeddingError | SearchError | Error> {
        return Effect.gen(this, function* (_) {
            if (query.length < 3) {
                // Return empty if too short, or could error.
                // For this requirement, we assume UI handles debounce/min-length, but domain should enforce valid invocation.
                return { products: [] };
            }

            const vector = yield* _(this.embedder.generate(query));
            const results = yield* _(this.repo.search(vector, limit));

            return results;
        });
    }

    getSuggestions(query: string, limit: number = 3): Effect.Effect<string[], SearchError | Error> {
        return Effect.gen(this, function* (_) {
            if (query.length < 1) return [];
            return yield* _(this.repo.getSuggestions(query, limit));
        });
    }
}
