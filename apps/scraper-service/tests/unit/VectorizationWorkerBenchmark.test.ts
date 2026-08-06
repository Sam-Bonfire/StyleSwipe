import { describe, it, expect, mock } from "bun:test";
import { VectorizationWorker } from "../../src/workers/VectorizationWorker";
import { Effect } from "effect";

describe("VectorizationWorker Benchmark", () => {
  it("should process items much faster with Promise.all", async () => {
    const queue = {
      pull: mock().mockReturnValue(Effect.succeed([])),
      complete: mock().mockImplementation((id) => Effect.succeed(undefined)),
      fail: mock().mockImplementation((id, err) => Effect.succeed(undefined)),
      push: mock().mockReturnValue(Effect.succeed(undefined)),
      pushBatch: mock().mockReturnValue(Effect.succeed(undefined)),
      size: mock().mockReturnValue(Effect.succeed(0)),
    };

    const worker = new VectorizationWorker({
      convexUrl: "http://localhost:3210",
      queue,
    });

    // Mock the dependencies to simulate async work
    worker["embedder"] = {
      generateEmbedding: mock().mockImplementation(() => Effect.promise(() => new Promise(r => setTimeout(() => r([0.1, 0.2]), 10))))
    } as any;

    worker["client"] = {
      mutation: mock().mockImplementation(() => new Promise(r => setTimeout(r, 10)))
    } as any;

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
