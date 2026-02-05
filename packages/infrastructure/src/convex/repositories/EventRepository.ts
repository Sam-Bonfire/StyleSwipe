/* eslint-disable @typescript-eslint/no-explicit-any */
// =============================================================================
// CONVEX EVENT REPOSITORY ADAPTER
// Implements EventRepository port for strategic event sampling
// =============================================================================

import type { EventRepository } from '@app/core';
import type { SampledEvent } from '@app/core';
// import type { Id } from '@convex-dataModel';

import { api } from '@app/convex';
import { ConvexClient } from 'convex/browser';

/**
 * Convex implementation of EventRepository port
 * Supports strategic sampling for analytics
 */
export class ConvexEventRepository implements EventRepository {
  constructor(private client: ConvexClient) { }

  async create(event: Omit<SampledEvent, 'id'>): Promise<SampledEvent> {
    const id = await this.client.mutation((api as any).events.create, {
      type: event.type,
      userId: event.userId,
      productId: event.productId,
      variant: event.variant,
      isSampled: event.isSampled,
      metadata: event.metadata,
      timestamp: event.timestamp,
    });
    return { ...event, id: id as string };
  }

  async findByUserAndType(userId: string, type: string, limit = 100): Promise<SampledEvent[]> {
    const docs = await this.client.query((api as any).events.getByUserAndType, {
      userId,
      type,
      limit,
    });
    return docs.map((doc: any) => this.mapToEntity(doc));
  }

  async findByType(type: string, limit = 100): Promise<SampledEvent[]> {
    const docs = await this.client.query((api as any).events.getByType, {
      type,
      limit,
    });
    return docs.map((doc: any) => this.mapToEntity(doc));
  }

  async findSampledByType(type: string, limit = 100): Promise<SampledEvent[]> {
    const docs = await this.client.query((api as any).events.getSampledByType, {
      type,
      limit,
    });
    return docs.map((doc: any) => this.mapToEntity(doc));
  }

  private mapToEntity(doc: Record<string, unknown>): SampledEvent {
    return {
      id: (doc._id as string) || '',
      type: (doc.type as string) || '',
      userId: doc.userId as string | undefined,
      productId: doc.productId as string | undefined,
      variant: doc.variant as string | undefined,
      isSampled: (doc.isSampled as boolean) || false,
      metadata: doc.metadata as Record<string, unknown> | undefined,
      timestamp: (doc.timestamp as number) || 0,
    };
  }
}
