
// =============================================================================
// CONVEX PARTNER SYNC REPOSITORY ADAPTER
// Implements PartnerSyncRepository port for collaborative shopping
// =============================================================================

import type { Id } from '@app/convex';
import type { PartnerSyncRepository } from '@app/core';
import type { PartnerSync, PartnerSyncStatus } from '@app/core';

import { api } from '@app/convex';
import { ConvexClient } from 'convex/browser';

/**
 * Convex implementation of PartnerSyncRepository port
 */
export class ConvexPartnerSyncRepository implements PartnerSyncRepository {
  constructor(private client: ConvexClient) { }

  async findById(id: string): Promise<PartnerSync | null> {
    const doc = await this.client.query(api.partnerSync.getById, {
      id: id as Id<'partnerSync'>,
    });
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByInviteCode(inviteCode: string): Promise<PartnerSync | null> {
    const doc = await this.client.query(api.partnerSync.getByInviteCode, {
      inviteCode,
    });
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByInitiator(initiatorId: string): Promise<PartnerSync[]> {
    const docs = await this.client.query(api.partnerSync.getByInitiator, {
      initiatorId,
    });
    return (docs as any[]).map((doc: any) => this.mapToEntity(doc));
  }

  async findByPartner(partnerId: string): Promise<PartnerSync[]> {
    const docs = await this.client.query(api.partnerSync.getByPartner, {
      partnerId,
    });
    return (docs as any[]).map((doc: any) => this.mapToEntity(doc));
  }

  async findActiveByUser(userId: string): Promise<PartnerSync | null> {
    const doc = await this.client.query(api.partnerSync.getActiveByUser, {
      userId,
    });
    return doc ? this.mapToEntity(doc) : null;
  }

  async create(sync: Omit<PartnerSync, 'id'>): Promise<PartnerSync> {
    const id = await this.client.mutation(api.partnerSync.create, {
      initiatorId: sync.initiatorId,
      partnerId: sync.partnerId,
      inviteCode: sync.inviteCode,
      status: sync.status,
      expiresAt: sync.expiresAt,
      influenceRatio: sync.influenceRatio,
      createdAt: sync.createdAt,
    } as any);
    return { ...sync, id: id as string };
  }

  async update(id: string, data: Partial<Omit<PartnerSync, 'id'>>): Promise<PartnerSync> {
    await this.client.mutation(api.partnerSync.update, {
      id: id as Id<'partnerSync'>,
      ...data,
      initiatorId: data.initiatorId,
      partnerId: data.partnerId,
    } as any);
    const updated = await this.findById(id);
    if (!updated) throw new Error(`PartnerSync ${id} not found after update`);
    return updated;
  }

  async updateStatus(id: string, status: PartnerSyncStatus): Promise<PartnerSync> {
    await this.client.mutation(api.partnerSync.updateStatus, {
      id: id as Id<'partnerSync'>,
      status,
    } as any);
    const updated = await this.findById(id);
    if (!updated) throw new Error(`PartnerSync ${id} not found after update`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.client.mutation(api.partnerSync.remove, {
      id: id as Id<'partnerSync'>,
    } as any);
  }

  async deleteExpired(): Promise<number> {
    return await this.client.mutation(api.partnerSync.deleteExpired, {
      now: Date.now(),
    } as any);
  }

  // Map Convex document to domain entity
  private mapToEntity(doc: Record<string, unknown>): PartnerSync {
    return {
      id: (doc._id as string) || '',
      initiatorId: (doc.initiatorId as string) || '',
      partnerId: doc.partnerId as string | undefined,
      inviteCode: (doc.inviteCode as string) || '',
      status: (doc.status as PartnerSyncStatus) || 'pending',
      expiresAt: (doc.expiresAt as number) || 0,
      influenceRatio: (doc.influenceRatio as number) || 0.5,
      createdAt: (doc.createdAt as number) || 0,
    };
  }
}
