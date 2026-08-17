import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

import { initializeStyleProfile } from '../../../../src/identity/application/InitializeStyleProfile';

describe('InitializeStyleProfile', () => {
  it('should map gender to lowercase', () => {
    const effect = initializeStyleProfile({ gender: 'Men' });
    const profile = Effect.runSync(effect);
    expect(profile.gender).toBe('men');
  });

  it('should default gender to "both" when missing', () => {
    const effect = initializeStyleProfile({});
    const profile = Effect.runSync(effect);
    expect(profile.gender).toBe('both');
  });

  it('should default gender to "both" when empty string', () => {
    const effect = initializeStyleProfile({ gender: '' });
    const profile = Effect.runSync(effect);
    expect(profile.gender).toBe('both');
  });

  it('should map vibe to lowercase array', () => {
    const effect = initializeStyleProfile({ vibe: 'Party' });
    const profile = Effect.runSync(effect);
    expect(profile.vibes).toEqual(['party']);
  });

  it('should have empty vibes when vibe is missing', () => {
    const effect = initializeStyleProfile({});
    const profile = Effect.runSync(effect);
    expect(profile.vibes).toEqual([]);
  });

  it('should map fit to sizes.top', () => {
    const effect = initializeStyleProfile({ fit: 'Slim' });
    const profile = Effect.runSync(effect);
    expect(profile.sizes.top).toBe('Slim');
  });

  it('should have default budget range', () => {
    const effect = initializeStyleProfile({});
    const profile = Effect.runSync(effect);
    expect(profile.budget.min).toBe(0);
    expect(profile.budget.max).toBe(10000);
  });

  it('should return empty preferenceVector', () => {
    const effect = initializeStyleProfile({ gender: 'Women', vibe: 'Chill' });
    const profile = Effect.runSync(effect);
    expect(profile.preferenceVector).toEqual([]);
  });

  it('should handle all answers together', () => {
    const effect = initializeStyleProfile({
      gender: 'Women',
      vibe: 'Adventure',
      fit: 'Oversized',
      color: 'Vibrant',
      lifestyle: 'Gym',
    });
    const profile = Effect.runSync(effect);

    expect(profile.gender).toBe('women');
    expect(profile.vibes).toEqual(['adventure']);
    expect(profile.sizes.top).toBe('Oversized');
    expect(profile.budget.min).toBe(0);
    expect(profile.budget.max).toBe(10000);
    expect(profile.preferenceVector).toEqual([]);
  });
});
