import { describe, it, expect } from 'vitest';

import { RecommendationWeightsSchema } from '../../../../src/discovery/domain/RecommendationWeights';

describe('RecommendationWeights Domain', () => {
  it('validates valid recommendation weights', () => {
    const weights = {
      styleDnaWeight: 0.5,
      priceAffinityWeight: 0.3,
      brandAffinityWeight: 0.8,
      recencyWeight: 1.0,
      popularityWeight: 0.0,
      diversityPenalty: 0.2,
    };

    const parsed = RecommendationWeightsSchema.safeParse(weights);
    expect(parsed.success).toBe(true);
  });

  it('rejects weights outside the [0, 1] range', () => {
    const negativeWeights = {
      styleDnaWeight: -0.1,
      priceAffinityWeight: 0.3,
      brandAffinityWeight: 0.8,
      recencyWeight: 1.0,
      popularityWeight: 0.0,
      diversityPenalty: 0.2,
    };

    const overOneWeights = {
      styleDnaWeight: 0.5,
      priceAffinityWeight: 1.1,
      brandAffinityWeight: 0.8,
      recencyWeight: 1.0,
      popularityWeight: 0.0,
      diversityPenalty: 0.2,
    };

    expect(RecommendationWeightsSchema.safeParse(negativeWeights).success).toBe(false);
    expect(RecommendationWeightsSchema.safeParse(overOneWeights).success).toBe(false);
  });

  it('rejects missing weights', () => {
    const weights = {
      styleDnaWeight: 0.5,
      priceAffinityWeight: 0.3,
      brandAffinityWeight: 0.8,
      recencyWeight: 1.0,
      popularityWeight: 0.0,
      // diversityPenalty is missing
    };

    const parsed = RecommendationWeightsSchema.safeParse(weights);
    expect(parsed.success).toBe(false);
  });
});
