import { MyntraScraper } from './scrapers/MyntraScraper';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const CONVEX_URL = process.env.VITE_CONVEX_URL;

if (!CONVEX_URL) {
    console.error("Missing CONVEX_URL. Make sure .env.local is loaded.");
    process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
    const args = process.argv.slice(2);
    const mode = args[0]; // --url or --job

    if (mode === '--url') {
        const url = args[1];
        if (!url) {
            console.error("Usage: bun run scrape --url <url>");
            process.exit(1);
        }

        console.log(`Starting scrape for ${url}...`);
        const scraper = new MyntraScraper();
        await scraper.init();

        const product = await scraper.scrapeProduct(url);

        if (product) {
            console.log("Scraped successfully:", product.title);
            // Save to Convex
            // @ts-ignore
            await client.mutation(api.scraper.saveProduct, {
                myntraId: product.myntraId,
                url: product.url,
                data: product
            });
            console.log("Saved to Database!");
        }

        await scraper.close();
        await scraper.close();
    } else if (mode === '--worker') {
        console.log("Starting Scraper Worker...");
        const scraper = new MyntraScraper();
        await scraper.init();

        while (true) {
            // Poll for jobs
            // @ts-ignore
            const jobs = await client.query(api.scraper.getPendingJobs);

            if (jobs.length === 0) {
                // Wait 5 seconds before next poll
                await new Promise(r => setTimeout(r, 5000));
                continue;
            }

            for (const job of jobs) {
                console.log(`Processing Job ${job._id}: ${job.query}`);

                // @ts-ignore
                await client.mutation(api.scraper.updateJobStatus, { jobId: job._id, status: 'processing' });

                try {
                    let success = false;
                    if (job.type === 'single') {
                        const product = await scraper.scrapeProduct(job.query);
                        if (product) {
                            // @ts-ignore
                            await client.mutation(api.scraper.saveProduct, {
                                myntraId: product.myntraId,
                                url: product.url,
                                data: product
                            });
                            success = true;
                        }
                    }
                    // Add category logic here later

                    // @ts-ignore
                    await client.mutation(api.scraper.updateJobStatus, {
                        jobId: job._id,
                        status: success ? 'completed' : 'failed',
                        productsFound: success ? 1 : 0
                    });

                } catch (e: any) {
                    console.error(`Job ${job._id} failed:`, e);
                    // @ts-ignore
                    await client.mutation(api.scraper.updateJobStatus, {
                        jobId: job._id,
                        status: 'failed',
                        errorMessage: e.message
                    });
                }
            }
        }
    } else {
        console.log("Unknown command. Use --url <link> or --worker");
    }
}

main().catch(console.error);
