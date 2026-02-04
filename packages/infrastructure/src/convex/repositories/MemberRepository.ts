/* eslint-disable @typescript-eslint/no-explicit-any */
// =============================================================================
// CONVEX MEMBER REPOSITORY ADAPTER
// Implements MemberRepository port for RBAC membership
// =============================================================================

import type { MemberRepository } from '@app/core';
import type { Member, MemberRole } from '@app/core';
// import type { Id } from '@convex-dataModel';

import { api } from '@convex-api';
import { ConvexClient } from 'convex/browser';

/**
 * Convex implementation of MemberRepository port
 */
export class ConvexMemberRepository implements MemberRepository {
  constructor(private client: ConvexClient) { }

  async findById(id: string): Promise<Member | null> {
    const doc = await this.client.query((api as any).members.getById, {
      id,
    });
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByOrgAndUser(orgId: string, userId: string): Promise<Member | null> {
    const doc = await this.client.query((api as any).members.getByOrgAndUser, {
      orgId,
      userId,
    });
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByOrg(orgId: string): Promise<Member[]> {
    const docs = await this.client.query((api as any).members.getByOrg, {
      orgId,
    });
    return docs.map((doc: any) => this.mapToEntity(doc));
  }

  async findByUser(userId: string): Promise<Member[]> {
    const docs = await this.client.query((api as any).members.getByUser, {
      userId,
    });
    return docs.map((doc: any) => this.mapToEntity(doc));
  }

  async create(member: Omit<Member, 'id'>): Promise<Member> {
    const id = await this.client.mutation((api as any).members.create, {
      orgId: member.orgId,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
    });
    return { ...member, id: id as string };
  }

  async updateRole(id: string, role: MemberRole): Promise<Member> {
    await this.client.mutation((api as any).members.updateRole, {
      id,
      role,
    });
    const updated = await this.findById(id);
    if (!updated) throw new Error(`Member ${id} not found after update`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.client.mutation((api as any).members.remove, {
      id,
    });
  }

  async deleteByOrg(orgId: string): Promise<void> {
    await this.client.mutation((api as any).members.removeByOrg, {
      orgId,
    });
  }

  private mapToEntity(doc: Record<string, unknown>): Member {
    return {
      id: (doc._id as string) || '',
      orgId: (doc.orgId as string) || '',
      userId: (doc.userId as string) || '',
      role: (doc.role as MemberRole) || 'member',
      joinedAt: (doc.joinedAt as number) || 0,
    };
  }
}
