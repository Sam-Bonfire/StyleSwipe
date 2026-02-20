import { Effect } from 'effect';

import type { LogRepository } from '../../../shared/domain/ports';
import type { LogEntry, PaginationOpts, PaginatedResult } from '../../../shared/domain/types';

// -----------------------------------------------------------------------------
// TAGGED ERRORS
// -----------------------------------------------------------------------------

export class LogViewError extends Error {
    readonly _tag = 'LogViewError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'LogViewError';
    }
}

// -----------------------------------------------------------------------------
// USE CASE: Manage Logs
// -----------------------------------------------------------------------------

/**
 * Admin use case for viewing logs.
 */
export class ManageLogs {
    constructor(private readonly logs: LogRepository) { }

    list(
        paginationOpts: PaginationOpts,
    ): Effect.Effect<PaginatedResult<LogEntry>, LogViewError> {
        return Effect.tryPromise({
            try: () => this.logs.list(paginationOpts),
            catch: () => new LogViewError('Failed to fetch logs'),
        });
    }
}
