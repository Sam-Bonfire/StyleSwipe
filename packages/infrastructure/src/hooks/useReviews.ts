import { api, type Id } from '@app/convex';
import { ManageReviews } from '@app/core';
import { useMutation, useQuery } from 'convex/react';
import { Effect, Layer } from 'effect';
import React from 'react';

export type ReviewDoc = {
  _id: Id<'reviews'>;
  productId: Id<'products'>;
  userId: string;
  rating: number;
  text: string;
  images?: string[];
  helpful: number;
  createdAt: number;
};

export type RatingBreakdown = {
  average: number;
  count: number;
  distribution: Record<number, number>;
};

export function useReviews(productId: string | undefined) {
  const data = useQuery(api.reviews.listByProduct, productId ? { productId: productId as Id<'products'> } : 'skip') as ReviewDoc[] | undefined;
  return data;
}

export function useReviewBreakdown(productId: string | undefined) {
  const data = useQuery(api.reviews.getBreakdown, productId ? { productId: productId as Id<'products'> } : 'skip') as RatingBreakdown | undefined;
  return data;
}

export function useAddReview() {
  const mutation = useMutation(api.reviews.addReview);
  const add = React.useCallback(
    async (input: { productId: string; rating: number; text: string; images?: string[] }) => {
      // Hexagonal validation via core Effect
      const program = ManageReviews.createReview({
        productId: input.productId,
        userId: 'convex-auth', // userId validated server-side via identity
        rating: input.rating,
        text: input.text,
        images: input.images,
      });

      const layer = Layer.succeed(
        ManageReviews.ReviewRepository,
        ManageReviews.ReviewRepository.of({
          listByProduct: () => Effect.succeed([]),
          create: () =>
            Effect.tryPromise({
              try: async () => {
                const id = await mutation({
                  productId: input.productId as Id<'products'>,
                  rating: input.rating,
                  text: input.text,
                  images: input.images,
                });
                return {
                  id: id as unknown as string,
                  productId: input.productId,
                  userId: 'self',
                  rating: input.rating,
                  text: input.text,
                  images: input.images,
                  helpful: 0,
                  createdAt: Date.now(),
                };
              },
              catch: (e) => new ManageReviews.RepositoryError({ message: e instanceof Error ? e.message : String(e), cause: e }),
            }),
        }),
      );

      return Effect.runPromise(program.pipe(Effect.provide(layer)));
    },
    [mutation],
  );
  return add;
}

export function useMarkHelpful() {
  const mutation = useMutation(api.reviews.markHelpful);
  return React.useCallback(
    async (reviewId: string) => {
      return mutation({ reviewId: reviewId as Id<'reviews'> });
    },
    [mutation],
  );
}
