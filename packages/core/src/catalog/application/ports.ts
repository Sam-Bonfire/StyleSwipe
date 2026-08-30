import { Context, Effect } from 'effect';

import type { Category } from '../domain/Category';
import type {
  RepositoryError,
  AssetStorageError
} from '../domain/errors';
import type { Product } from '../domain/Product';

export interface SearchQuery {
  query?: string;
  categoryId?: string;
  limit?: number;
  cursor?: string;
}

export class ProductRepository extends Context.Tag('ProductRepository')<
  ProductRepository,
  {
    readonly findById: (id: string) => Effect.Effect<Product | null, RepositoryError>;
    readonly findBySlug: (slug: string) => Effect.Effect<Product | null, RepositoryError>;
    readonly search: (query: SearchQuery) => Effect.Effect<{ items: Product[]; total: number; nextCursor?: string }, RepositoryError>;
    readonly findByCategory: (category: string, limit?: number) => Effect.Effect<Product[], RepositoryError>;
    readonly findByCategoryAndPrice: (category: string, minPrice: number, maxPrice: number, limit?: number) => Effect.Effect<Product[], RepositoryError>;
    readonly findByBrand: (brand: string, limit?: number) => Effect.Effect<Product[], RepositoryError>;
    readonly searchByTitle: (query: string, filters?: { brand?: string; category?: string }) => Effect.Effect<Product[], RepositoryError>;
    readonly findSimilar: (embedding: number[], limit?: number, filters?: { category?: string; brand?: string }) => Effect.Effect<Product[], RepositoryError>;
    readonly create: (product: Omit<Product, "id">) => Effect.Effect<Product, RepositoryError>;
    readonly update: (id: string, data: Partial<Product>) => Effect.Effect<Product, RepositoryError>;
    readonly updateEmbedding: (id: string, embedding: number[]) => Effect.Effect<Product, RepositoryError>;
    readonly getLatest: (limit: number) => Effect.Effect<Product[], RepositoryError>;
    readonly save: (product: Product) => Effect.Effect<Product, RepositoryError>;
    readonly batchSave: (products: Product[]) => Effect.Effect<Product[], RepositoryError>;
    readonly delete: (id: string) => Effect.Effect<void, RepositoryError>;
  }
>() {}

export class CategoryRepository extends Context.Tag('CategoryRepository')<
  CategoryRepository,
  {
    readonly findById: (id: string) => Effect.Effect<Category | null, RepositoryError>;
    readonly findBySlug: (slug: string) => Effect.Effect<Category | null, RepositoryError>;
    readonly listTree: () => Effect.Effect<Category[], RepositoryError>;
    readonly listRootCategories: () => Effect.Effect<Category[], RepositoryError>;
    readonly save: (category: Category) => Effect.Effect<Category, RepositoryError>;
    readonly delete: (id: string) => Effect.Effect<void, RepositoryError>;
  }
>() {}

export class AssetStorageService extends Context.Tag('AssetStorageService')<
  AssetStorageService,
  {
    readonly getPresignedUploadUrl: (filename: string, mimeType: string, folder?: string) => Effect.Effect<{ uploadUrl: string; assetKey: string }, AssetStorageError>;
    readonly getPublicUrl: (assetKey: string) => Effect.Effect<string, AssetStorageError>;
    readonly deleteAsset: (assetKey: string) => Effect.Effect<void, AssetStorageError>;
    readonly optimizeImageUrl: (url: string, options: { width?: number; format?: 'webp' | 'avif' | 'jpeg'; quality?: number }) => Effect.Effect<string, AssetStorageError>;
  }
>() {}
