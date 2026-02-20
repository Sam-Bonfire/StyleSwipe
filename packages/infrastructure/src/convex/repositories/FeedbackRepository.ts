import type { Id } from '@app/convex';
import type { Feedback, FeedbackStatus, FeedbackType, PaginationOpts, FeedbackReply } from '@app/core';

import { api } from '@app/convex';
import { FeedbackRepository, RepositoryError } from '@app/core';
import { ConvexClient } from 'convex/browser';
import { Layer, Effect } from 'effect';



const mapToEntity = (doc: Record<string, unknown>): Feedback => {
    return {
    id: (doc._id as string) || '',
    userId: (doc.userId as string) || '',
    name: (doc.name as string) || '',
    contact: (doc.contact as string) || '',
    type: (doc.type as FeedbackType) || 'general',
    message: (doc.message as string) || '',
    attachment: doc.attachment as string | undefined,
    status: (doc.status as FeedbackStatus) || 'open',
    replies: (doc.replies as FeedbackReply[]) || [],
    createdAt: (doc._creationTime as number) || 0,
    updatedAt: (doc.updatedAt as number) || 0,
};
};


export const createFeedbackRepositoryLayer = (client: ConvexClient) => Layer.succeed(
    FeedbackRepository,
    FeedbackRepository.of({

    create: (feedback: Omit<Feedback, 'id' | 'replies' | 'status' | 'updatedAt' | 'createdAt'>) => Effect.tryPromise({
      try: async () => {
          const id = await client.mutation(api.feedback.create, {
    userId: feedback.userId,
    type: feedback.type,
    name: feedback.name,
    contact: feedback.contact,
    message: feedback.message,
    attachment: feedback.attachment,
});
return {
    ...feedback,
    id: id as string,
    replies: [],
    status: 'open' as FeedbackStatus,
    createdAt: Date.now(),
    updatedAt: Date.now(),
};
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findById: () => Effect.tryPromise({
      try: async () => {
          // No dedicated getById endpoint in Convex yet
return null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    listByUser: (userId: string) => Effect.tryPromise({
      try: async () => {
          const docs = await client.query(api.feedback.listByUser, { userId });
return docs.map((doc: Record<string, unknown>) => mapToEntity(doc));
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    list: (paginationOpts: PaginationOpts) => Effect.tryPromise({
      try: async () => {
          const result = await client.query(api.feedback.list, { paginationOpts });
return {
    page: result.page.map((doc: Record<string, unknown>) => mapToEntity(doc)),
    isDone: result.isDone,
    continueCursor: result.continueCursor,
};
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    updateStatus: (id: string, status: FeedbackStatus) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.feedback.updateStatus, {
    id: id as Id<'feedback'>,
    status,
});
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    addReply: (id: string, adminId: string, message: string) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.feedback.reply, {
    id: id as Id<'feedback'>,
    adminId,
    message,
});
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    generateUploadUrl: () => Effect.tryPromise({
      try: async () => {
          return await client.mutation(api.feedback.generateUploadUrl, {});
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    })
);

