import { z } from 'zod';

export const ReviewSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  userId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1).max(2000),
  images: z.array(z.string().url()).optional(),
  helpful: z.number().int().min(0),
  createdAt: z.number(),
});

export type Review = z.infer<typeof ReviewSchema>;

export const CreateReviewInputSchema = z.object({
  productId: z.string().min(1),
  userId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(3).max(2000),
  images: z.array(z.string().url()).optional(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewInputSchema>;

export type RatingBreakdown = {
  average: number;
  count: number;
  distribution: Record<number, number>; // 1..5 -> count
};

export function computeBreakdown(reviews: Review[]): RatingBreakdown {
  if (reviews.length === 0) {
    return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of reviews) {
    sum += r.rating;
    distribution[r.rating] = (distribution[r.rating] ?? 0) + 1;
  }
  return { average: sum / reviews.length, count: reviews.length, distribution };
}
