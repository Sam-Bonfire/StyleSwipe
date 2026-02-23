import { Effect } from 'effect';

import type { LogEntry, PaginationOpts, PaginatedResult } from '../../../shared/domain/types';

import { LogRepository } from '../../../shared/application/ports';
import { RepositoryError } from '../../../shared/domain/errors';

export class LogViewError extends Error {
    readonly _tag = 'LogViewError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'LogViewError';
    }
}

export const list = (
    paginationOpts: PaginationOpts,
): Effect.Effect<PaginatedResult<LogEntry>, LogViewError | RepositoryError, LogRepository> =>
    Effect.gen(function* (_) {
        const logs = yield* _(LogRepository);
        return yield* _(logs.list(paginationOpts));
    });
