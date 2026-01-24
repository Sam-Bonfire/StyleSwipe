// =============================================================================
// CONVEX MEMBER REPOSITORY ADAPTER
// Implements MemberRepository port for RBAC membership
// =============================================================================

import { ConvexClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import type { MemberRepository } from "@app/core";
import type { Member, MemberRole } from "@app/core";

/**
 * Convex implementation of MemberRepository port
 */
export class ConvexMemberRepository implements MemberRepository {
    constructor(private client: ConvexClient) { }

    async findById(id: string): Promise<Member | null> {
        const doc = await this.client.query(api.members.getById, {
            id: id as Id<"members">,
        });
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByOrgAndUser(orgId: string, userId: string): Promise<Member | null> {
        const doc = await this.client.query(api.members.getByOrgAndUser, {
            orgId: orgId as Id<"organizations">,
            userId: userId as Id<"users">,
        });
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByOrg(orgId: string): Promise<Member[]> {
        const docs = await this.client.query(api.members.getByOrg, {
            orgId: orgId as Id<"organizations">,
        });
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async findByUser(userId: string): Promise<Member[]> {
        const docs = await this.client.query(api.members.getByUser, {
            userId: userId as Id<"users">,
        });
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async create(member: Omit<Member, "id">): Promise<Member> {
        const id = await this.client.mutation(api.members.create, {
            orgId: member.orgId as Id<"organizations">,
            userId: member.userId as Id<"users">,
            role: member.role,
            joinedAt: member.joinedAt,
        });
        return { ...member, id: id as string };
    }

    async updateRole(id: string, role: MemberRole): Promise<Member> {
        await this.client.mutation(api.members.updateRole, {
            id: id as Id<"members">,
            role,
        });
        const updated = await this.findById(id);
        if (!updated) throw new Error(`Member ${id} not found after update`);
        return updated;
    }

    async delete(id: string): Promise<void> {
        await this.client.mutation(api.members.remove, {
            id: id as Id<"members">,
        });
    }

    async deleteByOrg(orgId: string): Promise<void> {
        await this.client.mutation(api.members.removeByOrg, {
            orgId: orgId as Id<"organizations">,
        });
    }

    private mapToEntity(doc: Record<string, unknown>): Member {
        return {
            id: (doc._id as string) || "",
            orgId: (doc.orgId as string) || "",
            userId: (doc.userId as string) || "",
            role: (doc.role as MemberRole) || "member",
            joinedAt: (doc.joinedAt as number) || 0,
        };
    }
}
