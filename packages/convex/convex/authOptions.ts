import { convex } from '@convex-dev/better-auth/plugins';
import { type BetterAuthOptions } from 'better-auth';
import { phoneNumber, username, organization } from 'better-auth/plugins';

import authConfig from './auth.config';
import { ac, owner, admin, member } from './auth/permissions';

export const getBaseAuthOptions = (): Omit<BetterAuthOptions, 'database'> => {
  return {
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3211',
    trustedOrigins: [
      'http://localhost:8081',
      'http://127.0.0.1:8081',
      'http://localhost:8082',
      'http://127.0.0.1:8082',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'chrome-extension://*',
      ...(process.env.TRUSTED_ORIGINS
        ? process.env.TRUSTED_ORIGINS.split(',').map((origin: string) => origin.trim())
        : []),
    ],
    advanced: {
      defaultCookieAttributes: {
        sameSite: 'none',
        secure: true,
      },
    },
    // Core Table Mappings (Plural)
    user: {
      modelName: 'users',
    },
    session: {
      modelName: 'sessions',
    },
    account: {
      modelName: 'accounts',
    },
    verification: {
      modelName: 'verifications',
    },

    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      phoneNumber(),
      username(),
      organization({
        ac,
        roles: {
          owner,
          admin,
          member,
        },
        schema: {
          organization: {
            modelName: 'organizations',
          },
          member: {
            modelName: 'members',
          },
          invitation: {
            modelName: 'invitations',
          },
          organizationRole: {
            modelName: 'organizationRoles',
          },
        },
        dynamicAccessControl: {
          enabled: true,
        },
        creatorRole: 'owner',
        membershipLimit: 1000,
        invitationExpiresIn: 48 * 60 * 60, // 48 hours
      }),
      convex({ authConfig }),
    ],
  };
};
