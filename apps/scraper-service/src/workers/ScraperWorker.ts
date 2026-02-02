/**
 * Scraper Worker - Worker 1
 * Polls for pending scrape jobs, scrapes URLs, pushes products to queue
 * Does NOT generate embeddings - that's VectorizationWorker's job
 */

import type { Queue, ScrapedProduct } from "@app/core";
import { ConvexHttpClient } from "convex/browser";
import { MyntraScraper } from "../scrapers/MyntraScraper";
import { api } from "../../../../convex/_generated/api";
import type { Id, Doc } from "../../../../convex/_generated/dataModel";

export interface ScraperWorkerConfig {
    convexUrl: string;
    pollIntervalMs?: number;
    queue: Queue<ScrapedProduct>;
}

type ScrapeJob = Doc<"scrape_jobs">;

export class ScraperWorker {
    private client: ConvexHttpClient;
    private scraper: MyntraScraper;
    private queue: Queue<ScrapedProduct>;
    private pollInterval: number;
    private running = false;

    constructor(config: ScraperWorkerConfig) {
        this.client = new ConvexHttpClient(config.convexUrl);
        this.scraper = new MyntraScraper();
        this.queue = config.queue;
        this.pollInterval = config.pollIntervalMs ?? 5000;
    }

    async start(): Promise<void> {
        console.log("[ScraperWorker] Starting...");
        await this.scraper.init();
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
        await this.scraper.close();
    }

    private async processNextBatch(): Promise<void> {
        // Fetch pending jobs
        const jobs = await this.client.query(api.scraper.getPendingJobs, {});

        if (jobs.length === 0) {
            return;
        }

        for (const job of jobs) {
            await this.processJob(job as ScrapeJob);
        }
    }

    private async processJob(job: ScrapeJob): Promise<void> {
        console.log(`[ScraperWorker] Processing job ${job._id}: ${job.type} - ${job.query}`);

        // Mark as processing
        await this.client.mutation(api.scraper.updateJobStatus, {
            jobId: job._id as Id<"scrape_jobs">,
            status: "processing",
        });

        try {
            let products: ScrapedProduct[] = [];

            if (job.type === "single") {
                const product = await this.scraper.scrapeProduct(job.query);
                if (product) {
                    products = [product];
                }
            } else if (job.type === "category") {
                // Parse maxPages from query if present (format: "url|maxPages")
                const parts = job.query.split("|");
                const url = parts[0];
                const maxPages = parts[1] ? parseInt(parts[1], 10) : 5;

                products = await this.scraper.scrapeCategory(url, maxPages, (progress) => {
                    console.log(
                        `[ScraperWorker] Category progress: page ${progress.currentPage}/${progress.totalPages}, ${progress.productsScraped} products`
                    );
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
