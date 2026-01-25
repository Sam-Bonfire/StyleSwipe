// =============================================================================
// CONVEX USER REPOSITORY ADAPTER
// Implements UserRepository port for Convex backend
// =============================================================================

import type { UserRepository } from "@app/core";
import type { User, StyleProfile } from "@app/core";

import { ConvexClient } from "convex/browser";

import type { Id } from "@convex-dataModel";

import { api } from "@convex-api";

/**
 * Convex implementation of UserRepository port
 */
export class ConvexUserRepository implements UserRepository {
    constructor(private client: ConvexClient) { }

    async findById(id: string): Promise<User | null> {
        const doc = await this.client.query(api.users.getById, {
            id: id as Id<"users">,
        });
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const doc = await this.client.query(api.users.getByEmail, { email });
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByPhone(phone: string): Promise<User | null> {
        const doc = await this.client.query(api.users.getByPhone, { phone });
        return doc ? this.mapToEntity(doc) : null;
    }

    async create(user: Omit<User, "id">): Promise<User> {
        const id = await this.client.mutation(api.users.create, {
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            phone: user.phone,
            activeOrgId: user.activeOrgId as Id<"organizations"> | undefined,
            styleProfile: user.styleProfile,
        });
        return { ...user, id: id as string };
    }

    async update(id: string, data: Partial<Omit<User, "id">>): Promise<User> {
        await this.client.mutation(api.users.update, {
            id: id as Id<"users">,
            ...data,
            activeOrgId: data.activeOrgId as Id<"organizations"> | undefined,
        });
        const updated = await this.findById(id);
        if (!updated) throw new Error(`User ${id} not found after update`);
        return updated;
    }

    async updateStyleProfile(id: string, profile: StyleProfile): Promise<User> {
        await this.client.mutation(api.users.updateStyleProfile, {
            id: id as Id<"users">,
            styleProfile: profile,
        });
        const updated = await this.findById(id);
        if (!updated) throw new Error(`User ${id} not found after update`);
        return updated;
    }

    async delete(id: string): Promise<void> {
        await this.client.mutation(api.users.remove, {
            id: id as Id<"users">,
        });
    }

    // Map Convex document to domain entity
    private mapToEntity(doc: Record<string, unknown>): User {
        return {
            id: (doc._id as string) || "",
            name: (doc.name as string) || "",
            email: (doc.email as string) || "",
            emailVerified: (doc.emailVerified as boolean) || false,
            image: doc.image as string | undefined,
            phone: (doc.phone as string) || "",
            activeOrgId: doc.activeOrgId as string | undefined,
            styleProfile: doc.styleProfile as StyleProfile | undefined,
        };
    }
}
