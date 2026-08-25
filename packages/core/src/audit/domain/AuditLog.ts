import { z } from 'zod';

export const AuditLogSchema = z.object({
  id: z.string().min(1),
  actorId: z.string().min(1),
  actorRole: z.enum(['USER', 'ADMIN', 'SYSTEM', 'SCRAPER']),
  action: z.string().min(1),
  targetEntity: z.string().min(1),
  targetId: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.number().int().positive(),
}).readonly();

export type AuditLog = z.infer<typeof AuditLogSchema>;
