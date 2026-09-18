import { z } from 'zod';

export const ExperimentVariantSchema = z.enum([
  'CONTROL',
  'VARIANT_A',
  'VARIANT_B',
]);
export type ExperimentVariant = z.infer<typeof ExperimentVariantSchema>;

export const ExperimentCohortSchema = z.object({
  experimentId: z.string().min(1),
  variant: ExperimentVariantSchema,
  userCohortId: z.string().min(1),
  assignedAt: z.coerce.date(),
});
export type ExperimentCohort = z.infer<typeof ExperimentCohortSchema>;

export const RecommendationMetricsSchema = z.object({
  impressionCount: z.number().int().nonnegative().default(0),
  clickThroughRate: z.number().min(0).max(1).default(0),
  swipeConversionRate: z.number().min(0).max(1).default(0),
  averageDwellTimeMs: z.number().nonnegative().default(0),
  scoringLatencyMs: z.number().nonnegative().default(0),
});
export type RecommendationMetrics = z.infer<typeof RecommendationMetricsSchema>;
