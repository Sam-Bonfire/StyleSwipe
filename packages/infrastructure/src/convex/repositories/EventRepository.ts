// =============================================================================
// CONVEX EVENT REPOSITORY ADAPTER
// Implements EventRepository port for strategic event sampling
// =============================================================================

import type { EventRepository } from "@app/core";
import type { SampledEvent } from "@app/core";
import type { Id } from "@convex-dataModel";

import { api } from "@convex-api";
import { ConvexClient } from "convex/browser";

/**
 * Convex implementation of EventRepository port
 * Supports strategic sampling for analytics
 */
export class ConvexEventRepository implements EventRepository {
    constructor(private client: ConvexClient) { }

    async create(event: Omit<SampledEvent, "id">): Promise<SampledEvent> {
        const id = await this.client.mutation(api.events.create, {
            type: event.type,
            userId: event.userId as Id<"users"> | undefined,
            productId: event.productId as Id<"products"> | undefined,
            variant: event.variant,
            isSampled: event.isSampled,
            metadata: event.metadata,
            timestamp: event.timestamp,
        });
        return { ...event, id: id as string };
    }

    async findByUserAndType(userId: string, type: string, limit = 100): Promise<SampledEvent[]> {
        const docs = await this.client.query(api.events.getByUserAndType, {
            userId: userId as Id<"users">,
            type,
            limit,
        });
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async findByType(type: string, limit = 100): Promise<SampledEvent[]> {
        const docs = await this.client.query(api.events.getByType, {
            type,
            limit,
        });
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async findSampledByType(type: string, limit = 100): Promise<SampledEvent[]> {
        const docs = await this.client.query(api.events.getSampledByType, {
            type,
            limit,
        });
        return docs.map((doc) => this.mapToEntity(doc));
    }

    private mapToEntity(doc: Record<string, unknown>): SampledEvent {
        return {
            id: (doc._id as string) || "",
            type: (doc.type as string) || "",
            userId: doc.userId as string | undefined,
            productId: doc.productId as string | undefined,
            variant: doc.variant as string | undefined,
            isSampled: (doc.isSampled as boolean) || false,
            metadata: doc.metadata as Record<string, unknown> | undefined,
            timestamp: (doc.timestamp as number) || 0,
        };
    }
}
