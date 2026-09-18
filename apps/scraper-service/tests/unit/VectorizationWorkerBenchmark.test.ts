import type { Embedder } from "@app/core";
import type { ConvexHttpClient } from "convex/browser";
import type { Context } from "effect";

import { Effect } from "effect";
import { describe, expect, it, vi } from 'vitest';

import { VectorizationWorker } from "../../src/workers/VectorizationWorker";

describe("VectorizationWorker Benchmark", () => {
  it("should process items much faster with Promise.all", async () => {
    const queue = {
      pull: vi.fn().mockReturnValue(Effect.succeed([])),
      complete: vi.fn().mockImplementation(() => Effect.succeed(undefined)),
      fail: vi.fn().mockImplementation(() => Effect.succeed(undefined)),
      push: vi.fn().mockReturnValue(Effect.succeed(undefined)),
      pushBatch: vi.fn().mockReturnValue(Effect.succeed(undefined)),
      size: vi.fn().mockReturnValue(Effect.succeed(0)),
    };

    const worker = new VectorizationWorker({
      convexUrl: "http://localhost:3210",
      queue,
    });

    // Mock the dependencies to simulate async work
    worker["embedder"] = {
      generateEmbedding: vi.fn().mockImplementation(() => Effect.promise(() => new Promise(r => setTimeout(() => r([0.1, 0.2]), 10))))
    } as unknown as Context.Tag.Service<Embedder>;

    worker["client"] = {
      mutation: vi.fn().mockImplementation(() => new Promise(r => setTimeout(r, 10)))
    } as unknown as ConvexHttpClient;

    const items = Array.from({ length: 50 }).map((_, i) => ({
      id: `item-${i}`,
      data: {
        title: `Product ${i}`,
        brand: `Brand ${i}`,
        description: `Description ${i}`,
        attributes: {},
        externalId: `ext-${i}`,
        url: `http://example.com/${i}`
      }
    }));

    // Override the processBatch items
    queue.pull.mockReturnValueOnce(Effect.succeed(items));

    const start = performance.now();
    await worker["processBatch"]();
    const end = performance.now();

    console.log(`Processed 50 items in ${end - start}ms`);
    // Before optimization, 50 items * (10ms + 10ms) = ~1000ms
    // After optimization, should be ~20-50ms
    expect(end - start).toBeLessThan(200); // Baseline is ~1000ms, optimization < 200ms
  });
});
