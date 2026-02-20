import { Effect } from 'effect';

import type { FeedbackRepository } from '../../../shared/domain/ports';
import type { Feedback, FeedbackType } from '../../../shared/domain/types';

// -----------------------------------------------------------------------------
// TAGGED ERRORS
// -----------------------------------------------------------------------------

export class FeedbackError extends Error {
    readonly _tag = 'FeedbackError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'FeedbackError';
    }
}

// -----------------------------------------------------------------------------
// USE CASE: Manage Feedback (User-side)
// -----------------------------------------------------------------------------

export interface SubmitFeedbackInput {
    userId: string;
    name: string;
    contact: string;
    type: FeedbackType;
    message: string;
    attachment?: string;
}

/**
 * User-side feedback operations:
 * Submit new feedback and view own feedback history.
 */
export class ManageFeedback {
    constructor(private readonly repo: FeedbackRepository) { }

    submit(input: SubmitFeedbackInput): Effect.Effect<Feedback, FeedbackError> {
        return Effect.gen(this, function* (_) {
            if (!input.message.trim()) {
                return yield* _(Effect.fail(new FeedbackError('Feedback message is required')));
            }

            return yield* _(
                Effect.tryPromise({
                    try: () => this.repo.create(input),
                    catch: () => new FeedbackError('Failed to submit feedback'),
                }),
            );
        });
    }

    getMyFeedback(userId: string): Effect.Effect<Feedback[], FeedbackError> {
        return Effect.tryPromise({
            try: () => this.repo.listByUser(userId),
            catch: () => new FeedbackError('Failed to fetch feedback'),
        });
    }

    generateUploadUrl(): Effect.Effect<string, FeedbackError> {
        return Effect.tryPromise({
            try: () => this.repo.generateUploadUrl(),
            catch: () => new FeedbackError('Failed to generate upload URL'),
        });
    }
}
