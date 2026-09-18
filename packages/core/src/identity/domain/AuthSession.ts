import { z } from 'zod';

export const DeviceContextSchema = z.object({
  platform: z.enum(['IOS', 'ANDROID', 'WEB']),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
});

export type DeviceContext = z.infer<typeof DeviceContextSchema>;

export const AuthSessionSchema = z.object({
  id: z.string().min(1, 'Session ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  token: z.string().min(1, 'Token is required'),
  refreshToken: z.string().optional(),
  expiresAt: z.union([z.string().datetime(), z.number()]),
  createdAt: z.union([z.string().datetime(), z.number()]),
  updatedAt: z.union([z.string().datetime(), z.number()]),
  isRevoked: z.boolean().default(false),
  revokedAt: z.union([z.string().datetime(), z.number()]).optional(),
  deviceId: z.string().optional(),
  deviceContext: DeviceContextSchema.optional(),
});

export type AuthSession = z.infer<typeof AuthSessionSchema>;

export const AuthSessionService = {
  /**
   * Checks if a session is currently active and valid.
   * A session is valid if it is not revoked and its expiration time is in the future.
   */
  isActive: (session: AuthSession, currentTime: number = Date.now()): boolean => {
    if (session.isRevoked) {
      return false;
    }

    const expiresAtMs =
      typeof session.expiresAt === 'string'
        ? new Date(session.expiresAt).getTime()
        : session.expiresAt;

    return currentTime < expiresAtMs;
  },

  /**
   * Checks if a session is revoked.
   */
  isRevoked: (session: AuthSession): boolean => {
    return session.isRevoked;
  },
};
