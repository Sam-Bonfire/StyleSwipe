import { SwipeRepository } from '@app/core';
import { ProcessSwipe } from '@app/core';
import { Effect, Exit, Cause, Option, Layer } from 'effect';
import { describe, expect, it } from 'vitest';

const { processSwipe, SwipeError } = ProcessSwipe;
type ProcessSwipeInput = ProcessSwipe.ProcessSwipeInput;

describe('ProcessSwipe', () => {
    const validInput: ProcessSwipeInput = {
        userId: 'user-1',
        productId: 'prod-1',
        action: 'like',
        timestamp: Date.now(),
    };

    const mockLayer = Layer.succeed(
        SwipeRepository,
        SwipeRepository.of({
            findExistingSwipe: () => Effect.succeed(null),
            recordSwipe: () => Effect.succeed({ swipeId: 'swipe-1' }),
            savePreferenceVector: () => Effect.succeed(undefined),
            getSwipesByUser: () => Effect.succeed([]),
        })
    );

    it('should succeed with valid input', async () => {
        const result = await Effect.runPromise(processSwipe(validInput).pipe(Effect.provide(mockLayer)));
        expect(result).toEqual({ ...validInput, swipeId: 'swipe-1', isMutualMatch: false });
    });

    it('should accept "pass" action', async () => {
        const input: ProcessSwipeInput = { ...validInput, action: 'pass' as const };
        const result = await Effect.runPromise(processSwipe(input).pipe(Effect.provide(mockLayer)));
        expect(result.action).toBe('pass');
    });

    it('should accept "super" action', async () => {
        const input: ProcessSwipeInput = { ...validInput, action: 'super' as const };
        const result = await Effect.runPromise(processSwipe(input).pipe(Effect.provide(mockLayer)));
        expect(result.action).toBe('super');
    });

    it('should fail with empty userId', async () => {
        const input: ProcessSwipeInput = { ...validInput, userId: '' };
        const exit = await Effect.runPromiseExit(processSwipe(input).pipe(Effect.provide(mockLayer)));
        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
            const failure = Cause.failureOption(exit.cause);
            expect(Option.isSome(failure)).toBe(true);
            if (Option.isSome(failure)) {
                expect(failure.value).toBeInstanceOf(SwipeError);
                expect(failure.value.message).toBe('UserId is required');
            }
        }
    });

    it('should fail with empty productId', async () => {
        const input: ProcessSwipeInput = { ...validInput, productId: '' };
        const exit = await Effect.runPromiseExit(processSwipe(input).pipe(Effect.provide(mockLayer)));
        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
            const failure = Cause.failureOption(exit.cause);
            expect(Option.isSome(failure)).toBe(true);
            if (Option.isSome(failure)) {
                expect(failure.value).toBeInstanceOf(SwipeError);
                expect(failure.value.message).toBe('ProductId is required');
            }
        }
    });

    it('should preserve timestamp in output', async () => {
        const ts = 1700000000000;
        const input: ProcessSwipeInput = { ...validInput, timestamp: ts };
        const result = await Effect.runPromise(processSwipe(input).pipe(Effect.provide(mockLayer)));
        expect(result.timestamp).toBe(ts);
    });

    it('should short-circuit duplicate swipes without recording', async () => {
        let recorded = 0;
        let savedVector: number[] | undefined;
        const layer = Layer.succeed(
            SwipeRepository,
            SwipeRepository.of({
                findExistingSwipe: () => Effect.succeed({ userId: 'user-1', productId: 'prod-1', action: 'like' as const, timestamp: 1 }),
                recordSwipe: () => Effect.sync(() => { recorded++; return { swipeId: 'x' }; }),
                savePreferenceVector: (_, v) => Effect.sync(() => { savedVector = v; }),
                getSwipesByUser: () => Effect.succeed([]),
            })
        );
        const result = await Effect.runPromise(processSwipe(validInput).pipe(Effect.provide(layer)));
        expect(result.duplicate).toBe(true);
        expect(result.isMutualMatch).toBe(false);
        expect(recorded).toBe(0);
        expect(savedVector).toBeUndefined();
    });

    it('should record and persist the learned vector', async () => {
        let savedVector: number[] | undefined;
        const embedding = new Array(384).fill(0.5);
        const layer = Layer.succeed(
            SwipeRepository,
            SwipeRepository.of({
                findExistingSwipe: () => Effect.succeed(null),
                recordSwipe: () => Effect.succeed({ swipeId: 'swipe-9' }),
                savePreferenceVector: (_, v) => Effect.sync(() => { savedVector = v; }),
                getSwipesByUser: () => Effect.succeed([]),
            })
        );
        const input: ProcessSwipeInput = { ...validInput, productEmbedding: embedding };
        const result = await Effect.runPromise(processSwipe(input).pipe(Effect.provide(layer)));
        expect(result).toMatchObject({ swipeId: 'swipe-9', isMutualMatch: false });
        expect(savedVector).toHaveLength(384);
        expect(savedVector?.some((v) => v !== 0)).toBe(true);
    });

    it('should report a mutual match when the partner liked the product', async () => {
        const layer = Layer.succeed(
            SwipeRepository,
            SwipeRepository.of({
                findExistingSwipe: (userId) =>
                    Effect.succeed(
                        userId === 'partner-1'
                            ? { userId, productId: 'prod-1', action: 'like' as const, timestamp: 1 }
                            : null,
                    ),
                recordSwipe: () => Effect.succeed({ swipeId: 'swipe-9' }),
                savePreferenceVector: () => Effect.succeed(undefined),
                getSwipesByUser: () => Effect.succeed([]),
            })
        );
        const input: ProcessSwipeInput = { ...validInput, partnerId: 'partner-1' };
        const result = await Effect.runPromise(processSwipe(input).pipe(Effect.provide(layer)));
        expect(result.isMutualMatch).toBe(true);
    });
});
