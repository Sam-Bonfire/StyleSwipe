import type { RegisteredMutation } from 'convex/server';

import type { MutationCtx } from './_generated/server';

import { mutation } from './_generated/server';

/**
 * Deterministic E2E fixture set for preview deployments (used by the
 * Playwright suite). Idempotent: only seeds an empty database.
 *
 * Contents: 12 products across categories/brands/genders with images,
 * prices, sizes + inventory, ratings — plus 384-dim embeddings (fixed-seed
 * PRNG so vector search behaves identically on every run) and root
 * categories for browse tests.
 */

// mulberry32 — tiny deterministic PRNG (same fixtures every run).
function prng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = prng(20260929);
const vector = (): number[] => Array.from({ length: 384 }, () => rand() * 2 - 1);

type FixtureProduct = {
  brand: string;
  title: string;
  price: number;
  mrp: number;
  category: string;
  gender: 'men' | 'women' | 'unisex';
  onSale: boolean;
  rating: number;
  reviewCount: number;
  sizes: string[];
};

const PRODUCTS: FixtureProduct[] = [
  { brand: 'E2E Atelier', title: 'E2E Floral Summer Kurta', price: 366, mrp: 2099, category: 'Kurtas', gender: 'women', onSale: true, rating: 4.2, reviewCount: 21, sizes: ['S', 'M', 'L'] },
  { brand: 'E2E Atelier', title: 'E2E Embroidered Festive Kurta', price: 449, mrp: 1599, category: 'Kurtas', gender: 'women', onSale: true, rating: 3.8, reviewCount: 9, sizes: ['M', 'L', 'XL'] },
  { brand: 'E2E Basics', title: 'E2E Essential Cotton Tee', price: 499, mrp: 999, category: 'T-Shirts', gender: 'men', onSale: true, rating: 4.5, reviewCount: 130, sizes: ['S', 'M', 'L', 'XL'] },
  { brand: 'E2E Basics', title: 'E2E Oversized Street Tee', price: 599, mrp: 599, category: 'T-Shirts', gender: 'men', onSale: false, rating: 4.0, reviewCount: 44, sizes: ['M', 'L'] },
  { brand: 'E2E Muse', title: 'E2E Satin Evening Dress', price: 1299, mrp: 2599, category: 'Dresses', gender: 'women', onSale: true, rating: 4.7, reviewCount: 58, sizes: ['XS', 'S', 'M'] },
  { brand: 'E2E Muse', title: 'E2E Linen Summer Dress', price: 899, mrp: 1799, category: 'Dresses', gender: 'women', onSale: true, rating: 4.1, reviewCount: 17, sizes: ['S', 'M'] },
  { brand: 'E2E Denim', title: 'E2E Slim Fit Jeans', price: 1099, mrp: 2199, category: 'Jeans', gender: 'men', onSale: true, rating: 4.3, reviewCount: 76, sizes: ['30', '32', '34'] },
  { brand: 'E2E Denim', title: 'E2E Mom Fit Jeans', price: 999, mrp: 1999, category: 'Jeans', gender: 'women', onSale: true, rating: 4.4, reviewCount: 63, sizes: ['28', '30', '32'] },
  { brand: 'E2E Steps', title: 'E2E Runner Sneakers', price: 1599, mrp: 3199, category: 'Footwear', gender: 'unisex', onSale: true, rating: 4.6, reviewCount: 210, sizes: ['8', '9', '10'] },
  { brand: 'E2E Steps', title: 'E2E Court Sneakers', price: 1399, mrp: 2799, category: 'Footwear', gender: 'unisex', onSale: true, rating: 4.2, reviewCount: 88, sizes: ['7', '8', '9'] },
  { brand: 'E2E Outer', title: 'E2E Field Jacket', price: 2499, mrp: 4999, category: 'Jackets', gender: 'men', onSale: true, rating: 4.8, reviewCount: 31, sizes: ['M', 'L', 'XL'] },
  { brand: 'E2E Outer', title: 'E2E Denim Trucker Jacket', price: 1999, mrp: 3999, category: 'Jackets', gender: 'women', onSale: true, rating: 4.5, reviewCount: 27, sizes: ['S', 'M'] },
];

const CATEGORIES = [
  { name: 'Kurtas', slug: 'kurtas' },
  { name: 'T-Shirts', slug: 't-shirts' },
  { name: 'Dresses', slug: 'dresses' },
  { name: 'Footwear', slug: 'footwear' },
];

export const run: RegisteredMutation<'public', Record<string, never>, Promise<void>> = mutation({
  handler: async (ctx: MutationCtx) => {
    console.log('Seeding preview database...');

    try {
      const existingProducts = await ctx.db.query('products').collect();
      if (existingProducts.length === 0) {
        for (const [index, p] of PRODUCTS.entries()) {
          const productId = await ctx.db.insert('products', {
            brand: p.brand,
            title: p.title,
            price: p.price,
            mrp: p.mrp,
            category: p.category,
            masterCategory: 'Apparel',
            images: [`https://placehold.co/400x500?text=E2E${index + 1}`],
            rating: p.rating,
            reviewCount: p.reviewCount,
            platform: 'E2E',
            gender: p.gender,
            priceTier: 'budget',
            onSale: p.onSale,
            attributes: {
              color: 'Multi',
              size: p.sizes,
              subCategory: 'Topwear',
              inventoryInfo: p.sizes.map((label, sku) => ({
                available: true,
                brandSizeLabel: label,
                inventory: 10 + index,
                label,
                skuId: 900000 + index * 10 + sku,
              })),
            },
            externalId: `e2e-${index + 1}`,
            trustBadges: ['authentic', 'free_delivery'],
            updatedAt: Date.now(),
          });
          await ctx.db.insert('product_embeddings', {
            productId,
            embeddingVersions: { v1: vector() },
            category: p.category,
            gender: p.gender,
            priceTier: 'budget',
            updatedAt: Date.now(),
          });
        }
        console.log(`Inserted ${PRODUCTS.length} fixture products with embeddings.`);
      }

      const existingCategories = await ctx.db.query('categories').collect();
      if (existingCategories.length === 0) {
        for (const c of CATEGORIES) {
          await ctx.db.insert('categories', { ...c, level: 0 });
        }
        console.log(`Inserted ${CATEGORIES.length} fixture categories.`);
      }
      console.log('Seed script ran successfully. The database is initialized.');
    } catch (err) {
      console.error('Seed error', err);
    }
  },
});
