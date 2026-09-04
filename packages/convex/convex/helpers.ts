import { v } from 'convex/values';
import { query } from './_generated/server';
import { Id } from './_generated/dataModel';

export const getProductsByIds = query({
    args: {
        ids: v.array(v.id('products')),
    },
    handler: async (ctx, args) => {
        if (args.ids.length === 0) return [];
        const products = await ctx.db
            .query('products')
            .filter((q) =>
                args.ids.length === 1
                    ? q.eq(q.field('_id'), args.ids[0])
                    : q.or(...args.ids.map((id) => q.eq(q.field('_id'), id)))
            )
            .collect();

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
