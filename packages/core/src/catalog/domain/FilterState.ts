import { z } from 'zod';

import type { SortOption } from './SearchQuery';

export const PriceRangeSchema = z.object({
  min: z.number().nonnegative().optional(),
  max: z.number().nonnegative().optional(),
}).refine(
  (data) => {
    if (data.min !== undefined && data.max !== undefined) {
      return data.min <= data.max;
    }
    return true;
  },
  {
    message: "min price must be less than or equal to max price",
    path: ["min"],
  }
);
export type PriceRange = z.infer<typeof PriceRangeSchema>;

export const FilterStateSchema = z.object({
  brandIds: z.array(z.string()).default([]),
  categoryIds: z.array(z.string()).default([]),
  priceRange: PriceRangeSchema.optional(),
  colors: z.array(z.string()).default([]),
  sizes: z.array(z.string()).default([]),
  fitTypes: z.array(z.string()).default([]),
  merchantNames: z.array(z.string()).default([]),
  discountMinPercent: z.number().min(0).max(100).optional(),
  inStockOnly: z.boolean().default(false),
  genders: z.array(z.enum(['men', 'women', 'unisex'])).default([]),
  onSale: z.boolean().default(false),
});
export type FilterState = z.infer<typeof FilterStateSchema>;

export const FacetCountSchema = z.object({
  value: z.string(),
  count: z.number().int().nonnegative(),
});
export type FacetCount = z.infer<typeof FacetCountSchema>;

export const FacetDistributionSchema = z.record(z.string(), z.array(FacetCountSchema));
export type FacetDistribution = z.infer<typeof FacetDistributionSchema>;

// Boolean filter expression trees
export type BooleanFilterExpression =  | { type: 'AND'; expressions: BooleanFilterExpression[] }
  | { type: 'OR'; expressions: BooleanFilterExpression[] }
  | { type: 'NOT'; expression: BooleanFilterExpression }
  | { type: 'TERM'; field: string; value: string | number | boolean };

export const BooleanFilterExpressionSchema: z.ZodType<BooleanFilterExpression> = z.lazy(() =>
  z.union([
    z.object({
      type: z.literal('AND'),
      expressions: z.array(BooleanFilterExpressionSchema),
    }),
    z.object({
      type: z.literal('OR'),
      expressions: z.array(BooleanFilterExpressionSchema),
    }),
    z.object({
      type: z.literal('NOT'),
      expression: BooleanFilterExpressionSchema,
    }),
    z.object({
      type: z.literal('TERM'),
      field: z.string(),
      value: z.union([z.string(), z.number(), z.boolean()]),
    }),
  ])
);

// -----------------------------------------------------------------------------
// Client-side result shaping (pure; applied after vector fetch)
// -----------------------------------------------------------------------------

/**
 * Applies gender/brand/category/price/onSale filters. Products without a
 * gender value pass the gender filter. Generic over the element type so
 * callers keep their own product shape.
 */
export function applyProductFilters<T>(products: T[], filter: FilterState): T[] {
  const genders = filter.genders ?? [];
  return products.filter((item) => {
    const prod = item as unknown as Record<string, unknown>;
    if (genders.length > 0 && prod.gender && !(genders as string[]).includes(String(prod.gender))) return false;
    if (filter.brandIds.length > 0 && !filter.brandIds.includes(String(prod.brand))) return false;
    if (filter.categoryIds.length > 0 && !filter.categoryIds.includes(String(prod.category))) return false;
    if (filter.priceRange?.min !== undefined && (prod.price as number) < filter.priceRange.min) return false;
    if (filter.priceRange?.max !== undefined && (prod.price as number) > filter.priceRange.max) return false;
    // onSale requires an explicit flag or a discounted price
    if (filter.onSale && !prod.onSale && !(typeof prod.mrp === 'number' && prod.mrp > (prod.price as number))) {
      return false;
    }
    return true;
  });
}

/** Price sorts; any other option preserves result (relevance) order. */
export function sortProducts<T extends { price: number }>(products: T[], sort: SortOption | string): T[] {
  if (sort === 'PRICE_ASC') return [...products].sort((a, b) => a.price - b.price);
  if (sort === 'PRICE_DESC') return [...products].sort((a, b) => b.price - a.price);
  return products;
}
