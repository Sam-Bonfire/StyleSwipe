import type { GenericDataModel } from 'convex/server';

import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { betterAuth, type Auth } from 'better-auth';

import { components } from './_generated/api';
import { getBaseAuthOptions } from './authOptions';

export const authComponent: ReturnType<typeof createClient> = createClient(components.auth, {
  verbose: false,
});

export const createAuthOptions = (
  ctx: GenericCtx<GenericDataModel>,
): ReturnType<typeof getBaseAuthOptions> & { database: ReturnType<typeof authComponent.adapter> } => {
  return {
    ...getBaseAuthOptions(),
    // Adapter declares its own context shape; adapt structurally (better-auth generics mismatch the monorepo DataModel).
    database: authComponent.adapter(ctx as unknown as Parameters<typeof authComponent.adapter>[0]),
  };
};

export const getAuth = (ctx: GenericCtx<GenericDataModel>): Auth<ReturnType<typeof createAuthOptions>> => {
  return betterAuth(createAuthOptions(ctx));
};
