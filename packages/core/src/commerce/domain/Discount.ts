import { z } from 'zod';

export const DiscountTypeSchema = z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']);
export type DiscountType = z.infer<typeof DiscountTypeSchema>;

export const DiscountSchema = z.object({
  code: z.string().min(1, 'Discount code is required').transform((val) => val.toUpperCase()),
  type: DiscountTypeSchema,
  value: z.number().min(0, 'Discount value cannot be negative'),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  validFrom: z.number().min(0).optional(),
  validUntil: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  perUserLimit: z.number().int().min(1).optional(),
});

export type Discount = z.infer<typeof DiscountSchema>;

/**
 * Whole-number discount percent off MRP. Returns 0 when there is no
 * meaningful discount (missing/non-positive MRP, price >= MRP).
 */
export function discountPercentage(price: number, mrp: number): number {
  if (!Number.isFinite(price) || !Number.isFinite(mrp) || mrp <= 0 || price >= mrp) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}
