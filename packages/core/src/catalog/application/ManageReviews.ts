import { Context, Data, Effect } from 'effect';

import { computeBreakdown, CreateReviewInputSchema, type RatingBreakdown, type Review } from '../domain/Review';

export class ValidationError extends Data.TaggedError('ValidationError')<{ message: string }> {}
export class RepositoryError extends Data.TaggedError('RepositoryError')<{ message: string; cause?: unknown }> {}

export class ReviewRepository extends Context.Tag('ReviewRepository')<
  ReviewRepository,
  {
    readonly listByProduct: (productId: string) => Effect.Effect<Review[], RepositoryError>;
    readonly create: (input: { productId: string; userId: string; rating: number; text: string; images?: string[] }) => Effect.Effect<Review, RepositoryError>;
  }
>() {}

export function listByProduct(productId: string) {
  return Effect.gen(function* (_) {
    if (!productId) return yield* _(Effect.fail(new ValidationError({ message: 'productId required' })));
    const repo = yield* _(ReviewRepository);
    return yield* _(repo.listByProduct(productId));
  });
}

export function createReview(input: { productId: string; userId: string; rating: number; text: string; images?: string[] }) {
  return Effect.gen(function* (_) {
    const parsed = CreateReviewInputSchema.safeParse(input);
    if (!parsed.success) {
      return yield* _(Effect.fail(new ValidationError({ message: parsed.error.issues[0]?.message ?? 'Invalid input' })));
    }
    const repo = yield* _(ReviewRepository);
    return yield* _(repo.create(parsed.data));
  });
}

export function getBreakdown(productId: string): Effect.Effect<RatingBreakdown, ValidationError | RepositoryError, ReviewRepository> {
  return Effect.gen(function* (_) {
    const reviews = yield* _(listByProduct(productId));
    return computeBreakdown(reviews);
  });
}
