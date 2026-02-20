import { Effect } from 'effect';

import type { ScraperRepository } from '../../../shared/domain/ports';
import type {
    PaginationOpts,
    PaginatedResult,
    ScrapingJob,
    ScrapeJobType,
    ScraperMode,
} from '../../../shared/domain/types';

// -----------------------------------------------------------------------------
// TAGGED ERRORS
// -----------------------------------------------------------------------------

export class ScrapingJobError extends Error {
    readonly _tag = 'ScrapingJobError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'ScrapingJobError';
    }
}

// -----------------------------------------------------------------------------
// USE CASE: Manage Scraping Jobs
// -----------------------------------------------------------------------------

export interface CreateJobInput {
    type: ScrapeJobType;
    query: string;
    maxPages?: number;
    startPage?: number;
    scraperMode?: ScraperMode;
}

/**
 * Admin operations for managing scraping jobs.
 */
export class ManageScrapingJobs {
    constructor(private readonly scraper: ScraperRepository) { }

    list(
        paginationOpts: PaginationOpts,
    ): Effect.Effect<PaginatedResult<ScrapingJob>, ScrapingJobError> {
        return Effect.tryPromise({
            try: () => this.scraper.listJobs(paginationOpts),
            catch: () => new ScrapingJobError('Failed to list scraping jobs'),
        });
    }

    create(
        input: CreateJobInput,
    ): Effect.Effect<ScrapingJob, ScrapingJobError> {
        return Effect.gen(this, function* (_) {
            if (!input.query.trim()) {
                return yield* _(Effect.fail(new ScrapingJobError('Query is required')));
            }

            return yield* _(
                Effect.tryPromise({
                    try: () => this.scraper.createJob(input),
                    catch: () => new ScrapingJobError('Failed to create scraping job'),
                }),
            );
        });
    }
}
