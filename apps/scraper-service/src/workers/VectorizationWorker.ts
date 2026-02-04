/**
 * Vectorization Worker - Worker 2
 * Pulls scraped products from queue, generates embeddings, saves to Convex
 * Runs in parallel with ScraperWorker
 */

import type { Queue, ScrapedProduct } from '@app/core';

import { EmbedderAdapter, formatProductForEmbedding } from '@app/infrastructure';
import { ConvexHttpClient } from 'convex/browser';

import { api } from '../../../../convex/_generated/api';

export interface VectorizationWorkerConfig {
  convexUrl: string;
  pollIntervalMs?: number;
  batchSize?: number;
  queue: Queue<ScrapedProduct>;
}

export class VectorizationWorker {
  private client: ConvexHttpClient;
  private embedder: EmbedderAdapter | null = null;
  private queue: Queue<ScrapedProduct>;
  private pollInterval: number;
  private batchSize: number;
  private running = false;

  constructor(config: VectorizationWorkerConfig) {
    this.client = new ConvexHttpClient(config.convexUrl);
    this.queue = config.queue;
    this.pollInterval = config.pollIntervalMs ?? 2000;
    this.batchSize = config.batchSize ?? 10;
  }

  async start(): Promise<void> {
    console.log('[VectorizationWorker] Starting...');

    // Initialize embedder (loads model)
    console.log('[VectorizationWorker] Loading embedding model...');
    try {
      this.embedder = await EmbedderAdapter.getInstance((progress) => {
        if (progress.status === 'progress') {
          const pct = Math.round((progress.loaded / progress.total) * 100);
          console.log(`[VectorizationWorker] Model loading: ${pct}% (${progress.file})`);
        }
      });
      console.log('[VectorizationWorker] Model loaded.');
    } catch (error) {
      console.error(
        '[VectorizationWorker] FATAL: Failed to load model. Worker will spin but not process.',
        error,
      );
      // Don't re-throw, just let the loop run empty or exit
      // this.running = false;
      // Better to stay alive so other components don't crash?
      // Actually, if we rethrow, Promise.all in daemon dies.
      // So we swallow the error and set a flag.
      this.embedder = null;
    }

    this.running = true;

    while (this.running) {
      try {
        await this.processBatch();
      } catch (error) {
        console.error('[VectorizationWorker] Error in processing loop:', error);
      }

      await new Promise((resolve) => setTimeout(resolve, this.pollInterval));
    }
  }

  async stop(): Promise<void> {
    console.log('[VectorizationWorker] Stopping...');
    this.running = false;
  }

  private async processBatch(): Promise<void> {
    // Pull items from queue
    const items = await this.queue.pull(this.batchSize);

    if (items.length === 0) {
      return;
    }

    console.log(`[VectorizationWorker] Processing ${items.length} products`);

    for (const item of items) {
      try {
        await this.processProduct(item.id, item.data);
        await this.queue.complete(item.id);
      } catch (error) {
        console.error(`[VectorizationWorker] Failed to process ${item.id}:`, error);
        await this.queue.fail(item.id, error instanceof Error ? error.message : 'Unknown error');
      }
    }
    console.log(`[VectorizationWorker] Completed batch of ${items.length} products`);
  }

  private async processProduct(_itemId: string, product: ScrapedProduct): Promise<void> {
    if (!this.embedder) {
      throw new Error('Embedder not initialized');
    }

    // Format product text for embedding
    const text = formatProductForEmbedding({
      title: product.title,
      brand: product.brand,
      description: product.description,
      attributes: product.attributes as Record<string, unknown>,
    });

    // Generate embedding
    const embedding = await this.embedder.generateEmbedding(text);
    // Save to Convex
    await this.client.mutation(api.scraper.saveProduct, {
      externalId: product.externalId,
      url: product.url,
      data: product, // This doesn't have embedding yet
      embedding: embedding, // Pass separately
    });
  }
}
