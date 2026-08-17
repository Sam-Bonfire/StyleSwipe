import { Effect } from 'effect';
import { describe, expect, it, beforeEach,  } from 'vitest';

import { InMemoryQueueAdapter, createQueue } from '../../../src/queue/QueueAdapter';

describe('InMemoryQueueAdapter', () => {
    let queue: InMemoryQueueAdapter<{ url: string }>;

    beforeEach(() => {
        queue = new InMemoryQueueAdapter<{ url: string }>();
    });

    describe('push', () => {
        it('should return a unique ID', async () => {
            const id = await Effect.runPromise(queue.push({ url: 'http://a.com' }));
            expect(typeof id).toBe('string');
            expect(id.startsWith('mem-')).toBe(true);
        });

        it('should increment size', async () => {
            await Effect.runPromise(queue.push({ url: 'http://a.com' }));
            await Effect.runPromise(queue.push({ url: 'http://b.com' }));
            const size = await Effect.runPromise(queue.size());
            expect(size).toBe(2);
        });
    });

    describe('pushBatch', () => {
        it('should push multiple items and return IDs', async () => {
            const ids = await Effect.runPromise(queue.pushBatch([
                { url: 'http://a.com' },
                { url: 'http://b.com' },
                { url: 'http://c.com' },
            ]));
            expect(ids).toHaveLength(3);
            const size = await Effect.runPromise(queue.size());
            expect(size).toBe(3);
        });

        it('should return unique IDs for each item', async () => {
            const ids = await Effect.runPromise(queue.pushBatch([
                { url: 'http://a.com' },
                { url: 'http://b.com' },
            ]));
            expect(new Set(ids).size).toBe(2);
        });
    });

    describe('pull', () => {
        it('should return pending items', async () => {
            await Effect.runPromise(queue.push({ url: 'http://a.com' }));
            await Effect.runPromise(queue.push({ url: 'http://b.com' }));

            const items = await Effect.runPromise(queue.pull(10));
            expect(items).toHaveLength(2);
            expect(items[0].data.url).toBe('http://a.com');
        });

        it('should respect batchSize limit', async () => {
            await Effect.runPromise(queue.pushBatch([
                { url: 'http://a.com' },
                { url: 'http://b.com' },
                { url: 'http://c.com' },
            ]));

            const items = await Effect.runPromise(queue.pull(2));
            expect(items).toHaveLength(2);
        });

        it('should mark pulled items as processing', async () => {
            await Effect.runPromise(queue.push({ url: 'http://a.com' }));
            await Effect.runPromise(queue.pull(10));

            // Size only counts pending items, processing items are excluded
            const size = await Effect.runPromise(queue.size());
            expect(size).toBe(0);
        });

        it('should not return already-processing items', async () => {
            await Effect.runPromise(queue.push({ url: 'http://a.com' }));
            await Effect.runPromise(queue.pull(10));

            const secondPull = await Effect.runPromise(queue.pull(10));
            expect(secondPull).toHaveLength(0);
        });
    });

    describe('complete', () => {
        it('should remove completed items', async () => {
            const id = await Effect.runPromise(queue.push({ url: 'http://a.com' }));
            await Effect.runPromise(queue.complete(id));

            const all = queue.getAll();
            expect(all).toHaveLength(0);
        });
    });

    describe('fail', () => {
        it('should re-queue failed items as pending', async () => {
            await Effect.runPromise(queue.push({ url: 'http://a.com' }));
            const [item] = await Effect.runPromise(queue.pull(1));
            await Effect.runPromise(queue.fail(item.id));

            // Item should be back to pending
            const size = await Effect.runPromise(queue.size());
            expect(size).toBe(1);
        });

        it('should increment retry count', async () => {
            await Effect.runPromise(queue.push({ url: 'http://a.com' }));
            const [item] = await Effect.runPromise(queue.pull(1));
            await Effect.runPromise(queue.fail(item.id));

            const all = queue.getAll();
            expect(all[0].retries).toBe(1);
        });

        it('should remove item after 3 retries', async () => {
            await Effect.runPromise(queue.push({ url: 'http://a.com' }));

            for (let i = 0; i < 3; i++) {
                const pulled = await Effect.runPromise(queue.pull(1));
                if (pulled.length > 0) {
                    await Effect.runPromise(queue.fail(pulled[0].id, `attempt ${i + 1}`));
                }
            }

            const all = queue.getAll();
            expect(all).toHaveLength(0);
        });
    });

    describe('size', () => {
        it('should return 0 for empty queue', async () => {
            const size = await Effect.runPromise(queue.size());
            expect(size).toBe(0);
        });

        it('should only count pending items', async () => {
            await Effect.runPromise(queue.pushBatch([
                { url: 'http://a.com' },
                { url: 'http://b.com' },
            ]));
            await Effect.runPromise(queue.pull(1)); // marks 1 as processing

            const size = await Effect.runPromise(queue.size());
            expect(size).toBe(1);
        });
    });
});

describe('createQueue', () => {
    it('should create InMemoryQueueAdapter for memory type', () => {
        const queue = createQueue({ type: 'memory' });
        expect(queue).toBeInstanceOf(InMemoryQueueAdapter);
    });

    it('should throw if convex type without convexUrl', () => {
        expect(() => createQueue({ type: 'convex' })).toThrow('convexUrl is required');
    });
});
