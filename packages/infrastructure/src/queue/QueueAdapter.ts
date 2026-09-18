/**
 * Queue Adapters - Infrastructure implementations of QueueService<T> port
 * Following Hexagonal Architecture: implements core domain port
 */

import { QueueTag, RepositoryError } from '@app/core';
import { Layer, Effect } from 'effect';

// =============================================================================
// IN-MEMORY QUEUE ADAPTER
// =============================================================================

interface InMemoryItem<T> {
  id: string;
  data: T;
  status: 'pending' | 'processing';
  retries: number;
  createdAt: number;
  updatedAt: number;
}

// We need an actual implementation that replicates the old class behavior
// We need an actual implementation that replicates the old class behavior
export class InMemoryQueueAdapter<T> {
  private items = new Map<string, InMemoryItem<T>>();
  private counter = 0;

  push(item: T): Effect.Effect<string, RepositoryError> {
    return Effect.try({
      try: () => {
        const id = `mem-${++this.counter}-${Date.now()}`;
        const now = Date.now();
        this.items.set(id, {
          id,
          data: item,
          status: 'pending',
          retries: 0,
          createdAt: now,
          updatedAt: now,
        });
        return id;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    });
  }

  pushBatch(items: T[]): Effect.Effect<string[], RepositoryError> {
    return Effect.try({
      try: () => {
        const ids: string[] = [];
        for (const item of items) {
          const id = `mem-${++this.counter}-${Date.now()}`;
          this.items.set(id, {
            id,
            data: item,
            status: 'pending',
            retries: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          ids.push(id);
        }
        return ids;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    });
  }

  pull(batchSize = 10): Effect.Effect<Array<{ id: string; data: T }>, RepositoryError> {
    return Effect.try({
      try: () => {
        const pending: Array<{ id: string; data: T }> = [];
        for (const [id, item] of this.items) {
          if (item.status === 'pending' && pending.length < batchSize) {
            item.status = 'processing';
            item.updatedAt = Date.now();
            pending.push({ id, data: item.data });
          }
        }
        return pending;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    });
  }

  complete(id: string): Effect.Effect<void, RepositoryError> {
    return Effect.try({
      try: () => {
        this.items.delete(id);
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    });
  }

  fail(id: string, error?: string): Effect.Effect<void, RepositoryError> {
    return Effect.try({
      try: () => {
        const item = this.items.get(id);
        if (item) {
          item.retries++;
          item.status = 'pending'; // Re-queue for retry
          item.updatedAt = Date.now();
          if (error) {
            console.error(`[InMemoryQueue] Item ${id} failed: ${error}`);
          }
          if (item.retries >= 3) {
            console.error(`[InMemoryQueue] Item ${id} exceeded max retries, removing`);
            this.items.delete(id);
          }
        }
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    });
  }

  size(): Effect.Effect<number, RepositoryError> {
    return Effect.try({
      try: () => {
        let count = 0;
        for (const item of this.items.values()) {
          if (item.status === 'pending') count++;
        }
        return count;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    });
  }

  createLayer() {
    return Layer.succeed(
      QueueTag,
      QueueTag.of({
        push: (item: T) => this.push(item),
        pushBatch: (items: T[]) => this.pushBatch(items),
        pull: (batchSize?: number) => this.pull(batchSize),
        complete: (id: string) => this.complete(id),
        fail: (id: string, error?: string) => this.fail(id, error),
        size: () => this.size(),
      }),
    );
  }

  /** Get all items (for debugging) */
  getAll(): InMemoryItem<T>[] {
    return Array.from(this.items.values());
  }
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create a queue instance (in-memory; the distributed Convex queue was removed
 * with its unimplemented server functions).
 */
export function createQueue<T>() {
  return new InMemoryQueueAdapter<T>();
}
