import { Effect } from 'effect';

import type { Feedback, FeedbackType } from '../../../shared/domain/types';

import { FeedbackRepository } from '../../../shared/application/ports';
import { RepositoryError } from '../../../shared/domain/errors';

export class FeedbackError extends Error {
    readonly _tag = 'FeedbackError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'FeedbackError';
    }
}

export interface SubmitFeedbackInput {
    userId: string;
    name: string;
    contact: string;
    type: FeedbackType;
    message: string;
    attachment?: string;
}

export const submit = (input: SubmitFeedbackInput): Effect.Effect<Feedback, FeedbackError | RepositoryError, FeedbackRepository> =>
    Effect.gen(function* (_) {
        if (!input.message.trim()) {
            return yield* _(Effect.fail(new FeedbackError('Feedback message is required')));
        }
        const repo = yield* _(FeedbackRepository);
        return yield* _(repo.create(input));
    });

export const getMyFeedback = (userId: string): Effect.Effect<Feedback[], FeedbackError | RepositoryError, FeedbackRepository> =>
    Effect.gen(function* (_) {
        const repo = yield* _(FeedbackRepository);
        return yield* _(repo.listByUser(userId));
    });

export const generateUploadUrl = (): Effect.Effect<string, FeedbackError | RepositoryError, FeedbackRepository> =>
    Effect.gen(function* (_) {
        const repo = yield* _(FeedbackRepository);
        return yield* _(repo.generateUploadUrl());
    });
