import { z } from 'zod';

export const PartnerSyncSessionStatusSchema = z.enum([
  'PENDING',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
]);

export const MutualMatchSchema = z.object({
  productId: z.string(),
  timestamp: z.number(),
});

export const BlendWeightsSchema = z.object({
  hostWeight: z.number().min(0.0).max(1.0),
  partnerWeight: z.number().min(0.0).max(1.0),
}).refine((data) => {
  // Use a small epsilon for floating point comparison if needed, but exact 1.0 is specified
  // We'll just check if it's very close to 1.0 or exactly 1.0 depending on precision needs.
  // Using exact 1.0 as requested
  return Math.abs(data.hostWeight + data.partnerWeight - 1.0) < Number.EPSILON;
}, {
  message: 'Blend weights must sum strictly to 1.0',
  path: ['hostWeight'], // Point error to the object in general or one of the weights
});

export const PartnerSyncSessionSchema = z.object({
  sessionId: z.string(),
  roomCode: z.string().regex(/^[a-zA-Z0-9]{6}$/, 'Room code must be a 6-character alphanumeric string'),
  hostUserId: z.string(),
  partnerUserId: z.string().optional(),
  status: PartnerSyncSessionStatusSchema,
  blendWeights: BlendWeightsSchema,
  activeCategoryIds: z.array(z.string()),
  mutualMatches: z.array(MutualMatchSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type PartnerSyncSessionStatus = z.infer<typeof PartnerSyncSessionStatusSchema>;
export type MutualMatch = z.infer<typeof MutualMatchSchema>;
export type BlendWeights = z.infer<typeof BlendWeightsSchema>;
export type PartnerSyncSession = z.infer<typeof PartnerSyncSessionSchema>;
