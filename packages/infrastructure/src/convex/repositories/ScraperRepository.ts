import type { Id } from '@app/convex';
import type { ScrapingJob, ScrapeJobType, ScrapeJobStatus, ScraperMode, PaginationOpts } from '@app/core';

import { api } from '@app/convex';
import { ScraperRepository, RepositoryError } from '@app/core';
import { ConvexClient } from 'convex/browser';
import { Layer, Effect } from 'effect';



const mapToEntity = (doc: Record<string, unknown>): ScrapingJob => {
    return {
    id: (doc._id as string) || '',
    type: (doc.type as ScrapeJobType) || 'search',
    query: (doc.query as string) || '',
    status: (doc.status as ScrapeJobStatus) || 'pending',
    maxPages: doc.maxPages as number | undefined,
    startPage: doc.startPage as number | undefined,
    scraperMode: doc.scraperMode as ScraperMode | undefined,
    productsFound: doc.productsFound as number | undefined,
    errorMessage: doc.errorMessage as string | undefined,
    createdAt: (doc._creationTime as number) || 0,
    updatedAt: (doc.updatedAt as number) || 0,
};
};


export const createScraperRepositoryLayer = (client: ConvexClient) => Layer.succeed(
    ScraperRepository,
    ScraperRepository.of({

    listJobs: (paginationOpts: PaginationOpts) => Effect.tryPromise({
      try: async () => {
          const result = await client.query(api.admin.getScrapingJobs, { paginationOpts });
return {
    page: result.page.map((doc: Record<string, unknown>) => mapToEntity(doc)),
    isDone: result.isDone,
    continueCursor: result.continueCursor,
};
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    createJob: (input: {
        type: ScrapeJobType;
        query: string;
        maxPages?: number;
        startPage?: number;
        scraperMode?: ScraperMode;
    }) => Effect.tryPromise({
      try: async () => {
          const id = await client.mutation(api.scraper.createJob, {
    type: input.type,
    query: input.query,
    maxPages: input.maxPages,
    startPage: input.startPage,
    scraperMode: input.scraperMode,
});
return {
    id: id as string,
    type: input.type,
    query: input.query,
    status: 'pending' as ScrapeJobStatus,
    maxPages: input.maxPages,
    startPage: input.startPage,
    scraperMode: input.scraperMode,
    createdAt: Date.now(),
    updatedAt: Date.now(),
};
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    getJobById: (id: string) => Effect.tryPromise({
      try: async () => {
          const doc = await client.query(api.scraper.getJob, {
    jobId: id as Id<'scrape_jobs'>,
});
return doc ? mapToEntity(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    })
);

