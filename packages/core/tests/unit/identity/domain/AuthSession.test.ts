import { describe, expect, it } from 'vitest';

import { AuthSessionSchema, AuthSessionService } from '../../../../src/identity/domain/AuthSession';

describe('AuthSession Domain Model', () => {
  const validSession = {
    id: 'session-123',
    userId: 'user-456',
    token: 'jwt-token-xyz',
    expiresAt: Date.now() + 100000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isRevoked: false,
    deviceContext: {
      platform: 'WEB' as const,
      userAgent: 'Mozilla/5.0',
    }
  };

  describe('AuthSessionSchema Validation', () => {
    it('should validate a correct auth session', () => {
      const result = AuthSessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it('should reject session missing required fields', () => {
      const result = AuthSessionSchema.safeParse({ id: 'session-123' });
      expect(result.success).toBe(false);
    });

    it('should reject session with invalid platform', () => {
      const result = AuthSessionSchema.safeParse({
        ...validSession,
        deviceContext: {
          platform: 'WINDOWS',
        }
      });
      expect(result.success).toBe(false);
    });
  });

  describe('AuthSessionService', () => {
    it('isActive should return true for a valid, non-expired, unrevoked session', () => {
      const session = AuthSessionSchema.parse(validSession);
      expect(AuthSessionService.isActive(session)).toBe(true);
    });

    it('isActive should return false for an expired session', () => {
      const expiredSession = AuthSessionSchema.parse({
        ...validSession,
        expiresAt: Date.now() - 100000,
      });
      expect(AuthSessionService.isActive(expiredSession)).toBe(false);
    });

    it('isActive should return false for a revoked session', () => {
      const revokedSession = AuthSessionSchema.parse({
        ...validSession,
        isRevoked: true,
        revokedAt: Date.now(),
      });
      expect(AuthSessionService.isActive(revokedSession)).toBe(false);
    });

    it('isRevoked should correctly reflect revocation status', () => {
      const session = AuthSessionSchema.parse(validSession);
      expect(AuthSessionService.isRevoked(session)).toBe(false);

      const revokedSession = AuthSessionSchema.parse({
        ...validSession,
        isRevoked: true,
        revokedAt: Date.now(),
      });
      expect(AuthSessionService.isRevoked(revokedSession)).toBe(true);
    });
  });
});
