import { Effect } from 'effect';

import type { FeedbackRepository } from '../../../shared/domain/ports';
import type {
    Feedback,
    FeedbackStatus,
    PaginationOpts,
    PaginatedResult,
} from '../../../shared/domain/types';

// -----------------------------------------------------------------------------
// TAGGED ERRORS
// -----------------------------------------------------------------------------

export class AdminFeedbackError extends Error {
    readonly _tag = 'AdminFeedbackError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'AdminFeedbackError';
    }
}

// -----------------------------------------------------------------------------
// USE CASE: Manage Admin Feedback
// -----------------------------------------------------------------------------

/**
 * Admin-side feedback management:
 * List all feedback, update status, and reply to users.
 */
export class ManageAdminFeedback {
    constructor(private readonly repo: FeedbackRepository) { }

    list(
        paginationOpts: PaginationOpts,
    ): Effect.Effect<PaginatedResult<Feedback>, AdminFeedbackError> {
        return Effect.tryPromise({
            try: () => this.repo.list(paginationOpts),
            catch: () => new AdminFeedbackError('Failed to list feedback'),
        });
    }

    updateStatus(
        id: string,
        status: FeedbackStatus,
    ): Effect.Effect<void, AdminFeedbackError> {
        return Effect.tryPromise({
            try: () => this.repo.updateStatus(id, status),
            catch: () => new AdminFeedbackError('Failed to update feedback status'),
        });
    }

    reply(
        id: string,
        adminId: string,
        message: string,
    ): Effect.Effect<void, AdminFeedbackError> {
        return Effect.gen(this, function* (_) {
            if (!message.trim()) {
                return yield* _(Effect.fail(new AdminFeedbackError('Reply message is required')));
            }

            yield* _(
                Effect.tryPromise({
                    try: () => this.repo.addReply(id, adminId, message),
                    catch: () => new AdminFeedbackError('Failed to reply to feedback'),
                }),
            );
        });
    }
}
