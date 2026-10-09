import { v } from 'convex/values';

import { Id } from './_generated/dataModel';
import { query } from './_generated/server';

export const getProductsByIds = query({
    args: {
        ids: v.array(v.id('products')),
    },
    handler: async (ctx, args) => {
        if (args.ids.length === 0) return [];
        // ctx.db.get per id preserves vectorSearch rank order
        // (filter + collect does not).
        const products = await Promise.all(args.ids.map((id) => ctx.db.get(id)));

        return products.map((p) => {
            if (!p) return p;
            const { meta, ...rest } = p;
            let cleanMeta = meta;
            if (meta && meta.rawAttributes !== undefined) {
                const { rawAttributes, ...otherMeta } = meta;
                cleanMeta = otherMeta;
            }
            return {
                ...rest,
                ...(cleanMeta ? { meta: cleanMeta } : {}),
            };
        });
    },
});

export const getProductIdsFromEmbeddings = query({
    args: {
        ids: v.array(v.id('product_embeddings')),
    },
    handler: async (ctx, args) => {
        const docs = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
        return docs.map((d) => d?.productId).filter((id): id is Id<'products'> => id !== undefined);
    },
});

export const getEmbeddingByProductId = query({
    args: { productId: v.id('products') },
    handler: async (ctx, args) => {
        return await ctx.db.query('product_embeddings').withIndex('by_productId', (q) => q.eq('productId', args.productId)).first();
    },
});
