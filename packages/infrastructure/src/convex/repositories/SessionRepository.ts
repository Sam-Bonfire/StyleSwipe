/* eslint-disable @typescript-eslint/no-explicit-any */
// =============================================================================
// CONVEX SESSION REPOSITORY ADAPTER
// Implements SessionRepository port for device session management
// =============================================================================

import type { SessionRepository } from '@app/core';
import type { Session } from '@app/core';
// import type { Id } from '@convex-dataModel';

import { api } from '@app/convex';
import { ConvexClient } from 'convex/browser';

/**
 * Convex implementation of SessionRepository port
 */
export class ConvexSessionRepository implements SessionRepository {
  constructor(private client: ConvexClient) { }

  async findById(id: string): Promise<Session | null> {
    const doc = await this.client.query((api as any).sessions.getById, {
      id,
    });
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByToken(token: string): Promise<Session | null> {
    const doc = await this.client.query((api as any).sessions.getByToken, { token });
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByUserId(userId: string): Promise<Session[]> {
    const docs = await this.client.query((api as any).sessions.getByUserId, {
      userId,
    });
    return docs.map((doc: any) => this.mapToEntity(doc));
  }

  async create(session: Omit<Session, 'id'>): Promise<Session> {
    const id = await this.client.mutation((api as any).sessions.create, {
      userId: session.userId,
      token: session.token,
      expiresAt: session.expiresAt,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
    });
    return { ...session, id: id as string };
  }

  async delete(id: string): Promise<void> {
    await this.client.mutation((api as any).sessions.remove, {
      id,
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.client.mutation((api as any).sessions.removeByUserId, {
      userId,
    });
  }

  async deleteExpired(): Promise<number> {
    return await this.client.mutation((api as any).sessions.deleteExpired, {
      now: Date.now(),
    });
  }

  private mapToEntity(doc: Record<string, unknown>): Session {
    return {
      id: (doc._id as string) || '',
      userId: (doc.userId as string) || '',
      token: (doc.token as string) || '',
      expiresAt: (doc.expiresAt as number) || 0,
      userAgent: doc.userAgent as string | undefined,
      ipAddress: doc.ipAddress as string | undefined,
      createdAt: (doc.createdAt as number) || 0,
    };
  }
}
