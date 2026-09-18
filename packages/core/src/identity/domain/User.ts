import { z } from 'zod';

import { StyleProfileSchema } from './StyleProfile';

export const UserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required').optional(),
  emailVerified: z.boolean().optional(),
  image: z.string().url().optional(),
  phone: z.string().optional(),
  activeOrgId: z.string().optional(),
  styleProfile: StyleProfileSchema.optional(),
});

export type User = z.infer<typeof UserSchema>;

export const UserProfileSchema = z.object({
  id: z.string().min(1, 'User Profile ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  onboardingCompleted: z.boolean(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
