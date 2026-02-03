import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";
import { ScraperWorker } from "../../src/workers/ScraperWorker";
import type { Queue, ScrapedProduct } from "@app/core";

// Mock dependencies
const mockQuery = mock(() => Promise.resolve([]));
const mockMutation = mock(() => Promise.resolve(undefined));

mock.module("convex/browser", () => ({
    ConvexHttpClient: class {
        query = mockQuery;
        mutation = mockMutation;
    }
}));

// Mock Scrapers to avoid actual scraping
const mockInit = mock(() => Promise.resolve());
const mockClose = mock(() => Promise.resolve());
const mockScrapeProduct = mock(() => Promise.resolve({
    externalId: "123",
    title: "Test Product",
    url: "http://test.com"
} as ScrapedProduct));
const mockScrapeCategory = mock(() => Promise.resolve([{
    externalId: "123",
    title: "Test Product"
}] as ScrapedProduct[]));


mock.module("../../src/scrapers/MyntraAPIScraper", () => ({
    MyntraAPIScraper: class {
        init = mockInit;
        close = mockClose;
        scrapeProduct = mockScrapeProduct;
        scrapeCategory = mockScrapeCategory;
    }
}));
mock.module("../../src/scrapers/MyntraScraper", () => ({
    MyntraScraper: class {
        init = mockInit;
        close = mockClose;
        scrapeProduct = mockScrapeProduct;
        scrapeCategory = mockScrapeCategory;
    }
}));


describe("ScraperWorker", () => {
    let worker: ScraperWorker;
    let mockQueue: Queue<ScrapedProduct>;

    beforeEach(() => {
        mockQueue = {
            push: mock(() => Promise.resolve("id")),
            pushBatch: mock(() => Promise.resolve(["id"])),
            size: mock(() => Promise.resolve(0)),
            isEmpty: mock(() => Promise.resolve(true)),
            clear: mock(() => Promise.resolve())
        } as unknown as Queue<ScrapedProduct>;

        worker = new ScraperWorker({
            convexUrl: "https://test.convex.cloud",
            queue: mockQueue,
            pollIntervalMs: 10 // fast polling for tests
        });

        // Reset mocks
        mockQuery.mockClear();
        mockMutation.mockClear();
    });

    afterEach(async () => {
        await worker.stop();
    });

    test("should initialize successfully", async () => {
        const startPromise = worker.start();

        // Let it run for a tiny bit
        await new Promise(r => setTimeout(r, 20));

        await worker.stop();
        await startPromise;

        expect(mockInit).toHaveBeenCalled();
    });

    test("should poll for jobs", async () => {
        // Mock one job then empty
        mockQuery.mockResolvedValueOnce([{
            _id: "job1",
            type: "single",
            query: "http://test.com/p1",
            status: "pending"
        }] as any);
        mockQuery.mockResolvedValue([]); // Subsequent calls empty

        const startPromise = worker.start();
        await new Promise(r => setTimeout(r, 50));
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
