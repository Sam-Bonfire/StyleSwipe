import { Effect, Layer } from 'effect';
import { describe, expect, it } from 'vitest';

import type { User, StyleProfile } from '../../../../shared/domain/types';

import { UserRepository } from '../../../../shared/application/ports';
import { getCurrentUser, updateProfile, updateStyleProfile } from '../../../../src/identity/application/ManageUserProfile';

describe('ManageUserProfile', () => {
  const mockUser: User = {
    id: 'user-1',
    name: 'Test',
    email: 'test@example.com',
    emailVerified: false,
    phone: '123',
  };

  const mockStyleProfile: StyleProfile = {
    gender: 'men',
    sizes: { top: 'M' },
    vibes: ['casual'],
    budget: { min: 0, max: 100 },
  };

  const mockUserRepository = Layer.succeed(
    UserRepository,
    UserRepository.of({
      findById: (id) => Effect.succeed(id === 'user-1' ? mockUser : null),
      findByEmail: () => Effect.succeed(null),
      findByPhone: () => Effect.succeed(null),
      create: () => Effect.succeed(mockUser),
      update: (id, data) => Effect.succeed({ ...mockUser, ...data }),
      updateStyleProfile: (id, profile) => Effect.succeed({ ...mockUser, styleProfile: profile }),
      delete: () => Effect.succeed(undefined),
    })
  );

  it('getCurrentUser should return user', async () => {
    const result = await Effect.runPromise(Effect.provide(getCurrentUser('user-1'), mockUserRepository));
    expect(result).toEqual(mockUser);
  });

  it('getCurrentUser should return null for non-existent user', async () => {
    const result = await Effect.runPromise(Effect.provide(getCurrentUser('user-2'), mockUserRepository));
    expect(result).toBeNull();
  });

  it('updateProfile should merge data', async () => {
    const result = await Effect.runPromise(Effect.provide(updateProfile('user-1', { name: 'Updated Name' }), mockUserRepository));
    expect(result.name).toBe('Updated Name');
  });

  it('updateStyleProfile should attach profile', async () => {
    const result = await Effect.runPromise(Effect.provide(updateStyleProfile('user-1', mockStyleProfile), mockUserRepository));
    expect(result.styleProfile).toEqual(mockStyleProfile);
  });
});
