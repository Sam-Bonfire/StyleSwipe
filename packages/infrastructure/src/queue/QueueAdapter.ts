/**
 * Queue Adapters - Infrastructure implementations of Queue<T> port
 * Following Hexagonal Architecture: implements core domain port
 */

import type { Queue } from "@app/core";

// =============================================================================
// IN-MEMORY QUEUE ADAPTER
// =============================================================================

interface InMemoryItem<T> {
    id: string;
    data: T;
    status: "pending" | "processing";
    retries: number;
    createdAt: number;
    updatedAt: number;
}

/**
 * In-memory queue implementation using Map
 * Suitable for single-process deployments
 */
export class InMemoryQueueAdapter<T> implements Queue<T> {
    private items = new Map<string, InMemoryItem<T>>();
    private counter = 0;

    async push(item: T): Promise<string> {
        const id = `mem-${++this.counter}-${Date.now()}`;
        const now = Date.now();
        this.items.set(id, {
            id,
            data: item,
            status: "pending",
            retries: 0,
            createdAt: now,
            updatedAt: now,
        });
        return id;
    }

    async pushBatch(items: T[]): Promise<string[]> {
        const ids: string[] = [];
        for (const item of items) {
            ids.push(await this.push(item));
        }
        return ids;
    }

    async pull(batchSize = 10): Promise<Array<{ id: string; data: T }>> {
        const pending: Array<{ id: string; data: T }> = [];

        for (const [id, item] of this.items) {
            if (item.status === "pending" && pending.length < batchSize) {
                item.status = "processing";
                item.updatedAt = Date.now();
                pending.push({ id, data: item.data });
            }
        }

        return pending;
    }

    async complete(id: string): Promise<void> {
        this.items.delete(id);
    }

    async fail(id: string, error?: string): Promise<void> {
        const item = this.items.get(id);
        if (item) {
            item.retries++;
            item.status = "pending"; // Re-queue for retry
            item.updatedAt = Date.now();
            if (error) {
                console.error(`[InMemoryQueue] Item ${id} failed: ${error}`);
            }
            // After 3 retries, remove from queue
            if (item.retries >= 3) {
                console.error(`[InMemoryQueue] Item ${id} exceeded max retries, removing`);
                this.items.delete(id);
            }
        }
    }

    async size(): Promise<number> {
        let count = 0;
        for (const item of this.items.values()) {
            if (item.status === "pending") count++;
        }
        return count;
    }

    /** Get all items (for debugging) */
    getAll(): InMemoryItem<T>[] {
        return Array.from(this.items.values());
    }
}

// =============================================================================
// CONVEX QUEUE ADAPTER
// =============================================================================

import { ConvexHttpClient } from "convex/browser";

interface ConvexQueueConfig {
    convexUrl: string;
}

/**
 * Convex-backed queue implementation using scrape_jobs table
 * Suitable for distributed deployments with multiple workers
 */
export class ConvexQueueAdapter<T> implements Queue<T> {
    private client: ConvexHttpClient;

    constructor(config: ConvexQueueConfig) {
        this.client = new ConvexHttpClient(config.convexUrl);
    }

    async push(item: T): Promise<string> {
        // Store as a scrape job with type "queue_item"
        // The data is serialized as JSON
        const id = await this.client.mutation(
            // Using dynamic import to avoid circular deps
            "scraper:enqueueItem" as any,
            { data: item as any }
        );
        return id;
    }

    async pushBatch(items: T[]): Promise<string[]> {
        const ids: string[] = [];
        for (const item of items) {
            ids.push(await this.push(item));
        }
        return ids;
    }

    async pull(batchSize = 10): Promise<Array<{ id: string; data: T }>> {
        const items = await this.client.mutation(
            "scraper:dequeueItems" as any,
            { batchSize }
        );
        return items as Array<{ id: string; data: T }>;
    }

    async complete(id: string): Promise<void> {
        await this.client.mutation(
            "scraper:completeItem" as any,
            { id }
        );
    }

    async fail(id: string, error?: string): Promise<void> {
        await this.client.mutation(
            "scraper:failItem" as any,
            { id, error }
        );
    }

    async size(): Promise<number> {
        const count = await this.client.query(
            "scraper:getQueueSize" as any,
            {}
        );
        return count as number;
    }
}

// =============================================================================
// FACTORY
// =============================================================================

export type QueueType = "memory" | "convex";

export interface QueueFactoryConfig {
    type: QueueType;
    convexUrl?: string;
}

/**
 * Create a queue instance based on configuration
 */
export function createQueue<T>(config: QueueFactoryConfig): Queue<T> {
    if (config.type === "convex") {
        if (!config.convexUrl) {
            throw new Error("convexUrl is required for Convex queue");
        }
        return new ConvexQueueAdapter<T>({ convexUrl: config.convexUrl });
    }
    return new InMemoryQueueAdapter<T>();
}
