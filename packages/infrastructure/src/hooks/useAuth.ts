import { api } from '@app/convex';
/**
 * useAuth — Authentication hooks
 * Wraps Convex auth queries so screens don't import convex/react directly.
 */
import { useQuery, useMutation } from 'convex/react';

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
