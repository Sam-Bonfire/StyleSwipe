import type { QueueService, ScrapedProduct } from '@app/core';

import { Effect } from 'effect';
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';

import { ScraperWorker } from '../../src/workers/ScraperWorker';

// Mock dependencies
const mockQuery = vi.fn(() => Promise.resolve([]));
const mockMutation = vi.fn(() => Promise.resolve(undefined));

vi.mock('convex/browser', () => ({
  ConvexHttpClient: class {
    query = mockQuery;
    mutation = mockMutation;
  },
}));

import { MyntraAPIScraper } from '../../src/scrapers/MyntraAPIScraper';
import { MyntraScraper } from '../../src/scrapers/MyntraScraper';

// Mock Scrapers using vi.spyOn later to avoid actual scraping without leaking across files
const mockScrapeProductResponse = {
  externalId: '123',
  title: 'Test Product',
  url: 'http://test.com',
} as ScrapedProduct;

const mockScrapeCategoryResponse = [
  {
    externalId: '123',
    title: 'Test Product',
  },
] as ScrapedProduct[];

describe('ScraperWorker', () => {
  let worker: ScraperWorker;
  let mockQueue: QueueService<ScrapedProduct>;

  beforeEach(() => {
    mockQueue = {
      push: vi.fn(() => Effect.succeed('id')),
      pushBatch: vi.fn(() => Effect.succeed(['id'])),
      pull: vi.fn(() => Effect.succeed([])),
      complete: vi.fn(() => Effect.succeed(undefined)),
      fail: vi.fn(() => Effect.succeed(undefined)),
      size: vi.fn(() => Effect.succeed(0)),
    } as unknown as QueueService<ScrapedProduct>;

    worker = new ScraperWorker({
      convexUrl: 'https://test.convex.cloud',
      queue: mockQueue,
      pollIntervalMs: 10, // fast polling for tests
    });

    // Reset mocks
    mockQuery.mockClear();
    mockMutation.mockClear();

    vi.spyOn(MyntraAPIScraper.prototype, 'init').mockImplementation(() => Promise.resolve());
    vi.spyOn(MyntraAPIScraper.prototype, 'close').mockImplementation(() => Promise.resolve());
    vi.spyOn(MyntraAPIScraper.prototype, 'scrapeProduct').mockImplementation(() => Promise.resolve(mockScrapeProductResponse));
    vi.spyOn(MyntraAPIScraper.prototype, 'scrapeCategory').mockImplementation(() => Promise.resolve(mockScrapeCategoryResponse));

    vi.spyOn(MyntraScraper.prototype, 'init').mockImplementation(() => Promise.resolve());
    vi.spyOn(MyntraScraper.prototype, 'close').mockImplementation(() => Promise.resolve());
    vi.spyOn(MyntraScraper.prototype, 'scrapeProduct').mockImplementation(() => Promise.resolve(mockScrapeProductResponse));
    vi.spyOn(MyntraScraper.prototype, 'scrapeCategory').mockImplementation(() => Promise.resolve(mockScrapeCategoryResponse));
  });

  afterEach(async () => {
    await worker.stop();
    vi.restoreAllMocks();
  });

  test('should initialize successfully', async () => {
    const startPromise = worker.start();

    // Let it run for a tiny bit
    await new Promise((r) => setTimeout(r, 20));

    await worker.stop();
    await startPromise;

    expect(MyntraAPIScraper.prototype.init).toHaveBeenCalled();
  });

  test('should poll for jobs', async () => {
    // Mock one job then empty
    mockQuery.mockResolvedValueOnce([
      {
        _id: 'job1',
        type: 'single',
        query: 'http://test.com/p1',
        status: 'pending',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);
    mockQuery.mockResolvedValue([]); // Subsequent calls empty

    const startPromise = worker.start();
    await new Promise((r) => setTimeout(r, 50));
    await worker.stop();
    await startPromise;

    expect(mockQuery).toHaveBeenCalled();
    // Should have scraped
    expect(MyntraAPIScraper.prototype.scrapeProduct).toHaveBeenCalled();
    // Should have pushed to queue
    expect(mockQueue.pushBatch).toHaveBeenCalled();
    // Should have updated status
    expect(mockMutation).toHaveBeenCalled();
  });
});
