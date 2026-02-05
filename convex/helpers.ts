import { v } from 'convex/values';
import { query } from './_generated/server';

export const getProductsByIds = query({
    args: {
        ids: v.array(v.id('products')),
    },
    handler: async (ctx, args) => {
        if (args.ids.length === 0) return [];
        return await ctx.db
            .query('products')
            .filter((q) =>
                args.ids.length === 1
                    ? q.eq(q.field('_id'), args.ids[0])
                    : q.or(...args.ids.map((id) => q.eq(q.field('_id'), id)))
            )
            .collect();
    },
});
