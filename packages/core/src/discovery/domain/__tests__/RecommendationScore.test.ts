import { describe, it, expect } from 'vitest';

import { RecommendationCandidateSchema, BoundedScoreSchema } from '../RecommendationScore';

describe('RecommendationScore Models', () => {
  describe('BoundedScoreSchema', () => {
    it('should parse valid boundary scores', () => {
      expect(BoundedScoreSchema.safeParse(-1.0).success).toBe(true);
      expect(BoundedScoreSchema.safeParse(0).success).toBe(true);
      expect(BoundedScoreSchema.safeParse(1.0).success).toBe(true);
    });

    it('should reject out of bound scores', () => {
      expect(BoundedScoreSchema.safeParse(-1.1).success).toBe(false);
      expect(BoundedScoreSchema.safeParse(1.1).success).toBe(false);
    });
  });

  describe('RecommendationCandidateSchema', () => {
    it('should parse valid recommendation candidate', () => {
      const validCandidate = {
        productId: 'p1',
        similarityScore: 0.85,
        relevanceScore: 0.9,
        featureSimilarity: [0.1, 0.2, 0.3],
        aestheticAffinity: {
          'grunge': 0.8,
          'minimalist': 0.1,
        },
      };

      const result = RecommendationCandidateSchema.safeParse(validCandidate);
      expect(result.success).toBe(true);
    });

    it('should parse minimal recommendation candidate', () => {
      const validCandidate = {
        productId: 'p1',
        similarityScore: -0.5,
        relevanceScore: 0,
      };

      const result = RecommendationCandidateSchema.safeParse(validCandidate);
      expect(result.success).toBe(true);
    });

    it('should reject invalid scores in candidate', () => {
      const invalidCandidate = {
        productId: 'p1',
        similarityScore: 1.5, // Invalid score
        relevanceScore: 0.5,
      };

      const result = RecommendationCandidateSchema.safeParse(invalidCandidate);
      expect(result.success).toBe(false);
    });
  });
});
