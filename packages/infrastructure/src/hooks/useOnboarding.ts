import { api } from '@app/convex';
import { UserRepository, Embedder, RepositoryError } from '@app/core';
import { CompleteOnboarding } from '@app/core';
import { useMutation } from 'convex/react';
import { Effect, Layer } from 'effect';

import { generateEmbedding } from '../InferenceEngine';

export function useCompleteOnboarding() {
  const updateStyleProfileMutation = useMutation(api.users.updateStyleProfile);

  return async (userId: string, answers: Record<string, string>) => {
    // Inject UserRepository
    const userRepositoryLayer = Layer.succeed(
      UserRepository,
      UserRepository.of({
        updateStyleProfile: (id, profile) =>
          Effect.tryPromise({
            try: () => updateStyleProfileMutation({ styleProfile: profile as any }),
            catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
          }),
        // Stubs for the rest of UserRepository since CompleteOnboarding doesn't use them
        findById: () => Effect.fail(new RepositoryError('Not implemented')),
        findByEmail: () => Effect.fail(new RepositoryError('Not implemented')),
        findByPhone: () => Effect.fail(new RepositoryError('Not implemented')),
        create: () => Effect.fail(new RepositoryError('Not implemented')),
        update: () => Effect.fail(new RepositoryError('Not implemented')),
        delete: () => Effect.fail(new RepositoryError('Not implemented')),
      }),
    );

    // Inject Embedder
    const embedderLayer = Layer.succeed(
      Embedder,
      Embedder.of({
        generateEmbedding: (text) =>
          Effect.tryPromise({
            try: () => generateEmbedding(text),
            catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
          }),
        getDimensions: () => Effect.succeed(384),
      }),
    );

    const program = CompleteOnboarding.completeOnboarding(userId, answers);
    
    // Provide dependencies and execute
    return Effect.runPromise(
      program.pipe(
        Effect.provide(userRepositoryLayer),
        Effect.provide(embedderLayer)
      )
    );
  };
}
