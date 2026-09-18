import { z } from 'zod';

export const QuestionCategorySchema = z.enum([
  'fit',
  'style_aesthetic',
  'budget',
  'sizes',
  'brand_preferences',
]);

export type QuestionCategory = z.infer<typeof QuestionCategorySchema>;

export const ChoiceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.string().min(1),
});

export type Choice = z.infer<typeof ChoiceSchema>;

export const QuestionSchema = z.object({
  id: z.string().min(1),
  category: QuestionCategorySchema,
  text: z.string().min(1),
  multiSelect: z.boolean(),
  choices: z.array(ChoiceSchema).min(1),
});

export type Question = z.infer<typeof QuestionSchema>;

export const AnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedChoiceIds: z.array(z.string().min(1)).min(1),
});

export type Answer = z.infer<typeof AnswerSchema>;

export const OnboardingResponseSchema = z.object({
  userId: z.string().min(1),
  answers: z.array(AnswerSchema).min(1),
  submittedAt: z.union([z.string().datetime(), z.number()]),
});

export type OnboardingResponse = z.infer<typeof OnboardingResponseSchema>;
