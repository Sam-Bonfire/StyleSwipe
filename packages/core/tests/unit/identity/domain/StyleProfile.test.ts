import { describe, expect, it } from 'vitest';

import { StyleProfileSchema, type StyleProfile } from '../../../../src/identity/domain/StyleProfile';

describe('StyleProfileSchema', () => {
  const validProfile: StyleProfile = {
    id: 'sp-123',
    userId: 'usr-123',
    gender: 'unisex',
    sizes: {},
  };

  it('should successfully parse a minimal valid style profile', () => {
    const result = StyleProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it('should successfully parse a complete style profile with all preferences', () => {
    const completeProfile: StyleProfile = {
      ...validProfile,
      sizes: { top: 'M', bottom: '32' },
      preferredBrands: ['Nike', 'Adidas'],
      priceRange: { min: 50, max: 200 },
      colors: ['black', 'white'],
      lifestyle: ['active', 'casual'],
      fitPreference: 'slim',
      aestheticTags: ['minimalist'],
      dislikedCategories: ['formal'],
      preferenceVector: new Array(384).fill(0.1),
    };
    const result = StyleProfileSchema.safeParse(completeProfile);
    expect(result.success).toBe(true);
  });

  it('should reject a style profile with invalid gender', () => {
    const invalidProfile: Record<string, unknown> = { ...validProfile, gender: 'unknown' };
    const result = StyleProfileSchema.safeParse(invalidProfile);
    expect(result.success).toBe(false);
  });

  it('should reject if max price is less than min price', () => {
    const invalidProfile: StyleProfile = { ...validProfile, priceRange: { min: 100, max: 50 } };
    const result = StyleProfileSchema.safeParse(invalidProfile);
    expect(result.success).toBe(false);
  });

  it('should reject negative prices in price range', () => {
    const invalidProfile: StyleProfile = { ...validProfile, priceRange: { min: -10, max: 50 } };
    const result = StyleProfileSchema.safeParse(invalidProfile);
    expect(result.success).toBe(false);
  });

  it('should reject a preference vector that is not exactly 384 dimensions', () => {
    const invalidProfile: StyleProfile = { ...validProfile, preferenceVector: new Array(100).fill(0.1) };
    const result = StyleProfileSchema.safeParse(invalidProfile);
    expect(result.success).toBe(false);
  });
});
