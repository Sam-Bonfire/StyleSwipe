// =============================================================================
// CONVEX FEATURE FLAG REPOSITORY ADAPTER
// Implements FeatureFlagRepository port for A/B testing and rollouts
// =============================================================================

import type { FeatureFlagRepository } from "@app/core";
import type { FeatureFlag, Environment, FeatureFlagRule } from "@app/core";
import type { Id } from "@convex-dataModel";

import { api } from "@convex-api";
import { ConvexClient } from "convex/browser";

/**
 * Convex implementation of FeatureFlagRepository port
 */
export class ConvexFeatureFlagRepository implements FeatureFlagRepository {
    constructor(private client: ConvexClient) { }

    async findById(id: string): Promise<FeatureFlag | null> {
        const doc = await this.client.query(api.featureFlags.getById, {
            id: id as Id<"featureFlags">,
        });
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByName(environment: Environment, name: string): Promise<FeatureFlag | null> {
        const doc = await this.client.query(api.featureFlags.getByEnvName, {
            environment,
            name,
        });
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByEnvironment(environment: Environment): Promise<FeatureFlag[]> {
        const docs = await this.client.query(api.featureFlags.getByEnvironment, {
            environment,
        });
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async create(flag: Omit<FeatureFlag, "id">): Promise<FeatureFlag> {
        const id = await this.client.mutation(api.featureFlags.create, {
            name: flag.name,
            description: flag.description,
            isEnabled: flag.isEnabled,
            environment: flag.environment,
            rules: flag.rules,
            updatedAt: flag.updatedAt,
        });
        return { ...flag, id: id as string };
    }

    async update(id: string, data: Partial<Omit<FeatureFlag, "id">>): Promise<FeatureFlag> {
        await this.client.mutation(api.featureFlags.update, {
            id: id as Id<"featureFlags">,
            ...data,
            updatedAt: Date.now(),
        });
        const updated = await this.findById(id);
        if (!updated) throw new Error(`FeatureFlag ${id} not found after update`);
        return updated;
    }

    async delete(id: string): Promise<void> {
        await this.client.mutation(api.featureFlags.remove, {
            id: id as Id<"featureFlags">,
        });
    }

    private mapToEntity(doc: Record<string, unknown>): FeatureFlag {
        return {
            id: (doc._id as string) || "",
            name: (doc.name as string) || "",
            description: doc.description as string | undefined,
            isEnabled: (doc.isEnabled as boolean) || false,
            environment: (doc.environment as Environment) || "dev",
            rules: doc.rules as FeatureFlagRule[] | undefined,
            updatedAt: (doc.updatedAt as number) || 0,
        };
    }
}
