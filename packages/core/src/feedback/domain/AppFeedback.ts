import { z } from 'zod';

export const AppFeedbackSchema = z.object({
  id: z.string().min(1),
  userId: z.string().optional(),
  category: z.enum(['SUGGESTION', 'BUG', 'RECOMMENDATIONS', 'GENERAL']),
  message: z.string().min(1),
  deviceInfo: z.object({
    platform: z.string().min(1),
    appVersion: z.string().min(1),
    osVersion: z.string().min(1),
  }),
  screenshotUrls: z.array(z.string().url()).optional().default([]),
  createdAt: z.number().int().positive(),
});

export type AppFeedback = z.infer<typeof AppFeedbackSchema>;
