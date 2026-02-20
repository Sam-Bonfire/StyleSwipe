import { Effect } from 'effect';

import type {
    Feedback,
    FeedbackStatus,
    PaginationOpts,
    PaginatedResult,
} from '../../../shared/domain/types';

import { FeedbackRepository } from '../../../shared/application/ports';
import { RepositoryError } from '../../../shared/domain/errors';

export class AdminFeedbackError extends Error {
    readonly _tag = 'AdminFeedbackError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'AdminFeedbackError';
    }
}

export const list = (
    paginationOpts: PaginationOpts,
): Effect.Effect<PaginatedResult<Feedback>, AdminFeedbackError | RepositoryError, FeedbackRepository> =>
    Effect.gen(function* (_) {
        const repo = yield* _(FeedbackRepository);
        return yield* _(repo.list(paginationOpts));
    });

export const updateStatus = (
    id: string,
    status: FeedbackStatus,
): Effect.Effect<void, AdminFeedbackError | RepositoryError, FeedbackRepository> =>
    Effect.gen(function* (_) {
        const repo = yield* _(FeedbackRepository);
        yield* _(repo.updateStatus(id, status));
    });

export const reply = (
    id: string,
    adminId: string,
    message: string,
): Effect.Effect<void, AdminFeedbackError | RepositoryError, FeedbackRepository> =>
    Effect.gen(function* (_) {
        if (!message.trim()) {
            return yield* _(Effect.fail(new AdminFeedbackError('Reply message is required')));
        }
        const repo = yield* _(FeedbackRepository);
        yield* _(repo.addReply(id, adminId, message));
    });
