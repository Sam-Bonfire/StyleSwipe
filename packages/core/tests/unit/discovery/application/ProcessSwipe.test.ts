import { describe, it, expect } from 'bun:test';
import { Effect, Exit, Cause, Option } from 'effect';

import type { ProcessSwipeInput } from '../../../../src/discovery/application/ProcessSwipe';

import { processSwipe, SwipeError } from '../../../../src/discovery/application/ProcessSwipe';

describe('ProcessSwipe', () => {
    const validInput: ProcessSwipeInput = {
        userId: 'user-1',
        productId: 'prod-1',
        action: 'like',
        timestamp: Date.now(),
    };

    it('should succeed with valid input', async () => {
        const result = await Effect.runPromise(processSwipe(validInput));
        expect(result).toEqual(validInput);
    });

    it('should accept "pass" action', async () => {
        const input = { ...validInput, action: 'pass' as const };
        const result = await Effect.runPromise(processSwipe(input));
        expect(result.action).toBe('pass');
    });

    it('should accept "super" action', async () => {
        const input = { ...validInput, action: 'super' as const };
        const result = await Effect.runPromise(processSwipe(input));
        expect(result.action).toBe('super');
    });

    it('should fail with empty userId', async () => {
        const input = { ...validInput, userId: '' };
        const exit = await Effect.runPromiseExit(processSwipe(input));
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
        const input = { ...validInput, productId: '' };
        const exit = await Effect.runPromiseExit(processSwipe(input));
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
        const input = { ...validInput, timestamp: ts };
        const result = await Effect.runPromise(processSwipe(input));
        expect(result.timestamp).toBe(ts);
    });
});
