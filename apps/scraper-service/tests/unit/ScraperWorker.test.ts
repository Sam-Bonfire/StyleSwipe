import type { QueueService, ScrapedProduct } from '@app/core';

import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { Effect } from 'effect';

import { ScraperWorker } from '../../src/workers/ScraperWorker';

// Mock dependencies
const mockQuery = mock(() => Promise.resolve([]));
const mockMutation = mock(() => Promise.resolve(undefined));

mock.module('convex/browser', () => ({
  ConvexHttpClient: class {
    query = mockQuery;
    mutation = mockMutation;
  },
}));

// Mock Scrapers to avoid actual scraping
const mockInit = mock(() => Promise.resolve());
const mockClose = mock(() => Promise.resolve());
const mockScrapeProduct = mock(() =>
  Promise.resolve({
    externalId: '123',
    title: 'Test Product',
    url: 'http://test.com',
  } as ScrapedProduct),
);
const mockScrapeCategory = mock(() =>
  Promise.resolve([
    {
      externalId: '123',
      title: 'Test Product',
    },
  ] as ScrapedProduct[]),
);

mock.module('../../src/scrapers/MyntraAPIScraper', () => ({
  MyntraAPIScraper: class {
    init = mockInit;
    close = mockClose;
    scrapeProduct = mockScrapeProduct;
    scrapeCategory = mockScrapeCategory;
  },
}));
mock.module('../../src/scrapers/MyntraScraper', () => ({
  MyntraScraper: class {
    init = mockInit;
    close = mockClose;
    scrapeProduct = mockScrapeProduct;
    scrapeCategory = mockScrapeCategory;
  },
}));

describe('ScraperWorker', () => {
  let worker: ScraperWorker;
  let mockQueue: QueueService<ScrapedProduct>;

  beforeEach(() => {
    mockQueue = {
      push: mock(() => Effect.succeed('id')),
      pushBatch: mock(() => Effect.succeed(['id'])),
      pull: mock(() => Effect.succeed([])),
      complete: mock(() => Effect.succeed(undefined)),
      fail: mock(() => Effect.succeed(undefined)),
      size: mock(() => Effect.succeed(0)),
    } as unknown as QueueService<ScrapedProduct>;

    worker = new ScraperWorker({
      convexUrl: 'https://test.convex.cloud',
      queue: mockQueue,
      pollIntervalMs: 10, // fast polling for tests
    });

    // Reset mocks
    mockQuery.mockClear();
    mockMutation.mockClear();
  });

  afterEach(async () => {
    await worker.stop();
  });

  test('should initialize successfully', async () => {
    const startPromise = worker.start();

    // Let it run for a tiny bit
    await new Promise((r) => setTimeout(r, 20));

    await worker.stop();
    await startPromise;

    expect(mockInit).toHaveBeenCalled();
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
    expect(mockScrapeProduct).toHaveBeenCalled();
    // Should have pushed to queue
    expect(mockQueue.pushBatch).toHaveBeenCalled();
    // Should have updated status
    expect(mockMutation).toHaveBeenCalled();
  });
});
