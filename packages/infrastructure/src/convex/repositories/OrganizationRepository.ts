// =============================================================================
// CONVEX ORGANIZATION REPOSITORY ADAPTER
// Implements OrganizationRepository port for multi-tenant orgs
// =============================================================================

import type { OrganizationRepository } from "@app/core";
import type { Organization, OrganizationMetadata } from "@app/core";

import { ConvexClient } from "convex/browser";

import type { Id } from "../../../../convex/_generated/dataModel";

import { api } from "../../../../convex/_generated/api";

/**
 * Convex implementation of OrganizationRepository port
 */
export class ConvexOrganizationRepository implements OrganizationRepository {
    constructor(private client: ConvexClient) { }

    async findById(id: string): Promise<Organization | null> {
        const doc = await this.client.query(api.organizations.getById, {
            id: id as Id<"organizations">,
        });
        return doc ? this.mapToEntity(doc) : null;
    }

    async findBySlug(slug: string): Promise<Organization | null> {
        const doc = await this.client.query(api.organizations.getBySlug, { slug });
        return doc ? this.mapToEntity(doc) : null;
    }

    async create(org: Omit<Organization, "id">): Promise<Organization> {
        const id = await this.client.mutation(api.organizations.create, {
            name: org.name,
            slug: org.slug,
            logo: org.logo,
            metadata: org.metadata,
            createdAt: org.createdAt,
        });
        return { ...org, id: id as string };
    }

    async update(id: string, data: Partial<Omit<Organization, "id">>): Promise<Organization> {
        await this.client.mutation(api.organizations.update, {
            id: id as Id<"organizations">,
            ...data,
        });
        const updated = await this.findById(id);
        if (!updated) throw new Error(`Organization ${id} not found after update`);
        return updated;
    }

    async delete(id: string): Promise<void> {
        await this.client.mutation(api.organizations.remove, {
            id: id as Id<"organizations">,
        });
    }

    private mapToEntity(doc: Record<string, unknown>): Organization {
        return {
            id: (doc._id as string) || "",
            name: (doc.name as string) || "",
            slug: (doc.slug as string) || "",
            logo: doc.logo as string | undefined,
            metadata: doc.metadata as OrganizationMetadata | undefined,
            createdAt: (doc.createdAt as number) || 0,
        };
    }
}
