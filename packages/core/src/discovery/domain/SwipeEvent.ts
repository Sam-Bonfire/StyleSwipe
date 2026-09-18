import { z } from 'zod';

export const SwipeDirectionSchema = z.enum(['like', 'dislike', 'superlike', 'skip']);

export type SwipeDirection = z.infer<typeof SwipeDirectionSchema>;

export const InteractionCoordinatesSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export type InteractionCoordinates = z.infer<typeof InteractionCoordinatesSchema>;

export const SwipeEventSchema = z.object({
  userId: z.string().min(1),
  productId: z.string().min(1),
  direction: SwipeDirectionSchema,
  dwellTimeMs: z.number().int().nonnegative(),
  timestamp: z.union([z.string().datetime(), z.number().int().positive()]),
  clientContext: z.object({
    sourceDeck: z.string().optional(),
    sessionId: z.string().optional(),
  }).optional(),
  coordinates: InteractionCoordinatesSchema.optional(),
});

export type SwipeEvent = z.infer<typeof SwipeEventSchema>;
