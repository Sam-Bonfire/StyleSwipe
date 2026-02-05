import { Effect } from 'effect';

import { Product } from '../../../shared/domain/types';

// Common types
export type Vector384 = number[];

export interface SearchResult {
  products: Product[];
  cursor?: string;
}

// Domain Errors
export class EmbeddingError extends Error {
  readonly _tag = 'EmbeddingError';
}

export class SearchError extends Error {
  readonly _tag = 'SearchError';
}

// Ports
export interface Embedder {
  generate(text: string): Effect.Effect<Vector384, EmbeddingError>;
}

export interface ProductSearchRepository {
  search(vector: Vector384, limit: number): Effect.Effect<SearchResult, SearchError>;
  getSuggestions(query: string, limit: number): Effect.Effect<string[], SearchError>;
}
