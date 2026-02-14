import { describe, it, expect } from 'bun:test';

import { initializeStyleProfile } from '../../../../src/identity/application/InitializeStyleProfile';

describe('InitializeStyleProfile', () => {
    it('should map gender to lowercase', () => {
        const profile = initializeStyleProfile({ gender: 'Men' });
        expect(profile.gender).toBe('men');
    });

    it('should default gender to "both" when missing', () => {
        const profile = initializeStyleProfile({});
        expect(profile.gender).toBe('both');
    });

    it('should default gender to "both" when empty string', () => {
        const profile = initializeStyleProfile({ gender: '' });
        expect(profile.gender).toBe('both');
    });

    it('should map vibe to lowercase array', () => {
        const profile = initializeStyleProfile({ vibe: 'Party' });
        expect(profile.vibes).toEqual(['party']);
    });

    it('should have empty vibes when vibe is missing', () => {
        const profile = initializeStyleProfile({});
        expect(profile.vibes).toEqual([]);
    });

    it('should map fit to sizes.top', () => {
        const profile = initializeStyleProfile({ fit: 'Slim' });
        expect(profile.sizes.top).toBe('Slim');
    });

    it('should have default budget range', () => {
        const profile = initializeStyleProfile({});
        expect(profile.budget.min).toBe(0);
        expect(profile.budget.max).toBe(10000);
    });

    it('should return empty preferenceVector', () => {
        const profile = initializeStyleProfile({ gender: 'Women', vibe: 'Chill' });
        expect(profile.preferenceVector).toEqual([]);
    });

    it('should handle all answers together', () => {
        const profile = initializeStyleProfile({
            gender: 'Women',
            vibe: 'Adventure',
            fit: 'Oversized',
            color: 'Vibrant',
            lifestyle: 'Gym',
        });

        expect(profile.gender).toBe('women');
        expect(profile.vibes).toEqual(['adventure']);
        expect(profile.sizes.top).toBe('Oversized');
        expect(profile.budget.min).toBe(0);
        expect(profile.budget.max).toBe(10000);
        expect(profile.preferenceVector).toEqual([]);
    });
});
