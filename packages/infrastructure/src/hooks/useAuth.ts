import { api } from '@app/convex';
import { IdentityUseCases } from '@app/core';
import { useQuery, useMutation } from 'convex/react';
import { Effect } from 'effect';

import { AuthAdapter } from '../auth/AuthAdapter';
import { createAuthServiceLayer } from '../auth/AuthServiceAdapter';

/**
 * Returns the currently authenticated user, or undefined if loading, or null if not authenticated.
 */
export function useCurrentUser() {
  return useQuery(api.users.currentUser);
}

/**
 * Returns a mutation to get-or-create a user during authentication.
 */
export function useGetOrCreateUser() {
  return useMutation(api.users.getOrCreateUser);
}

/**
 * useAuthActions — Authentication actions
 * Routes through IdentityUseCases in core.
 */
export function useAuthActions(adapter: AuthAdapter) {
  const layer = createAuthServiceLayer(adapter);

  const runHandler = <A, E, R>(program: Effect.Effect<A, E, R>) =>
    Effect.runPromise(program.pipe(Effect.provide(layer)) as Effect.Effect<A, E, never>);

  return {
    signInWithPhone: (phoneNumber: string) =>
      runHandler(IdentityUseCases.signInWithPhone(phoneNumber)),

    verifyOTP: (phoneNumber: string, otp: string) =>
      runHandler(IdentityUseCases.verifyOTP(phoneNumber, otp)),

    signUpWithEmail: (email: string, password: string, name: string) =>
      runHandler(IdentityUseCases.signUpWithEmail(email, password, name)),

    signInWithEmail: (email: string, password: string) =>
      runHandler(IdentityUseCases.signInWithEmail(email, password)),

    signOut: () => runHandler(IdentityUseCases.signOut()),
  };
}
