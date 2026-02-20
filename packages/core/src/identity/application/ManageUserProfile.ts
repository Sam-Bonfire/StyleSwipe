import { Effect } from 'effect';

import type { UserRepository } from '../../../shared/domain/ports';
import type { User, StyleProfile } from '../../../shared/domain/types';

// -----------------------------------------------------------------------------
// TAGGED ERRORS
// -----------------------------------------------------------------------------

export class ProfileError extends Error {
    readonly _tag = 'ProfileError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'ProfileError';
    }
}

// -----------------------------------------------------------------------------
// USE CASE: Manage User Profile
// -----------------------------------------------------------------------------

/**
 * Operations for managing user profile data.
 */
export class ManageUserProfile {
    constructor(private readonly users: UserRepository) { }

    getCurrentUser(userId: string): Effect.Effect<User | null, ProfileError> {
        return Effect.tryPromise({
            try: () => this.users.findById(userId),
            catch: () => new ProfileError('Failed to fetch user profile'),
        });
    }

    updateProfile(
        userId: string,
        data: Partial<Omit<User, 'id'>>,
    ): Effect.Effect<User, ProfileError> {
        return Effect.tryPromise({
            try: () => this.users.update(userId, data),
            catch: () => new ProfileError('Failed to update user profile'),
        });
    }

    updateStyleProfile(
        userId: string,
        profile: StyleProfile,
    ): Effect.Effect<User, ProfileError> {
        return Effect.tryPromise({
            try: () => this.users.updateStyleProfile(userId, profile),
            catch: () => new ProfileError('Failed to update style profile'),
        });
    }
}
