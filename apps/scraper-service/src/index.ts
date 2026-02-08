/**
 * Scraper Service - Main Entry Point
 * Supports multiple modes: scrape, category, worker, server, daemon
 */

import type { ScrapedProduct } from '@app/core';

import { createQueue, type QueueType } from '@app/infrastructure';
import { ConvexHttpClient } from 'convex/browser';

import { api } from '@app/convex';
import { MyntraScraper } from './scrapers/MyntraScraper';
import { startServer } from './server';
import { ScraperWorker, VectorizationWorker } from './workers';

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONVEX_URL = process.env.VITE_CONVEX_URL;
const API_PORT = parseInt(process.env.SCRAPER_API_PORT || '3001', 10);

if (!CONVEX_URL) {
  console.error('Missing CONVEX_URL. Set VITE_CONVEX_URL in environment.');
  process.exit(1);
}

// =============================================================================
// CLI ARGUMENT PARSING
// =============================================================================

interface CliArgs {
  mode: 'scrape' | 'category' | 'worker' | 'server' | 'daemon' | 'help';
  url?: string;
  pages?: number;
  queueType: QueueType;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    return { mode: 'help', queueType: 'memory' };
  }

  const mode = args[0].replace(/^--/, '') as CliArgs['mode'];
  let url: string | undefined;
  let pages = 5;
  let queueType: QueueType = 'memory';

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--pages' && args[i + 1]) {
      pages = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--queue' && args[i + 1]) {
      queueType = args[i + 1] as QueueType;
      i++;
    } else if (!arg.startsWith('--')) {
      url = arg;
    }
  }

  return { mode, url, pages, queueType };
}

function printHelp(): void {
  console.log(`
Scraper Service - StyleSwipe

USAGE:
  bun run src/index.ts <mode> [options]

MODES:
  --scrape <url>              Scrape a single product URL
  --category <url> [--pages N] Scrape a category with pagination (default: 5 pages)
  --worker                    Start scraper + vectorization workers
  --server                    Start Hono API server only
  --daemon                    Start server + workers (default production mode)

OPTIONS:
  --pages <N>                 Number of pages for category scraping (default: 5)
  --queue <memory|convex>     Queue backend (default: memory)
  --help                      Show this help

EXAMPLES:
  bun run src/index.ts --scrape https://www.myntra.com/shirts/roadster/12345
  bun run src/index.ts --category https://www.myntra.com/men-casual-shirts --pages 3
  bun run src/index.ts --daemon --queue convex

ENVIRONMENT:
  VITE_CONVEX_URL            Convex deployment URL (required)
  SCRAPER_API_PORT           API server port (default: 3001)
`);
}

// =============================================================================
// MODE HANDLERS
// =============================================================================

async function runScrape(url: string): Promise<void> {
  console.log(`[CLI] Scraping single product: ${url}`);

  const scraper = new MyntraScraper();
  await scraper.init();

  const product = await scraper.scrapeProduct(url);

  if (product) {
    console.log(`[CLI] Scraped: ${product.brand} - ${product.title}`);
    console.log(`[CLI] Price: ₹${product.price} (MRP: ₹${product.mrp})`);
    console.log(`[CLI] Images: ${product.images.length}`);

    // Save directly to Convex using service endpoint
    const client = new ConvexHttpClient(CONVEX_URL!);
    await client.mutation(api.scraper.serviceSaveProduct, {
      externalId: product.externalId,
      url: product.url,
      data: product as any,
    });
    console.log(`[CLI] Saved to database!`);
  } else {
    console.error(`[CLI] Failed to scrape product`);
  }

  await scraper.close();
}

async function runCategory(url: string, maxPages: number): Promise<void> {
  console.log(`[CLI] Scraping category: ${url} (${maxPages} pages)`);

  const scraper = new MyntraScraper();
  await scraper.init();

  const products = await scraper.scrapeCategory(url, maxPages, 1, (progress) => {
    console.log(
      `[CLI] Progress: Page ${progress.currentPage}/${progress.totalPages} - ${progress.productsScraped} products`,
    );
  });

  console.log(`[CLI] Found ${products.length} products`);

  // Save all to Convex using service endpoint
  const client = new ConvexHttpClient(CONVEX_URL!);
  for (const product of products) {
    await client.mutation(api.scraper.serviceSaveProduct, {
      externalId: product.externalId,
      url: product.url,
      data: product as any,
    });
  }
  console.log(`[CLI] Saved ${products.length} products to database!`);

  await scraper.close();
}

async function runWorkers(queueType: QueueType): Promise<void> {
  console.log(`[CLI] Starting workers with ${queueType} queue...`);

  const queue = createQueue<ScrapedProduct>({
    type: queueType,
    convexUrl: CONVEX_URL,
  });

  const scraperWorker = new ScraperWorker({
    convexUrl: CONVEX_URL!,
    queue,
  });

  const vectorWorker = new VectorizationWorker({
    convexUrl: CONVEX_URL!,
    queue,
  });

  // Run both workers in parallel
  await Promise.all([scraperWorker.start(), vectorWorker.start()]);
}

async function runServer(queueType: QueueType): Promise<void> {
  console.log(`[CLI] Starting API server on port ${API_PORT}...`);

  const queue = createQueue<ScrapedProduct>({
    type: queueType,
    convexUrl: CONVEX_URL,
  });

  await startServer({
    convexUrl: CONVEX_URL!,
    port: API_PORT,
    queue,
  });
}

async function runDaemon(queueType: QueueType): Promise<void> {
  console.log(`[CLI] Starting daemon mode (server + workers)...`);

  const queue = createQueue<ScrapedProduct>({
    type: queueType,
    convexUrl: CONVEX_URL,
  });

  // Start server
  const serverPromise = startServer({
    convexUrl: CONVEX_URL!,
    port: API_PORT,
    queue,
  });

  // Start workers
  const scraperWorker = new ScraperWorker({
    convexUrl: CONVEX_URL!,
    queue,
  });

  const vectorWorker = new VectorizationWorker({
    convexUrl: CONVEX_URL!,
    queue,
  });

  // Run all in parallel
  await Promise.all([serverPromise, scraperWorker.start(), vectorWorker.start()]);
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  const args = parseArgs();

  switch (args.mode) {
    case 'help':
      printHelp();
      break;

    case 'scrape':
      if (!args.url) {
        console.error('Error: --scrape requires a URL');
        printHelp();
        process.exit(1);
      }
      await runScrape(args.url);
      break;

    case 'category':
      if (!args.url) {
        console.error('Error: --category requires a URL');
        printHelp();
        process.exit(1);
      }
      await runCategory(args.url, args.pages || 5);
      break;

    case 'worker':
      await runWorkers(args.queueType);
      break;

    case 'server':
      await runServer(args.queueType);
      break;

    case 'daemon':
      await runDaemon(args.queueType);
      break;

    default:
      console.error(`Unknown mode: ${args.mode}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
