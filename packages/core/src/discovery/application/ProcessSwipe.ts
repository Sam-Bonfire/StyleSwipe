import { Effect } from 'effect';

import type { SwipeRepository, SwipeAction } from '../domain/DiscoveryPorts';

/** Valid swipe actions — pure TS replacement for convex/values schema */
const VALID_SWIPE_ACTIONS: ReadonlySet<string> = new Set(['like', 'pass', 'super']);

/** Type guard for SwipeAction */
export const isValidSwipeAction = (value: string): value is SwipeAction =>
  VALID_SWIPE_ACTIONS.has(value);

/**
 * Input for the ProcessSwipe use case
 */
export interface ProcessSwipeInput {
  userId: string;
  productId: string;
  action: SwipeAction;
  timestamp: number;
}

/**
 * Domain error for swipe processing
 */
export class SwipeError extends Error {
  readonly _tag = 'SwipeError';
}

/**
 * Use case for processing a swipe with persistence
 */
export class ProcessSwipe {
  constructor(private readonly swipeRepo: SwipeRepository) { }

  execute(input: ProcessSwipeInput): Effect.Effect<ProcessSwipeInput, SwipeError> {
    return Effect.gen(this, function* (_) {
      if (!input.userId) {
        return yield* _(Effect.fail(new SwipeError('UserId is required')));
      }
      if (!input.productId) {
        return yield* _(Effect.fail(new SwipeError('ProductId is required')));
      }
      if (!isValidSwipeAction(input.action)) {
        return yield* _(Effect.fail(new SwipeError(`Invalid action: ${input.action}`)));
      }

      yield* _(
        Effect.tryPromise({
          try: () =>
            this.swipeRepo.recordSwipe(
              input.userId,
              input.productId,
              input.action,
              input.timestamp,
            ),
          catch: () => new SwipeError('Failed to record swipe'),
        }),
      );

      return input;
    });
  }
}

/**
 * @deprecated Use ProcessSwipe class instead
 */
export const processSwipe = (
  input: ProcessSwipeInput,
): Effect.Effect<ProcessSwipeInput, SwipeError, never> =>
  Effect.gen(function* (_) {
    if (!input.userId) {
      yield* _(Effect.fail(new SwipeError('UserId is required')));
    }
    if (!input.productId) {
      yield* _(Effect.fail(new SwipeError('ProductId is required')));
    }
    return input;
  });
