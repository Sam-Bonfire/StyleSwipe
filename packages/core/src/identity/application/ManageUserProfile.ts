import { Effect } from 'effect';

import type { User, StyleProfile } from '../../../shared/domain/types';

import { UserRepository } from '../../../shared/application/ports';
import { RepositoryError } from '../../../shared/domain/errors';

export class ProfileError extends Error {
    readonly _tag = 'ProfileError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'ProfileError';
    }
}

export const getCurrentUser = (userId: string): Effect.Effect<User | null, ProfileError | RepositoryError, UserRepository> =>
    Effect.gen(function* (_) {
        const users = yield* _(UserRepository);
        return yield* _(users.findById(userId));
    });

export const updateProfile = (
    userId: string,
    data: Partial<Omit<User, 'id'>>,
): Effect.Effect<User, ProfileError | RepositoryError, UserRepository> =>
    Effect.gen(function* (_) {
        const users = yield* _(UserRepository);
        return yield* _(users.update(userId, data));
    });

export const updateStyleProfile = (
    userId: string,
    profile: StyleProfile,
): Effect.Effect<User, ProfileError | RepositoryError, UserRepository> =>
    Effect.gen(function* (_) {
        const users = yield* _(UserRepository);
        return yield* _(users.updateStyleProfile(userId, profile));
    });
