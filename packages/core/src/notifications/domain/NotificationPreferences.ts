import { z } from 'zod';

export const NotificationPreferencesSchema = z.object({
  push: z.boolean().default(true),
  email: z.boolean().default(true),
  inApp: z.boolean().default(true),
  priceDrops: z.boolean().default(true),
  partnerSync: z.boolean().default(true),
  dailyDrops: z.boolean().default(true),
  marketing: z.boolean().default(false),
});

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;
