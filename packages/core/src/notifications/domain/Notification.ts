import { z } from 'zod';

export const NotificationSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  type: z.enum([
    'PRICE_DROP',
    'PARTNER_INVITE',
    'PARTNER_MATCH',
    'DISCOVERY_DROP',
    'SYSTEM',
  ]),
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional(),
  isRead: z.boolean().default(false),
  readAt: z.number().int().positive().optional(),
  createdAt: z.number().int().positive(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export function serializeNotificationPayload(notification: Notification): string {
  return JSON.stringify(notification);
}

export function deserializeNotificationPayload(payload: string): Notification {
  return NotificationSchema.parse(JSON.parse(payload));
}
