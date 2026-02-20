import type { ScraperRepository } from '@app/core';
import type { ScrapingJob, ScrapeJobType, ScrapeJobStatus, ScraperMode, PaginationOpts, PaginatedResult } from '@app/core';

import { api } from '@app/convex';
import { ConvexClient } from 'convex/browser';

export class ConvexScraperRepository implements ScraperRepository {
    constructor(private client: ConvexClient) { }

    async listJobs(paginationOpts: PaginationOpts): Promise<PaginatedResult<ScrapingJob>> {
        const result = await this.client.query(api.admin.getScrapingJobs, { paginationOpts });
        return {
            page: result.page.map((doc: Record<string, unknown>) => this.mapToEntity(doc)),
            isDone: result.isDone,
            continueCursor: result.continueCursor,
        };
    }

    async createJob(input: {
        type: ScrapeJobType;
        query: string;
        maxPages?: number;
        startPage?: number;
        scraperMode?: ScraperMode;
    }): Promise<ScrapingJob> {
        const id = await this.client.mutation(api.scraper.createJob, {
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
    }

    async getJobById(id: string): Promise<ScrapingJob | null> {
         
        const doc = await this.client.query(api.scraper.getJob, {
            jobId: id as any,
        });
        return doc ? this.mapToEntity(doc) : null;
    }

    private mapToEntity(doc: Record<string, unknown>): ScrapingJob {
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
    }
}
