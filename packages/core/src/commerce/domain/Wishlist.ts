import { z } from 'zod';

export const WishlistItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  addedAt: z.number().int().min(0),
  desiredPrice: z.number().min(0).optional(),
});
export type WishlistItem = z.infer<typeof WishlistItemSchema>;

export const WishlistSchema = z.object({
  id: z.string().min(1, 'Wishlist ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'Wishlist name is required'),
  items: z.array(WishlistItemSchema).default([]),
  isPublic: z.boolean().default(false),
  shareToken: z.string().optional(),
});
export type Wishlist = z.infer<typeof WishlistSchema>;
