import { z } from 'zod';

export const ProviderSchema = z.enum([
  'EMAIL_OTP',
  'SMS_OTP',
  'GOOGLE',
  'APPLE',
  'GUEST',
]);

export type Provider = z.infer<typeof ProviderSchema>;

export const IdentityAccountSchema = z.object({
  provider: ProviderSchema,
  providerAccountId: z.string().min(1, 'Provider Account ID is required'),
  email: z.string().email('Invalid email address').optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number (must match E.164 format)')
    .optional(),
  isVerified: z.boolean().default(false),
  verifiedAt: z.union([z.string().datetime(), z.number()]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type IdentityAccount = z.infer<typeof IdentityAccountSchema>;
