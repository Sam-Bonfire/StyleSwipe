// =============================================================================
// CONVEX LOG REPOSITORY ADAPTER
// Implements LogRepository port for structured logging
// =============================================================================

import type { LogRepository } from "@app/core";
import type { LogEntry, LogLevel } from "@app/core";

import { ConvexClient } from "convex/browser";

import type { Id } from "../../../../convex/_generated/dataModel";

import { api } from "../../../../convex/_generated/api";

/**
 * Convex implementation of LogRepository port
 */
export class ConvexLogRepository implements LogRepository {
    constructor(private client: ConvexClient) { }

    async create(entry: Omit<LogEntry, "id">): Promise<LogEntry> {
        const id = await this.client.mutation(api.logs.create, {
            level: entry.level,
            message: entry.message,
            context: entry.context,
            traceId: entry.traceId,
            userId: entry.userId as Id<"users"> | undefined,
            timestamp: entry.timestamp,
        });
        return { ...entry, id: id as string };
    }

    async findByLevel(level: LogLevel, limit = 100): Promise<LogEntry[]> {
        const docs = await this.client.query(api.logs.getByLevel, {
            level,
            limit,
        });
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async findByTraceId(traceId: string): Promise<LogEntry[]> {
        const docs = await this.client.query(api.logs.getByTraceId, {
            traceId,
        });
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async findByUserId(userId: string, limit = 100): Promise<LogEntry[]> {
        const docs = await this.client.query(api.logs.getByUserId, {
            userId: userId as Id<"users">,
            limit,
        });
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async deleteOlderThan(timestamp: number): Promise<number> {
        return await this.client.mutation(api.logs.deleteOlderThan, {
            timestamp,
        });
    }

    private mapToEntity(doc: Record<string, unknown>): LogEntry {
        return {
            id: (doc._id as string) || "",
            level: (doc.level as LogLevel) || "INFO",
            message: (doc.message as string) || "",
            context: doc.context as Record<string, unknown> | undefined,
            traceId: doc.traceId as string | undefined,
            userId: doc.userId as string | undefined,
            timestamp: (doc.timestamp as number) || 0,
        };
    }
}
