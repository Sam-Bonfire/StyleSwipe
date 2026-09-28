import { z } from 'zod';

import type { Product } from '../../../shared/domain/types';

import { cosineSimilarity } from '../../../shared/domain/vectors';

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

// -----------------------------------------------------------------------------
// Candidate scoring (domain service)
// -----------------------------------------------------------------------------

export const SCORING_WEIGHTS = {
  vector: 2,
  budgetInRange: 1.0,
  budgetOutOfRange: -0.5,
  brandMatch: 0.5,
  categoryMatch: 0.5,
} as const;

export const DIVERSITY_CAPS = {
  maxPerBrand: 2,
  maxPerCategory: 3,
} as const;

export interface ScoringProfile {
  budget?: { min: number; max: number };
  vibes?: string[];
}

export interface ScoredProduct {
  product: Product;
  score: number;
}

/**
 * Scores one candidate against the user's vector + profile.
 * Pure: all weights are named constants above.
 */
export function scoreCandidate(
  userVector: number[],
  profile: ScoringProfile,
  product: Product,
): number {
  let score = 0;

  // Cosine Similarity on StyleDNA
  if (product.embedding && product.embedding.length === userVector.length) {
    score += cosineSimilarity(userVector, product.embedding) * SCORING_WEIGHTS.vector;
  }

  // Price Affinity Scoring
  if (profile.budget && product.price >= profile.budget.min && product.price <= profile.budget.max) {
    score += SCORING_WEIGHTS.budgetInRange;
  } else if (profile.budget) {
    score += SCORING_WEIGHTS.budgetOutOfRange;
  }

  // Brand/Category Affinities
  if (profile.vibes) {
    const brandMatch = profile.vibes.some((v) => product.brand?.toLowerCase().includes(v.toLowerCase()));
    if (brandMatch) score += SCORING_WEIGHTS.brandMatch;

    const categoryMatch = profile.vibes.some((v) => product.category?.toLowerCase().includes(v.toLowerCase()));
    if (categoryMatch) score += SCORING_WEIGHTS.categoryMatch;
  }

  return score;
}

/**
 * Sorts scored candidates descending, applies diversity caps, fills up
 * with highest-scored leftovers when caps filter too aggressively.
 */
export function diversifyAndLimit(
  scored: ScoredProduct[],
  limit: number,
  caps: { maxPerBrand: number; maxPerCategory: number } = DIVERSITY_CAPS,
): Product[] {
  const sorted = [...scored].sort((a, b) => b.score - a.score);

  const ranked: Product[] = [];
  const brandCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  for (const item of sorted) {
    const brand = item.product.brand || 'unknown';
    const category = item.product.category || 'unknown';

    const brandCount = brandCounts[brand] || 0;
    const categoryCount = categoryCounts[category] || 0;

    if (brandCount < caps.maxPerBrand && categoryCount < caps.maxPerCategory) {
      ranked.push(item.product);
      brandCounts[brand] = brandCount + 1;
      categoryCounts[category] = categoryCount + 1;
    }

    if (ranked.length >= limit) {
      break;
    }
  }

  // Fallback: if we filtered too much due to diversity, just fill it up with highest scored
  if (ranked.length < limit) {
    for (const item of sorted) {
      if (!ranked.some((p) => p.id === item.product.id)) {
        ranked.push(item.product);
      }
      if (ranked.length >= limit) break;
    }
  }

  return ranked.slice(0, limit);
}
