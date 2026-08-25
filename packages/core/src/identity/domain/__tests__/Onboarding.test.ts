import { describe, it, expect } from 'vitest';

import { OnboardingResponseSchema, QuestionSchema } from '../Onboarding';

describe('Onboarding Models', () => {
  describe('QuestionSchema', () => {
    it('should parse valid question', () => {
      const validQuestion = {
        id: 'q1',
        category: 'fit',
        text: 'How do you like your fit?',
        multiSelect: false,
        choices: [
          { id: 'c1', label: 'Tight', value: 'tight' },
          { id: 'c2', label: 'Loose', value: 'loose' },
        ],
      };

      const result = QuestionSchema.safeParse(validQuestion);
      expect(result.success).toBe(true);
    });

    it('should reject question with empty choices', () => {
      const invalidQuestion = {
        id: 'q1',
        category: 'fit',
        text: 'How do you like your fit?',
        multiSelect: false,
        choices: [],
      };

      const result = QuestionSchema.safeParse(invalidQuestion);
      expect(result.success).toBe(false);
    });

    it('should reject invalid category', () => {
      const invalidQuestion = {
        id: 'q1',
        category: 'invalid_category',
        text: 'How do you like your fit?',
        multiSelect: false,
        choices: [
          { id: 'c1', label: 'Tight', value: 'tight' },
        ],
      };

      const result = QuestionSchema.safeParse(invalidQuestion);
      expect(result.success).toBe(false);
    });
  });

  describe('OnboardingResponseSchema', () => {
    it('should parse valid onboarding response', () => {
      const validResponse = {
        userId: 'u1',
        answers: [
          {
            questionId: 'q1',
            selectedChoiceIds: ['c1'],
          },
        ],
        submittedAt: new Date().toISOString(),
      };

      const result = OnboardingResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should parse valid onboarding response with number timestamp', () => {
      const validResponse = {
        userId: 'u1',
        answers: [
          {
            questionId: 'q1',
            selectedChoiceIds: ['c1'],
          },
        ],
        submittedAt: Date.now(),
      };

      const result = OnboardingResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should reject empty answers array', () => {
      const invalidResponse = {
        userId: 'u1',
        answers: [],
        submittedAt: Date.now(),
      };

      const result = OnboardingResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject empty selected choice IDs', () => {
      const invalidResponse = {
        userId: 'u1',
        answers: [
          {
            questionId: 'q1',
            selectedChoiceIds: [],
          },
        ],
        submittedAt: Date.now(),
      };

      const result = OnboardingResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });
});
