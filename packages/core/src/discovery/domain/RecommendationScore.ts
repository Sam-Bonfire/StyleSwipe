import { z } from 'zod';

export const BoundedScoreSchema = z.number().min(-1.0).max(1.0);

export type BoundedScore = z.infer<typeof BoundedScoreSchema>;

export const FeatureSimilarityVectorSchema = z.array(z.number());

export type FeatureSimilarityVector = z.infer<typeof FeatureSimilarityVectorSchema>;

export const AestheticAffinityWeightsSchema = z.record(z.string(), z.number());

export type AestheticAffinityWeights = z.infer<typeof AestheticAffinityWeightsSchema>;

export const RecommendationCandidateSchema = z.object({
  productId: z.string().min(1),
  similarityScore: BoundedScoreSchema,
  relevanceScore: BoundedScoreSchema,
  featureSimilarity: FeatureSimilarityVectorSchema.optional(),
  aestheticAffinity: AestheticAffinityWeightsSchema.optional(),
});

export type RecommendationCandidate = z.infer<typeof RecommendationCandidateSchema>;
