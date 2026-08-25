import { describe, expect, it } from 'vitest';

import { UserSchema, UserProfileSchema, type User, type UserProfile } from '../../../../src/identity/domain/User';

describe('User Domain Schemas', () => {
  describe('UserSchema', () => {
    const validUser: User = {
      id: 'usr-123',
      name: 'John Doe',
      email: 'john@example.com',
    };

    it('should successfully parse a valid user', () => {
      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject a user with invalid email', () => {
      const invalidUser = { ...validUser, email: 'not-an-email' };
      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should reject a user with empty name', () => {
      const invalidUser = { ...validUser, name: '' };
      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe('UserProfileSchema', () => {
    const validProfile: UserProfile = {
      id: 'prof-123',
      userId: 'usr-123',
      onboardingCompleted: true,
    };

    it('should successfully parse a valid user profile', () => {
      const result = UserProfileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it('should reject a profile missing userId', () => {
      const invalidProfile = { ...validProfile };
      delete (invalidProfile as Record<string, unknown>).userId;
      const result = UserProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });
  });
});
