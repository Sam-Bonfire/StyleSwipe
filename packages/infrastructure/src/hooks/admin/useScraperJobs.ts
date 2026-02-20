import type { ScrapeJobType, ScraperMode } from '@app/core';

import { ManageScrapingJobs } from '@app/core';
import { ConvexClient } from 'convex/browser';
/**
 * Scraper admin hooks
 */
import { useConvex } from 'convex/react';
import { Effect } from 'effect';

import { createScraperRepositoryLayer } from '../../convex';

/**
 * Write — create a new scraping job.
 */
export function useCreateScrapingJob() {
    const convex = useConvex();
    return (input: { type: ScrapeJobType; query: string; maxPages?: number; startPage?: number; scraperMode?: ScraperMode; }) => {
        const program = ManageScrapingJobs.createJob(input);
        const layer = createScraperRepositoryLayer(convex as unknown as ConvexClient);
        return Effect.runPromise(program.pipe(Effect.provide(layer)));
    }
}
