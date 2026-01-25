// =============================================================================
// CONVEX PRODUCT REPOSITORY ADAPTER
// Implements ProductRepository port for Convex backend with vector search
// =============================================================================

import type { ProductRepository } from "@app/core";
import type { Product, ProductAttributes } from "@app/core";

import { ConvexClient } from "convex/browser";

import type { Id } from "../../../../convex/_generated/dataModel";

import { api } from "../../../../convex/_generated/api";

/**
 * Convex implementation of ProductRepository port
 * Includes vector similarity search for Discovery Mode
 */
export class ConvexProductRepository implements ProductRepository {
    constructor(private client: ConvexClient) { }

    async findById(id: string): Promise<Product | null> {
        const doc = await this.client.query(api.products.getById, {
            id: id as Id<"products">,
        });
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByCategory(category: string, limit = 50): Promise<Product[]> {
        const docs = await this.client.query(api.products.getByCategory, {
            category,
            limit,
        });
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async findByCategoryAndPrice(
        category: string,
        minPrice: number,
        maxPrice: number,
        limit = 50
    ): Promise<Product[]> {
        const docs = await this.client.query(api.products.getByCategoryAndPrice, {
            category,
            minPrice,
            maxPrice,
            limit,
        });
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async findByBrand(brand: string, limit = 50): Promise<Product[]> {
        const docs = await this.client.query(api.products.getByBrand, {
            brand,
            limit,
        });
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async searchByTitle(
        query: string,
        filters?: { brand?: string; category?: string }
    ): Promise<Product[]> {
        const docs = await this.client.query(api.products.searchByTitle, {
            query,
            brand: filters?.brand,
            category: filters?.category,
        });
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async findSimilar(
        embedding: number[],
        limit = 10,
        filters?: { category?: string; brand?: string }
    ): Promise<Product[]> {
        const docs = await this.client.query(api.products.findSimilar, {
            embedding,
            limit,
            category: filters?.category,
            brand: filters?.brand,
        });
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async create(product: Omit<Product, "id">): Promise<Product> {
        const id = await this.client.mutation(api.products.create, {
            brand: product.brand,
            title: product.title,
            price: product.price,
            mrp: product.mrp,
            category: product.category,
            images: product.images,
            attributes: product.attributes,
            embedding: product.embedding,
            meta: product.meta,
            createdAt: product.createdAt ?? Date.now(),
            updatedAt: product.updatedAt ?? Date.now(),
        });
        return { ...product, id: id as string };
    }

    async update(id: string, data: Partial<Omit<Product, "id">>): Promise<Product> {
        await this.client.mutation(api.products.update, {
            id: id as Id<"products">,
            ...data,
            updatedAt: Date.now(),
        });
        const updated = await this.findById(id);
        if (!updated) throw new Error(`Product ${id} not found after update`);
        return updated;
    }

    async updateEmbedding(id: string, embedding: number[]): Promise<Product> {
        await this.client.mutation(api.products.updateEmbedding, {
            id: id as Id<"products">,
            embedding,
        });
        const updated = await this.findById(id);
        if (!updated) throw new Error(`Product ${id} not found after update`);
        return updated;
    }

    async delete(id: string): Promise<void> {
        await this.client.mutation(api.products.remove, {
            id: id as Id<"products">,
        });
    }

    // Map Convex document to domain entity
    private mapToEntity(doc: Record<string, unknown>): Product {
        return {
            id: (doc._id as string) || "",
            brand: (doc.brand as string) || "",
            title: (doc.title as string) || "",
            price: (doc.price as number) || 0,
            mrp: (doc.mrp as number) || 0,
            category: (doc.category as string) || "",
            images: (doc.images as string[]) || [],
            attributes: doc.attributes as ProductAttributes | undefined,
            embedding: doc.embedding as number[] | undefined,
            meta: doc.meta as Record<string, unknown> | undefined,
            createdAt: doc.createdAt as number | undefined,
            updatedAt: doc.updatedAt as number | undefined,
        };
    }
}
