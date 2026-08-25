import { describe, it, expect } from 'vitest';

import { PartnerSyncSessionSchema, BlendWeightsSchema } from '../../../../src/social/domain/PartnerSyncSession';

describe('PartnerSyncSession Domain Models', () => {
  describe('BlendWeightsSchema', () => {
    it('should validate when weights sum to 1.0', () => {
      const result = BlendWeightsSchema.safeParse({ hostWeight: 0.7, partnerWeight: 0.3 });
      expect(result.success).toBe(true);
    });

    it('should fail when weights do not sum to 1.0', () => {
      const result = BlendWeightsSchema.safeParse({ hostWeight: 0.7, partnerWeight: 0.4 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Blend weights must sum strictly to 1.0');
      }
    });

    it('should fail when a weight is less than 0.0', () => {
      const result = BlendWeightsSchema.safeParse({ hostWeight: 1.1, partnerWeight: -0.1 });
      expect(result.success).toBe(false);
    });

    it('should fail when a weight is greater than 1.0', () => {
      const result = BlendWeightsSchema.safeParse({ hostWeight: 1.2, partnerWeight: -0.2 });
      expect(result.success).toBe(false);
    });
  });

  describe('PartnerSyncSessionSchema', () => {
    it('should validate a complete valid session', () => {
      const session = {
        sessionId: 'session_123',
        roomCode: 'ABC123',
        hostUserId: 'user_1',
        partnerUserId: 'user_2',
        status: 'ACTIVE',
        blendWeights: { hostWeight: 0.5, partnerWeight: 0.5 },
        activeCategoryIds: ['cat_1', 'cat_2'],
        mutualMatches: [{ productId: 'prod_1', timestamp: Date.now() }],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = PartnerSyncSessionSchema.safeParse(session);
      expect(result.success).toBe(true);
    });

    it('should fail when room code is invalid (not 6 chars)', () => {
      const session = {
        sessionId: 'session_123',
        roomCode: 'AB12', // Invalid
        hostUserId: 'user_1',
        status: 'PENDING',
        blendWeights: { hostWeight: 1.0, partnerWeight: 0.0 },
        activeCategoryIds: [],
        mutualMatches: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = PartnerSyncSessionSchema.safeParse(session);
      expect(result.success).toBe(false);
    });

    it('should fail when room code is invalid (non-alphanumeric)', () => {
      const session = {
        sessionId: 'session_123',
        roomCode: 'AB-123', // Invalid
        hostUserId: 'user_1',
        status: 'PENDING',
        blendWeights: { hostWeight: 1.0, partnerWeight: 0.0 },
        activeCategoryIds: [],
        mutualMatches: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = PartnerSyncSessionSchema.safeParse(session);
      expect(result.success).toBe(false);
    });

    it('should allow optional partnerUserId for pending sessions', () => {
      const session = {
        sessionId: 'session_123',
        roomCode: 'ABC123',
        hostUserId: 'user_1',
        status: 'PENDING',
        blendWeights: { hostWeight: 1.0, partnerWeight: 0.0 },
        activeCategoryIds: [],
        mutualMatches: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = PartnerSyncSessionSchema.safeParse(session);
      expect(result.success).toBe(true);
    });
  });
});
