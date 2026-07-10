import { createClient } from '@convex-dev/better-auth';
import { betterAuth } from 'better-auth';

import type { MutationCtx } from './_generated/server';

import { components } from './_generated/api';
import { getBaseAuthOptions } from './authOptions';

export const authComponent = createClient(components.auth, {
  verbose: false,
});

export const createAuthOptions = (ctx: MutationCtx) => {
  return {
    ...getBaseAuthOptions(),
    database: authComponent.adapter(ctx as any /* better-auth generic types mismatch in monorepo */),
  };
};

export const getAuth = (ctx: MutationCtx) => {
  return betterAuth(createAuthOptions(ctx));
};
