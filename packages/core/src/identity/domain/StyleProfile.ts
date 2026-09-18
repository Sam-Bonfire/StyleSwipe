import { z } from 'zod';

export const StyleProfileSchema = z.object({
  id: z.string().min(1, 'Style Profile ID is required').optional(),
  userId: z.string().min(1, 'User ID is required').optional(),
  gender: z.enum(['men', 'women', 'unisex', 'both']),
  age: z.string().optional(),
  sizes: z.record(z.string(), z.string()).or(z.object({
    top: z.string().optional(),
    bottom: z.string().optional(),
    shoe: z.string().optional(),
  })),
  preferredBrands: z.array(z.string()).optional(),
  priceRange: z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
  }).refine((data) => data.max >= data.min, {
    message: "Max price cannot be less than min price",
    path: ["max"],
  }).optional(),
  colors: z.array(z.string()).optional(),
  lifestyle: z.array(z.string()).optional(),
  fitPreference: z.string().optional(),
  aestheticTags: z.array(z.string()).optional(),
  dislikedCategories: z.array(z.string()).optional(),
  preferenceVector: z.array(z.number()).length(384, 'Preference vector must be exactly 384 dimensions').optional(),
  vibes: z.array(z.string()).optional(),
  budget: z.object({ min: z.number(), max: z.number() }).optional(),
});

export type StyleProfile = z.infer<typeof StyleProfileSchema>;
