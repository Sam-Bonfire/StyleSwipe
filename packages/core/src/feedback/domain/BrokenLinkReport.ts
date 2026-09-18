import { z } from 'zod';

export const BrokenLinkReportSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  merchantName: z.string().min(1),
  reportedUrl: z.string().url().refine((url) => url.startsWith('https://'), {
    message: 'Reported URL must strictly use HTTPS',
  }),
  issueType: z.enum([
    'OUT_OF_STOCK',
    'DEAD_LINK',
    'WRONG_PRICE',
    'MISMATCHED_IMAGE',
    'OTHER',
  ]),
  reportedBy: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']),
  createdAt: z.number().int().positive(),
});

export type BrokenLinkReport = z.infer<typeof BrokenLinkReportSchema>;

export function transitionReportStatus(
  report: BrokenLinkReport,
  newStatus: BrokenLinkReport['status']
): BrokenLinkReport {
  return BrokenLinkReportSchema.parse({
    ...report,
    status: newStatus,
  });
}
