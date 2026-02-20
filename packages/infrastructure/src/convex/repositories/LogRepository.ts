import type { LogEntry, LogLevel, PaginationOpts } from '@app/core';

import { api } from '@app/convex';
import { LogRepository, RepositoryError } from '@app/core';
import { ConvexClient } from 'convex/browser';
import { Layer, Effect } from 'effect';

/**
 * Convex implementation of LogRepository port
 */

const mapToEntity = (doc: Record<string, unknown>): LogEntry => {
  return {
    id: (doc._id as string) || '',
    level: (doc.level as LogLevel) || 'INFO',
    message: (doc.message as string) || '',
    context: doc.context as Record<string, unknown> | undefined,
    traceId: doc.traceId as string | undefined,
    userId: doc.userId as string | undefined,
    timestamp: (doc.timestamp as number) || 0,
  };
};

export const createLogRepositoryLayer = (client: ConvexClient) =>
  Layer.succeed(
    LogRepository,
    LogRepository.of({
      create: (entry: Omit<LogEntry, 'id'>) =>
        Effect.tryPromise({
          try: async () => {
            const id = await client.mutation(api.logs.create, {
              level: entry.level,
              message: entry.message,
              context: entry.context,
              traceId: entry.traceId,
              userId: entry.userId,
              timestamp: entry.timestamp,
            });
            return { ...entry, id: id as string };
          },
          catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
        }),

      findByLevel: (level: LogLevel, limit = 100) =>
        Effect.tryPromise({
          try: async () => {
            const docs = await client.query(api.logs.getByLevel, {
              level,
              limit,
            });
            return docs.map((doc: Record<string, unknown>) => mapToEntity(doc));
          },
          catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
        }),

      findByTraceId: (traceId: string) =>
        Effect.tryPromise({
          try: async () => {
            const docs = await client.query(api.logs.getByTraceId, {
              traceId,
            });
            return docs.map((doc: Record<string, unknown>) => mapToEntity(doc));
          },
          catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
        }),

      findByUserId: (userId: string, limit = 100) =>
        Effect.tryPromise({
          try: async () => {
            const docs = await client.query(api.logs.getByUserId, {
              userId,
              limit,
            });
            return docs.map((doc: Record<string, unknown>) => mapToEntity(doc));
          },
          catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
        }),

      deleteOlderThan: (timestamp: number) =>
        Effect.tryPromise({
          try: async () => {
            return await client.mutation(api.logs.deleteOlderThan, {
              timestamp,
            });
          },
          catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
        }),

      list: (paginationOpts: PaginationOpts) =>
        Effect.tryPromise({
          try: async () => {
            const result = await client.query(api.logs.getLogs, {
              paginationOpts,
            });
            return {
              page: result.page.map((doc: Record<string, unknown>) => mapToEntity(doc)),
              isDone: result.isDone,
              continueCursor: result.continueCursor,
            };
          },
          catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
        }),
    }),
  );
