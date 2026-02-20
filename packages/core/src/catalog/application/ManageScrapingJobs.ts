import { Effect } from 'effect';

import type {
    PaginationOpts,
    PaginatedResult,
    ScrapingJob,
    ScrapeJobType,
    ScraperMode,
} from '../../../shared/domain/types';

import { ScraperRepository } from '../../../shared/application/ports';
import { RepositoryError } from '../../../shared/domain/errors';

export class ScrapingJobError extends Error {
    readonly _tag = 'ScrapingJobError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'ScrapingJobError';
    }
}

export interface CreateJobInput {
    type: ScrapeJobType;
    query: string;
    maxPages?: number;
    startPage?: number;
    scraperMode?: ScraperMode;
}

export const listJobs = (
    paginationOpts: PaginationOpts,
): Effect.Effect<PaginatedResult<ScrapingJob>, ScrapingJobError | RepositoryError, ScraperRepository> =>
    Effect.gen(function* (_) {
        const scraper = yield* _(ScraperRepository);
        return yield* _(scraper.listJobs(paginationOpts));
    });

export const createJob = (
    input: CreateJobInput,
): Effect.Effect<ScrapingJob, ScrapingJobError | RepositoryError, ScraperRepository> =>
    Effect.gen(function* (_) {
        if (!input.query.trim()) {
            return yield* _(Effect.fail(new ScrapingJobError('Query is required')));
        }
        const scraper = yield* _(ScraperRepository);
        return yield* _(scraper.createJob(input));
    });
