import { z } from 'zod';

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
export type BooleanFilterExpression =
  | { type: 'AND'; expressions: BooleanFilterExpression[] }
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
