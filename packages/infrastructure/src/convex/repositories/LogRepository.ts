/* eslint-disable @typescript-eslint/no-explicit-any */
// =============================================================================
// CONVEX LOG REPOSITORY ADAPTER
// Implements LogRepository port for structured logging
// =============================================================================

import type { LogRepository } from '@app/core';
import type { LogEntry, LogLevel } from '@app/core';
// import type { Id } from '@convex-dataModel';

import { api } from '@app/convex';
import { ConvexClient } from 'convex/browser';

/**
 * Convex implementation of LogRepository port
 */
export class ConvexLogRepository implements LogRepository {
  constructor(private client: ConvexClient) { }

  async create(entry: Omit<LogEntry, 'id'>): Promise<LogEntry> {
    const id = await this.client.mutation((api as any).logs.create, {
      level: entry.level,
      message: entry.message,
      context: entry.context,
      traceId: entry.traceId,
      userId: entry.userId,
      timestamp: entry.timestamp,
    });
    return { ...entry, id: id as string };
  }

  async findByLevel(level: LogLevel, limit = 100): Promise<LogEntry[]> {
    const docs = await this.client.query((api as any).logs.getByLevel, {
      level,
      limit,
    });
    return docs.map((doc: any) => this.mapToEntity(doc));
  }

  async findByTraceId(traceId: string): Promise<LogEntry[]> {
    const docs = await this.client.query((api as any).logs.getByTraceId, {
      traceId,
    });
    return docs.map((doc: any) => this.mapToEntity(doc));
  }

  async findByUserId(userId: string, limit = 100): Promise<LogEntry[]> {
    const docs = await this.client.query((api as any).logs.getByUserId, {
      userId,
      limit,
    });
    return docs.map((doc: any) => this.mapToEntity(doc));
  }

  async deleteOlderThan(timestamp: number): Promise<number> {
    return await this.client.mutation((api as any).logs.deleteOlderThan, {
      timestamp,
    });
  }

  private mapToEntity(doc: Record<string, unknown>): LogEntry {
    return {
      id: (doc._id as string) || '',
      level: (doc.level as LogLevel) || 'INFO',
      message: (doc.message as string) || '',
      context: doc.context as Record<string, unknown> | undefined,
      traceId: doc.traceId as string | undefined,
      userId: doc.userId as string | undefined,
      timestamp: (doc.timestamp as number) || 0,
    };
  }
}
