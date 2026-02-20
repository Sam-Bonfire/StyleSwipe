import type { Id } from '@app/convex';
import type { FeedbackRepository } from '@app/core';
import type { Feedback, FeedbackStatus, FeedbackType, PaginationOpts, PaginatedResult, FeedbackReply } from '@app/core';

import { api } from '@app/convex';
import { ConvexClient } from 'convex/browser';

export class ConvexFeedbackRepository implements FeedbackRepository {
    constructor(private client: ConvexClient) { }

    async create(feedback: Omit<Feedback, 'id' | 'replies' | 'status' | 'updatedAt' | 'createdAt'>): Promise<Feedback> {
        const id = await this.client.mutation(api.feedback.create, {
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
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async findById(_id: string): Promise<Feedback | null> {
        // No dedicated getById endpoint in Convex yet
        return null;
    }

    async listByUser(userId: string): Promise<Feedback[]> {
        const docs = await this.client.query(api.feedback.listByUser, { userId });
        return docs.map((doc: Record<string, unknown>) => this.mapToEntity(doc));
    }

    async list(paginationOpts: PaginationOpts): Promise<PaginatedResult<Feedback>> {
        const result = await this.client.query(api.feedback.list, { paginationOpts });
        return {
            page: result.page.map((doc: Record<string, unknown>) => this.mapToEntity(doc)),
            isDone: result.isDone,
            continueCursor: result.continueCursor,
        };
    }

    async updateStatus(id: string, status: FeedbackStatus): Promise<void> {
        await this.client.mutation(api.feedback.updateStatus, {
            id: id as Id<'feedback'>,
            status,
        });
    }

    async addReply(id: string, adminId: string, message: string): Promise<void> {
        await this.client.mutation(api.feedback.reply, {
            id: id as Id<'feedback'>,
            adminId,
            message,
        });
    }

    async generateUploadUrl(): Promise<string> {
        return await this.client.mutation(api.feedback.generateUploadUrl, {});
    }

    private mapToEntity(doc: Record<string, unknown>): Feedback {
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
    }
}
