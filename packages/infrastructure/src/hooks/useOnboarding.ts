import { api } from '@app/convex';
import { UserRepository, Embedder, RepositoryError } from '@app/core';
import { CompleteOnboarding } from '@app/core';
import { useMutation } from 'convex/react';
import { Effect, Layer } from 'effect';

export function useCompleteOnboarding(generateEmbedding: (text: string) => Promise<number[]>) {
  const updateStyleProfileMutation = useMutation(api.users.updateStyleProfile);

  return async (userId: string, answers: Record<string, string>) => {
    // Inject UserRepository
    const userRepositoryLayer = Layer.succeed(
      UserRepository,
      UserRepository.of({
        updateStyleProfile: (id, profile) =>
          Effect.tryPromise({
            try: () => updateStyleProfileMutation({ styleProfile: profile as any }),
            catch: (e) => new RepositoryError('updateStyleProfile', e),
          }),
        // Stubs for the rest of UserRepository since CompleteOnboarding doesn't use them
        findById: () => Effect.fail(new RepositoryError('findById', new Error('Not implemented'))),
        findByEmail: () => Effect.fail(new RepositoryError('findByEmail', new Error('Not implemented'))),
        findByPhone: () => Effect.fail(new RepositoryError('findByPhone', new Error('Not implemented'))),
        create: () => Effect.fail(new RepositoryError('create', new Error('Not implemented'))),
        update: () => Effect.fail(new RepositoryError('update', new Error('Not implemented'))),
        delete: () => Effect.fail(new RepositoryError('delete', new Error('Not implemented'))),
      }),
    );

    // Inject Embedder
    const embedderLayer = Layer.succeed(
      Embedder,
      Embedder.of({
        generateEmbedding: (text) =>
          Effect.tryPromise({
            try: () => generateEmbedding(text),
            catch: (e) => new RepositoryError('generateEmbedding', e),
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
