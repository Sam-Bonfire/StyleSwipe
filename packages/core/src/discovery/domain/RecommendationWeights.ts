import { z } from 'zod';

export const RecommendationWeightsSchema = z.object({
  styleDnaWeight: z.number().min(0).max(1),
  priceAffinityWeight: z.number().min(0).max(1),
  brandAffinityWeight: z.number().min(0).max(1),
  recencyWeight: z.number().min(0).max(1),
  popularityWeight: z.number().min(0).max(1),
  diversityPenalty: z.number().min(0).max(1),
});

export type RecommendationWeights = z.infer<typeof RecommendationWeightsSchema>;
