import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

import type { OnboardingQuestion } from '../../../../src/identity/application/GetOnboardingQuestions';

import { getOnboardingQuestions } from '../../../../src/identity/application/GetOnboardingQuestions';

describe('GetOnboardingQuestions', () => {
    let questions: OnboardingQuestion[];

    // Run the Effect once and cache the result
    it('should return questions successfully', async () => {
        questions = await Effect.runPromise(getOnboardingQuestions());
        expect(questions).toBeDefined();
        expect(Array.isArray(questions)).toBe(true);
    });

    it('should return exactly 5 questions', async () => {
        const result = await Effect.runPromise(getOnboardingQuestions());
        expect(result).toHaveLength(5);
    });

    it('should have unique IDs', async () => {
        const result = await Effect.runPromise(getOnboardingQuestions());
        const ids = result.map((q) => q.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have required shape for each question', async () => {
        const result = await Effect.runPromise(getOnboardingQuestions());
        for (const q of result) {
            expect(typeof q.id).toBe('string');
            expect(q.id.length).toBeGreaterThan(0);
            expect(typeof q.question).toBe('string');
            expect(q.question.length).toBeGreaterThan(0);
            expect(Array.isArray(q.options)).toBe(true);
            expect(q.options.length).toBeGreaterThan(0);
        }
    });

    it('should include gender question', async () => {
        const result = await Effect.runPromise(getOnboardingQuestions());
        const genderQ = result.find((q) => q.id === 'gender');
        expect(genderQ).toBeDefined();
        expect(genderQ!.options).toContain('Men');
        expect(genderQ!.options).toContain('Women');
        expect(genderQ!.options).toContain('Both');
    });

    it('should include vibe question', async () => {
        const result = await Effect.runPromise(getOnboardingQuestions());
        const vibeQ = result.find((q) => q.id === 'vibe');
        expect(vibeQ).toBeDefined();
        expect(vibeQ!.options.length).toBeGreaterThanOrEqual(3);
    });

    it('should include sizes question with sizing options', async () => {
        const result = await Effect.runPromise(getOnboardingQuestions());
        const sizesQ = result.find((q) => q.id === 'sizes');
        expect(sizesQ).toBeDefined();
        expect(sizesQ!.options).toContain('S');
        expect(sizesQ!.options).toContain('M');
        expect(sizesQ!.options).toContain('L');
    });
});
