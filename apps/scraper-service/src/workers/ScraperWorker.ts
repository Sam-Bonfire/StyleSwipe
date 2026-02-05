/**
 * Scraper Worker - Worker 1
 * Polls for pending scrape jobs, scrapes URLs, pushes products to queue
 * Does NOT generate embeddings - that's VectorizationWorker's job
 */

import type { Queue, ScrapedProduct } from "@app/core";
import { ConvexHttpClient } from "convex/browser";
import { MyntraScraper } from "../scrapers/MyntraScraper";
import { MyntraAPIScraper } from "../scrapers/MyntraAPIScraper";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export interface ScraperWorkerConfig {
    convexUrl: string;
    pollIntervalMs?: number;
    queue: Queue<ScrapedProduct>;
}



export class ScraperWorker {
    private client: ConvexHttpClient;
    private apiScraper: MyntraAPIScraper;
    private browserScraper: MyntraScraper;
    private queue: Queue<ScrapedProduct>;
    private pollInterval: number;
    private running = false;
    private browserInitialized = false;

    constructor(config: ScraperWorkerConfig) {
        this.client = new ConvexHttpClient(config.convexUrl);
        this.apiScraper = new MyntraAPIScraper();
        this.browserScraper = new MyntraScraper();
        this.queue = config.queue;
        this.pollInterval = config.pollIntervalMs ?? 5000;
    }

    async start(): Promise<void> {
        console.log("[ScraperWorker] Starting...");
        await this.apiScraper.init();

        // Pre-init browser if env mode is BROWSER, otherwise lazy init
        if (process.env.SCRAPER_MODE?.toUpperCase() === "BROWSER") {
            await this.browserScraper.init();
            this.browserInitialized = true;
        }

        this.running = true;

        while (this.running) {
            try {
                await this.processNextBatch();
            } catch (error) {
                console.error("[ScraperWorker] Error in processing loop:", error);
            }

            await new Promise((resolve) => setTimeout(resolve, this.pollInterval));
        }
    }

    async stop(): Promise<void> {
        console.log("[ScraperWorker] Stopping...");
        this.running = false;
        await this.apiScraper.close();
        if (this.browserInitialized) {
            await this.browserScraper.close();
        }
    }

    private async processNextBatch(): Promise<void> {
        // Fetch pending jobs
        const jobs = await this.client.query(api.scraper.getPendingJobs, {});

        if (jobs.length === 0) {
            return;
        }

        for (const job of jobs) {
            await this.processJob(job as any);
        }
    }

    private async processJob(job: any): Promise<void> {
        console.log(`[ScraperWorker] Processing job ${job._id}: ${job.type} - ${job.query}`);

        // Mark as processing
        await this.client.mutation(api.scraper.updateJobStatus, {
            jobId: job._id as Id<"scrape_jobs">,
            status: "processing",
        });

        try {
            let products: ScrapedProduct[] = [];

            // Determine scraper to use
            const useBrowser = (job.scraperMode === "BROWSER") ||
                (!job.scraperMode && process.env.SCRAPER_MODE?.toUpperCase() === "BROWSER");

            let scraper: MyntraAPIScraper | MyntraScraper;

            if (useBrowser) {
                if (!this.browserInitialized) {
                    console.log("[ScraperWorker] lazily initializing browser scraper...");
                    await this.browserScraper.init();
                    this.browserInitialized = true;
                }
                scraper = this.browserScraper;
            } else {
                scraper = this.apiScraper;
            }

            if (job.type === "single") {
                const product = await scraper.scrapeProduct(job.query);
                if (product) {
                    products = [product];
                }
            } else if (job.type === "category") {
                const url = job.query;
                const maxPages = job.maxPages || 5;
                const startPage = job.startPage || 1;

                products = await scraper.scrapeCategory(url, maxPages, startPage, async (progress) => {
                    console.log(
                        `[ScraperWorker] Category progress: Page ${progress.currentPage}/${progress.totalPages} - Found ${progress.productsFoundOnPage} products on page (Total: ${progress.productsScraped})`
                    );

                    // Update job progress via mutation
                    await this.client.mutation(api.scraper.updateJobStatus, {
                        jobId: job._id as Id<"scrape_jobs">,
                        status: "processing",
                        productsFound: progress.productsScraped,
                    });
                });
            }

            // Push products to queue for vectorization
            if (products.length > 0) {
                console.log(`[ScraperWorker] Pushing ${products.length} products to queue`);
                await this.queue.pushBatch(products);

                await this.client.mutation(api.scraper.updateJobStatus, {
                    jobId: job._id as Id<"scrape_jobs">,
                    status: "completed",
                    productsFound: products.length,
                });
            } else {
                await this.client.mutation(api.scraper.updateJobStatus, {
                    jobId: job._id as Id<"scrape_jobs">,
                    status: "failed",
                    errorMessage: "No products found",
                });
            }
        } catch (error) {
            console.error(`[ScraperWorker] Job ${job._id} failed:`, error);
            await this.client.mutation(api.scraper.updateJobStatus, {
                jobId: job._id as Id<"scrape_jobs">,
                status: "failed",
                errorMessage: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
}
