// =============================================================================
// CONVEX ACCOUNT REPOSITORY ADAPTER
// Implements AccountRepository port for OAuth provider accounts
// =============================================================================

import { ConvexClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import type { AccountRepository } from "@app/core";
import type { Account } from "@app/core";

/**
 * Convex implementation of AccountRepository port
 */
export class ConvexAccountRepository implements AccountRepository {
    constructor(private client: ConvexClient) { }

    async findById(id: string): Promise<Account | null> {
        const doc = await this.client.query(api.accounts.getById, {
            id: id as Id<"accounts">,
        });
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByProvider(providerId: string, providerAccountId: string): Promise<Account | null> {
        const doc = await this.client.query(api.accounts.getByProvider, {
            providerId,
            providerAccountId,
        });
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByUserId(userId: string): Promise<Account[]> {
        const docs = await this.client.query(api.accounts.getByUserId, {
            userId: userId as Id<"users">,
        });
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async create(account: Omit<Account, "id">): Promise<Account> {
        const id = await this.client.mutation(api.accounts.create, {
            userId: account.userId as Id<"users">,
            providerId: account.providerId,
            providerAccountId: account.providerAccountId,
            accessToken: account.accessToken,
            refreshToken: account.refreshToken,
            accessTokenExpiresAt: account.accessTokenExpiresAt,
            scope: account.scope,
        });
        return { ...account, id: id as string };
    }

    async update(id: string, data: Partial<Omit<Account, "id">>): Promise<Account> {
        await this.client.mutation(api.accounts.update, {
            id: id as Id<"accounts">,
            ...data,
            userId: data.userId as Id<"users"> | undefined,
        });
        const updated = await this.findById(id);
        if (!updated) throw new Error(`Account ${id} not found after update`);
        return updated;
    }

    async delete(id: string): Promise<void> {
        await this.client.mutation(api.accounts.remove, {
            id: id as Id<"accounts">,
        });
    }

    async deleteByUserId(userId: string): Promise<void> {
        await this.client.mutation(api.accounts.removeByUserId, {
            userId: userId as Id<"users">,
        });
    }

    private mapToEntity(doc: Record<string, unknown>): Account {
        return {
            id: (doc._id as string) || "",
            userId: (doc.userId as string) || "",
            providerId: (doc.providerId as string) || "",
            providerAccountId: (doc.providerAccountId as string) || "",
            accessToken: doc.accessToken as string | undefined,
            refreshToken: doc.refreshToken as string | undefined,
            accessTokenExpiresAt: doc.accessTokenExpiresAt as number | undefined,
            scope: doc.scope as string | undefined,
        };
    }
}
