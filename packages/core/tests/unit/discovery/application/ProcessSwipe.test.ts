import { SwipeRepository } from '@app/core';
import { ProcessSwipe } from '@app/core';
import { describe, expect, it } from 'vitest';
import { Effect, Exit, Cause, Option, Layer } from 'effect';

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
            recordSwipe: () => Effect.succeed(undefined),
            getSwipesByUser: () => Effect.succeed([]),
        })
    );

    it('should succeed with valid input', async () => {
        const result = await Effect.runPromise(processSwipe(validInput).pipe(Effect.provide(mockLayer)));
        expect(result).toEqual(validInput);
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
});
