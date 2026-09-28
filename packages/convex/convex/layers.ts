/**
 * Effect layer factories binding core ports to Convex primitives.
 *
 * Backend functions delegate business logic to @app/core use cases;
 * these adapters are the only place that touches ctx.db / ctx.vectorSearch
 * / ctx.runQuery for those flows. Validators (convex/values) stay at the
 * function boundary; everything inside is core.
 */
import {
  CartItemSchema,
  CartRepository,
  RepositoryError,
  SimilarProductStore,
  SwipeRepository,
  createCart,
  type Cart,
  type SwipeAction,
} from '@app/core';
import { Effect, Layer } from 'effect';

import type { Id } from './_generated/dataModel';
import type { ActionCtx, MutationCtx } from './_generated/server';

import { api } from './_generated/api';

const toRepositoryError = (e: unknown) =>
  new RepositoryError(e instanceof Error ? e.message : String(e), e);

function toSelectedAttributes(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.every(([, v]) => typeof v === 'string')) return undefined;
  return Object.fromEntries(entries) as Record<string, string>;
}

export function makeCartRepository(ctx: MutationCtx) {
  return Layer.succeed(
    CartRepository,
    CartRepository.of({
      findByUserId: (userId) =>
        Effect.tryPromise({
          try: async () => {
            const doc = await ctx.db.query('carts').withIndex('by_user', (q) => q.eq('userId', userId)).unique();
            if (!doc) return null;
            const items = doc.items.flatMap((item) => {
              const parsed = CartItemSchema.safeParse({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                ...(toSelectedAttributes(item.attributes) ? { selectedAttributes: toSelectedAttributes(item.attributes) } : {}),
              });
              return parsed.success ? [parsed.data] : [];
            });
            return createCart({ userId, items, currency: 'INR', updatedAt: doc.updatedAt });
          },
          catch: toRepositoryError,
        }),
      save: (cart: Cart) =>
        Effect.tryPromise({
          try: async () => {
            const items = cart.items.map((i) => ({
              productId: i.productId as Id<'products'>,
              quantity: i.quantity,
              price: i.price,
              attributes: i.selectedAttributes,
            }));
            const existing = await ctx.db
              .query('carts')
              .withIndex('by_user', (q) => q.eq('userId', cart.userId))
              .unique();
            if (existing) {
              await ctx.db.patch(existing._id, { items, updatedAt: Date.now() });
            } else {
              await ctx.db.insert('carts', { userId: cart.userId, items, updatedAt: Date.now() });
            }
          },
          catch: toRepositoryError,
        }),
      clear: (userId) =>
        Effect.tryPromise({
          try: async () => {
            const existing = await ctx.db
              .query('carts')
              .withIndex('by_user', (q) => q.eq('userId', userId))
              .unique();
            if (existing) {
              await ctx.db.patch(existing._id, { items: [], updatedAt: Date.now() });
            }
          },
          catch: toRepositoryError,
        }),
    }),
  );
}

export function makeSwipeRepository(ctx: MutationCtx) {
  return Layer.succeed(
    SwipeRepository,
    SwipeRepository.of({
      findExistingSwipe: (userId, productId) =>
        Effect.tryPromise({
          try: async () => {
            const doc = await ctx.db
              .query('swipes')
              .withIndex('by_user_product', (q) =>
                q.eq('userId', userId).eq('productId', productId as Id<'products'>),
              )
              .first();
            if (!doc) return null;
            return {
              userId: doc.userId,
              productId: doc.productId,
              action: doc.action as SwipeAction,
              timestamp: doc.timestamp,
            };
          },
          catch: toRepositoryError,
        }),
      recordSwipe: (userId, productId, action, timestamp) =>
        Effect.tryPromise({
          try: async () => {
            const swipeId = await ctx.db.insert('swipes', {
              userId,
              productId: productId as Id<'products'>,
              action,
              timestamp,
            });
            return { swipeId };
          },
          catch: toRepositoryError,
        }),
      savePreferenceVector: (userId, vector) =>
        Effect.tryPromise({
          try: async () => {
            const current = await ctx.db
              .query('style_profiles')
              .withIndex('by_user', (q) => q.eq('userId', userId))
              .first();
            if (current) {
              await ctx.db.patch(current._id, { preferenceVector: vector, lastUpdated: Date.now() });
            } else {
              await ctx.db.insert('style_profiles', {
                userId,
                gender: 'both',
                vibes: [],
                sizes: {},
                budget: { min: 0, max: 20000 },
                preferenceVector: vector,
                lastUpdated: Date.now(),
              });
            }
          },
          catch: toRepositoryError,
        }),
      getSwipesByUser: (userId, limit) =>
        Effect.tryPromise({
          try: async () => {
            const docs = await ctx.db.query('swipes').withIndex('by_user', (q) => q.eq('userId', userId)).collect();
            const records = docs.map((doc) => ({
              userId: doc.userId,
              productId: doc.productId,
              action: doc.action as SwipeAction,
              timestamp: doc.timestamp,
            }));
            return limit === undefined ? records : records.slice(0, limit);
          },
          catch: toRepositoryError,
        }),
    }),
  );
}

export function makeSimilarProductStore(ctx: ActionCtx) {
  return Layer.succeed(
    SimilarProductStore,
    SimilarProductStore.of({
      getEmbedding: (productId) =>
        Effect.tryPromise({
          try: async () => {
            const doc = await ctx.runQuery(api.helpers.getEmbeddingByProductId, {
              productId: productId as Id<'products'>,
            });
            const vector = (doc as unknown as { embeddingVersions?: { v1?: number[] } } | null)?.embeddingVersions
              ?.v1;
            return vector ?? null;
          },
          catch: toRepositoryError,
        }),
      searchSimilar: (vector, limit, category) =>
        Effect.tryPromise({
          try: async () => {
            const results = category
              ? await ctx.vectorSearch('product_embeddings', 'by_embedding_v1', {
                  vector,
                  limit,
                  filter: (q) => q.eq('category', category),
                })
              : await ctx.vectorSearch('product_embeddings', 'by_embedding_v1', { vector, limit });
            return results.map((r) => r._id as string);
          },
          catch: toRepositoryError,
        }),
      getViews: (ids) =>
        Effect.tryPromise({
          try: async () => {
            const products = await ctx.runQuery(api.helpers.getProductsByIds, { ids: ids as never });
            return (products as { _id: string; brand?: string; category?: string }[]).map((p) => ({
              id: p._id,
              brand: p.brand,
              category: p.category,
            }));
          },
          catch: toRepositoryError,
        }),
      getViewsByCategory: (category, limit) =>
        Effect.tryPromise({
          try: async () => {
            const products = await ctx.runQuery(api.products.getByCategory, { category, limit });
            return (products as unknown as { _id: string; brand?: string; category?: string }[]).map((p) => ({
              id: p._id,
              brand: p.brand,
              category: p.category,
            }));
          },
          catch: toRepositoryError,
        }),
    }),
  );
}
