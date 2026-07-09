import { Effect } from 'effect';

import { RepositoryError } from '../../../shared/domain/errors';
import { applyDisplacement } from '../../identity/domain/StyleDNA';
import { SwipeRepository, SwipeAction } from '../application/DiscoveryPorts';

/** Valid swipe actions — pure TS replacement for convex/values schema */
const VALID_SWIPE_ACTIONS: ReadonlySet<string> = new Set(['like', 'pass', 'super']);

export const isValidSwipeAction = (value: string): value is SwipeAction =>
  VALID_SWIPE_ACTIONS.has(value);

export interface ProcessSwipeInput {
  userId: string;
  productId: string;
  action: SwipeAction;
  timestamp: number;
  userPreferenceVector?: number[];
  productEmbedding?: number[];
}

export class SwipeError extends Error {
  readonly _tag = 'SwipeError' as const;
  constructor(readonly message: string) {
    super(message);
  }
}

export const processSwipe = (
  input: ProcessSwipeInput,
): Effect.Effect<ProcessSwipeInput, SwipeError | RepositoryError, SwipeRepository> =>
  Effect.gen(function* (_) {
    if (!input.userId) {
      return yield* _(Effect.fail(new SwipeError('UserId is required')));
    }
    if (!input.productId) {
      return yield* _(Effect.fail(new SwipeError('ProductId is required')));
    }
    if (!isValidSwipeAction(input.action)) {
      return yield* _(Effect.fail(new SwipeError(`Invalid action: ${input.action}`)));
    }

    let newPreferenceVector: number[] | undefined = undefined;
    if ((input.action === 'like' || input.action === 'super') && input.productEmbedding) {
      const currentVector = input.userPreferenceVector || Array(384).fill(0);
      newPreferenceVector = applyDisplacement(currentVector, input.productEmbedding, input.action);
    }

    const swipeRepo = yield* _(SwipeRepository);
    yield* _(swipeRepo.recordSwipe(input.userId, input.productId, input.action, input.timestamp, newPreferenceVector));

    return input;
  });
