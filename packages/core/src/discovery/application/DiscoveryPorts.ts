import { Context, Effect } from 'effect';

import type { Product } from '../../../shared/domain/types';

import { RepositoryError } from '../../../shared/domain/errors';

export type SwipeAction = 'like' | 'pass' | 'super';

export interface SearchResult {
  products: Product[];
  cursor?: string;
}

export class SearchError extends Error {
  readonly _tag = 'SearchError' as const;
}

export class ProductSearchRepository extends Context.Tag('ProductSearchRepository')<
  ProductSearchRepository,
  {
    readonly search: (
      vector: number[],
      limit: number,
    ) => Effect.Effect<SearchResult, SearchError | RepositoryError>;
    readonly getSuggestions: (
      query: string,
      limit: number,
    ) => Effect.Effect<string[], SearchError | RepositoryError>;
  }
>() {}

export class RecentlyViewedRepository extends Context.Tag('RecentlyViewedRepository')<
  RecentlyViewedRepository,
  {
    readonly getRecentlyViewed: (
      userId: string,
      limit: number,
    ) => Effect.Effect<Product[], RepositoryError>;
    readonly recordProductView: (
      userId: string,
      productId: string,
    ) => Effect.Effect<void, RepositoryError>;
  }
>() {}

export interface SwipeRecord {
  userId: string;
  productId: string;
  action: SwipeAction;
  timestamp: number;
}

export class SwipeRepository extends Context.Tag('SwipeRepository')<
  SwipeRepository,
  {
    readonly recordSwipe: (
      userId: string,
      productId: string,
      action: SwipeAction,
      timestamp: number,
    ) => Effect.Effect<void, RepositoryError>;
    readonly getSwipesByUser: (
      userId: string,
      limit?: number,
    ) => Effect.Effect<SwipeRecord[], RepositoryError>;
  }
>() {}

export class RecommendationService extends Context.Tag('RecommendationService')<
  RecommendationService,
  {
    readonly getVectorFeed: (
      userId: string,
      limit: number,
    ) => Effect.Effect<Product[], RepositoryError>;
  }
>() {}
