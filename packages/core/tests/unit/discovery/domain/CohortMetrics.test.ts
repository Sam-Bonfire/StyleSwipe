import { describe, it, expect } from 'vitest';

import { ExperimentCohortSchema, RecommendationMetricsSchema } from '../../../../src/discovery/domain/CohortMetrics';

describe('CohortMetrics Domain', () => {
  describe('ExperimentCohortSchema', () => {
    it('validates a valid experiment cohort', () => {
      const cohort = {
        experimentId: 'exp-123',
        variant: 'VARIANT_A' as const,
        userCohortId: 'user-cohort-456',
        assignedAt: new Date(),
      };

      const parsed = ExperimentCohortSchema.safeParse(cohort);
      expect(parsed.success).toBe(true);
    });

    it('coerces string dates to Date objects', () => {
      const cohort = {
        experimentId: 'exp-123',
        variant: 'CONTROL' as const,
        userCohortId: 'user-cohort-456',
        assignedAt: '2024-01-01T00:00:00Z',
      };

      const parsed = ExperimentCohortSchema.parse(cohort);
      expect(parsed.assignedAt).toBeInstanceOf(Date);
    });

    it('rejects empty strings for experimentId and userCohortId', () => {
      const emptyExpId = {
        experimentId: '',
        variant: 'VARIANT_A' as const,
        userCohortId: 'user-cohort-456',
        assignedAt: new Date(),
      };

      const emptyUserCohortId = {
        experimentId: 'exp-123',
        variant: 'VARIANT_A' as const,
        userCohortId: '',
        assignedAt: new Date(),
      };

      expect(ExperimentCohortSchema.safeParse(emptyExpId).success).toBe(false);
      expect(ExperimentCohortSchema.safeParse(emptyUserCohortId).success).toBe(false);
    });
  });

  describe('RecommendationMetricsSchema', () => {
    it('validates valid recommendation metrics', () => {
      const metrics = {
        impressionCount: 100,
        clickThroughRate: 0.05,
        swipeConversionRate: 0.02,
        averageDwellTimeMs: 1500,
        scoringLatencyMs: 45,
      };

      const parsed = RecommendationMetricsSchema.safeParse(metrics);
      expect(parsed.success).toBe(true);
    });

    it('provides defaults for missing optional fields', () => {
      const metrics = {};

      const parsed = RecommendationMetricsSchema.parse(metrics);
      expect(parsed.impressionCount).toBe(0);
      expect(parsed.clickThroughRate).toBe(0);
      expect(parsed.swipeConversionRate).toBe(0);
      expect(parsed.averageDwellTimeMs).toBe(0);
      expect(parsed.scoringLatencyMs).toBe(0);
    });

    it('rejects rates outside [0, 1]', () => {
      const metrics = {
        impressionCount: 100,
        clickThroughRate: 1.5,
        swipeConversionRate: -0.1,
        averageDwellTimeMs: 1500,
        scoringLatencyMs: 45,
      };

      const parsed = RecommendationMetricsSchema.safeParse(metrics);
      expect(parsed.success).toBe(false);
    });

    it('rejects negative latency and dwell time', () => {
      const metrics = {
        impressionCount: 100,
        clickThroughRate: 0.05,
        swipeConversionRate: 0.02,
        averageDwellTimeMs: -100,
        scoringLatencyMs: -5,
      };

      const parsed = RecommendationMetricsSchema.safeParse(metrics);
      expect(parsed.success).toBe(false);
    });
  });
});
