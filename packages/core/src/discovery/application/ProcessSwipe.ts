import { Effect } from 'effect';

/**
 * Value Object validating the Swipe Action
 */
export type SwipeAction = 'like' | 'pass' | 'super';

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
 * Pure Domain Logic for processing a swipe using Effect
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

    // Potential for more complex logic here (weighting, notifications, etc)
    // For now, we just validate and return
    return input;
  });
