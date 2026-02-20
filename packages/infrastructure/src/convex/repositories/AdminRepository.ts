import type { Id } from '@app/convex';
import type { AdminRepository } from '@app/core';
import type { Product, AdminStats, PaginationOpts, PaginatedResult, ProductAttributes } from '@app/core';

import { api } from '@app/convex';
import { ConvexClient } from 'convex/browser';

export class ConvexAdminRepository implements AdminRepository {
    constructor(private client: ConvexClient) { }

    async getStats(): Promise<AdminStats> {
        return await this.client.query(api.admin.getStats, {});
    }

    async getScrapedProducts(paginationOpts: PaginationOpts): Promise<PaginatedResult<Product>> {
        const result = await this.client.query(api.admin.getScrapedProducts, { paginationOpts });
        return {
            page: result.page.map((doc: Record<string, unknown>) => this.mapToEntity(doc)),
            isDone: result.isDone,
            continueCursor: result.continueCursor,
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async searchProducts(query: string, _paginationOpts: PaginationOpts): Promise<PaginatedResult<Product>> {
        const result = await this.client.query(api.admin.searchProducts, { query });
        // searchProducts returns a flat array, wrap in PaginatedResult
        const products = (result as Record<string, unknown>[]).map((doc) => this.mapToEntity(doc));
        return {
            page: products,
            isDone: true,
            continueCursor: '',
        };
    }

    async retriggerScrape(productId: string): Promise<void> {
        await this.client.mutation(api.admin.retriggerScrape, {
            productId: productId as Id<'products'>,
        });
    }

    private mapToEntity(doc: Record<string, unknown>): Product {
        return {
            id: (doc._id as string) || '',
            brand: (doc.brand as string) || '',
            title: (doc.title as string) || '',
            price: (doc.price as number) || 0,
            mrp: (doc.mrp as number) || 0,
            category: (doc.category as string) || '',
            images: (doc.images as string[]) || [],
            attributes: doc.attributes as ProductAttributes | undefined,
            embedding: doc.embedding as number[] | undefined,
            meta: doc.meta as Record<string, unknown> | undefined,
            createdAt: (doc.createdAt as number) || (doc._creationTime as number),
            updatedAt: (doc.updatedAt as number) || (doc._creationTime as number),
        };
    }
}
