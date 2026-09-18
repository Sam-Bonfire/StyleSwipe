import { z } from 'zod';

export const PushTokenSchema = z.object({
  userId: z.string().min(1),
  token: z.string().min(1),
  platform: z.enum(['IOS', 'ANDROID', 'WEB']),
  service: z.enum(['APNS', 'FCM']),
  isActive: z.boolean().default(true),
  lastSeenAt: z.number().int().positive(),
});

export type PushToken = z.infer<typeof PushTokenSchema>;
