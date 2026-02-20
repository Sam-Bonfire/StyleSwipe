import { ManageScrapingJobs, CreateJobInput } from '@app/core';
import { ConvexClient } from 'convex/browser';
/**
 * Scraper admin hooks
 */
import { useConvex } from 'convex/react';
import { Effect } from 'effect';

import { ConvexScraperRepository } from '../../convex/repositories';

/**
 * Write — create a new scraping job.
 */
export function useCreateScrapingJob() {
    const convex = useConvex();
    const repo = new ConvexScraperRepository(convex as unknown as ConvexClient);
    const useCase = new ManageScrapingJobs(repo);
    return (input: CreateJobInput) => Effect.runPromise(useCase.create(input));
}
