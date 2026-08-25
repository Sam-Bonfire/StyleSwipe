import { Effect } from 'effect';

import type { StyleProfile } from '../domain/StyleProfile';

import { UserRepository, Embedder } from '../../../shared/application/ports';
import { RepositoryError, AuthError, OnboardingValidationError } from '../../../shared/domain/errors';
import { initializeStyleProfile } from './InitializeStyleProfile';

/**
 * Orchestrates the onboarding completion process.
 * 1. Generates a pure domain StyleProfile based on answers.
 * 2. Uses the Embedder port to convert semantic description into a preference vector.
 * 3. Uses the UserRepository port to save the profile.
 */
export const completeOnboarding = (
  userId: string,
  answers: Record<string, string>,
): Effect.Effect<StyleProfile, RepositoryError | AuthError | OnboardingValidationError | Error, UserRepository | Embedder> =>
  Effect.gen(function* (_) {
    if (!userId) {
      return yield* _(Effect.fail(new Error('UserId is required')));
    }

    if (!answers || Object.keys(answers).length === 0) {
      return yield* _(Effect.fail(new OnboardingValidationError('Answers are required for onboarding')));
    }

    if (!answers.gender) {
      return yield* _(Effect.fail(new OnboardingValidationError('Gender preference is required')));
    }

    if (!answers.fit) {
      return yield* _(Effect.fail(new OnboardingValidationError('Fit preference is required')));
    }

    // 1. Create base profile using domain logic
    const baseProfile = yield* _(initializeStyleProfile(answers));

    // 2. Format semantic description
    const semanticDescription = Object.entries(answers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('. ');

    // 3. Generate preference vector
    const embedder = yield* _(Embedder);
    const vector = yield* _(embedder.generateEmbedding(semanticDescription));
    
    // Assign to profile
    baseProfile.preferenceVector = vector;

    // 4. Persist to DB
    const userRepository = yield* _(UserRepository);
    yield* _(userRepository.updateStyleProfile(userId, baseProfile));

    return baseProfile;
  });
