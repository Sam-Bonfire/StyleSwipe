import { Effect, Layer } from 'effect';
import { describe, expect, it } from 'vitest';

import type { User } from '../../../../shared/domain/types';

import { Embedder, UserRepository } from '../../../../shared/application/ports';
import { completeOnboarding } from '../../../../src/identity/application/CompleteOnboarding';

describe('CompleteOnboarding', () => {
  const mockUser: User = {
    id: 'user-1',
    name: 'Test',
    email: 'test@example.com',
    emailVerified: false,
    phone: '123',
  };

  let updateStyleProfileCalled = false;

  const mockUserRepository = Layer.succeed(
    UserRepository,
    UserRepository.of({
      findById: () => Effect.succeed(mockUser),
      findByEmail: () => Effect.succeed(null),
      findByPhone: () => Effect.succeed(null),
      create: () => Effect.succeed(mockUser),
      update: () => Effect.succeed(mockUser),
      updateStyleProfile: () => {
        updateStyleProfileCalled = true;
        return Effect.succeed(mockUser);
      },
      delete: () => Effect.succeed(undefined),
    })
  );

  const mockEmbedder = Layer.succeed(
    Embedder,
    Embedder.of({
      generateEmbedding: () => Effect.succeed(new Array(384).fill(0.1)),
      getDimensions: () => Effect.succeed(384),
    })
  );

  const MainLayer = Layer.merge(mockUserRepository, mockEmbedder);

  it('should complete onboarding and persist initial style profile', async () => {
    updateStyleProfileCalled = false;
    const answers = {
      gender: 'men',
      fit: 'slim',
      vibe: 'casual',
    };

    const program = completeOnboarding('user-1', answers);
    const profile = await Effect.runPromise(Effect.provide(program, MainLayer));

    expect(profile.gender).toBe('men');
    expect(profile.sizes.top).toBe('slim');
    expect(profile.vibes).toContain('casual');
    expect(profile.preferenceVector).toHaveLength(384);
    expect(updateStyleProfileCalled).toBe(true);
  });

  it('should fail if userId is missing', async () => {
    const program = completeOnboarding('', { gender: 'men', fit: 'slim' });
    await expect(Effect.runPromise(Effect.provide(program, MainLayer))).rejects.toThrow('UserId is required');
  });

  it('should fail with OnboardingValidationError if answers are empty', async () => {
    const program = completeOnboarding('user-1', {});
    await expect(Effect.runPromise(Effect.provide(program, MainLayer))).rejects.toThrowError("Answers are required for onboarding");
  });

  it('should fail with OnboardingValidationError if gender is missing', async () => {
    const program = completeOnboarding('user-1', { fit: 'slim' });
    await expect(Effect.runPromise(Effect.provide(program, MainLayer))).rejects.toThrowError("Gender preference is required");
  });

  it('should fail with OnboardingValidationError if fit is missing', async () => {
    const program = completeOnboarding('user-1', { gender: 'men' });
    await expect(Effect.runPromise(Effect.provide(program, MainLayer))).rejects.toThrowError("Fit preference is required");
  });
});
