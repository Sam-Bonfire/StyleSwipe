/**
 * Hono API Server for Scraper Service
 * Lightweight REST API for submitting jobs and monitoring status
 */

import type { Id } from '@app/convex';
import type { Doc } from '@app/convex';
import type { QueueService, ScrapedProduct } from '@app/core';

import { api } from '@app/convex';
import { ConvexHttpClient } from 'convex/browser';
import { Effect } from 'effect';
import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';

export interface ServerConfig {
  convexUrl: string;
  port: number;
  queue: QueueService<ScrapedProduct>;
}

export function createServer(config: ServerConfig) {
  const app = new Hono();
  const client = new ConvexHttpClient(config.convexUrl);

  app.use('/*', cors());

  // Health check
  app.get('/api/health', (c: Context) => {
    return c.json({ status: 'ok', timestamp: Date.now() });
  });

  // Create a scrape job
  app.post('/api/jobs', async (c: Context) => {
    try {
      const body = await c.req.json();
      const { type, query, maxPages, startPage, scraperMode } = body;

      if (!type || !query) {
        return c.json({ error: 'type and query are required' }, 400);
      }

      const jobId = await client.mutation(api.scraper.createJob, {
        type,
        query,
        maxPages: maxPages ? Number(maxPages) : undefined,
        startPage: startPage ? Number(startPage) : undefined,
        scraperMode: scraperMode as 'API' | 'BROWSER' | undefined,
      });

      return c.json({ jobId, message: 'Job created successfully' });
    } catch (error) {
      console.error('[API] Error creating job:', error);
      return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  // List jobs
  app.get('/api/jobs', async (c: Context) => {
    try {
      const status = c.req.query('status');
      const limit = parseInt(c.req.query('limit') || '20', 10);

      const jobs = await client.query(api.scraper.getJobsSimple, { limit });

      // Filter by status if provided
      const filteredJobs = status ? jobs.filter((j: Doc<'scrape_jobs'>) => j.status === status) : jobs;

      return c.json({ jobs: filteredJobs });
    } catch (error) {
      console.error('[API] Error fetching jobs:', error);
      return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  // Get single job
  app.get('/api/jobs/:id', async (c: Context) => {
    try {
      const jobId = c.req.param('id');
      const job = await client.query(api.scraper.getJob, { jobId: jobId as Id<'scrape_jobs'> });

      if (!job) {
        return c.json({ error: 'Job not found' }, 404);
      }

      return c.json({ job });
    } catch (error) {
      console.error('[API] Error fetching job:', error);
      return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  // Queue status
  app.get('/api/queue/status', async (c: Context) => {
    try {
      const size = await Effect.runPromise(config.queue.size());
      return c.json({
        queueSize: size,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('[API] Error getting queue status:', error);
      return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  // Get scraped products
  app.get('/api/products', async (c: Context) => {
    try {
      const limit = parseInt(c.req.query('limit') || '50', 10);
      const products = await client.query(api.scraper.getScrapedProducts, { limit });

      return c.json({ products, count: products.length });
    } catch (error) {
      console.error('[API] Error fetching products:', error);
      return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  return app;
}

export async function startServer(config: ServerConfig): Promise<void> {
  const app = createServer(config);

  console.log(`[API] Starting server on port ${config.port}...`);

  const server = Bun.serve({
    port: config.port,
    fetch: app.fetch,
  });

  console.log(`[API] Server running at http://localhost:${config.port}`);

  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('[API] Shutting down server...');
    server.stop();
    process.exit(0);
  });
}
