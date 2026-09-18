import { describe, expect, it } from 'vitest';

import { IdentityAccountSchema } from '../../../../src/identity/domain/IdentityAccount';

describe('IdentityAccount Domain Model', () => {
  describe('IdentityAccountSchema Validation', () => {
    it('should validate a correct email identity account', () => {
      const result = IdentityAccountSchema.safeParse({
        provider: 'EMAIL_OTP',
        providerAccountId: 'user@example.com',
        email: 'user@example.com',
        isVerified: true,
      });
      expect(result.success).toBe(true);
    });

    it('should validate a correct phone identity account with E.164 format', () => {
      const result = IdentityAccountSchema.safeParse({
        provider: 'SMS_OTP',
        providerAccountId: '+1234567890',
        phoneNumber: '+1234567890',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = IdentityAccountSchema.safeParse({
        provider: 'EMAIL_OTP',
        providerAccountId: 'user-id',
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    it('should reject invalid phone number format', () => {
      const result = IdentityAccountSchema.safeParse({
        provider: 'SMS_OTP',
        providerAccountId: 'user-id',
        phoneNumber: '123-abc-456',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('match E.164 format');
      }
    });

    it('should validate a Google OAuth identity account with metadata', () => {
      const result = IdentityAccountSchema.safeParse({
        provider: 'GOOGLE',
        providerAccountId: 'google-oauth2|123456789',
        email: 'test@gmail.com',
        isVerified: true,
        metadata: {
          picture: 'https://example.com/pic.jpg',
          name: 'Test User'
        }
      });
      expect(result.success).toBe(true);
    });
  });
});
