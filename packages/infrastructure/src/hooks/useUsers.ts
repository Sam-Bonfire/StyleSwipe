import { api } from '@app/convex';
/**
 * useUsers — User profile hooks
 * Wraps user-related Convex mutations.
 */
import { useMutation } from 'convex/react';

/**
 * Write — updates user profile fields.
 */
export function useUpdateUser() {
    return useMutation(api.users.update);
}

/**
 * Write — updates user style profile (onboarding).
 */
export function useUpdateStyleProfile() {
    return useMutation(api.users.updateStyleProfile);
}
