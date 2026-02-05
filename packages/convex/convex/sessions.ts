import { v } from 'convex/values';
import { components } from './_generated/api';
import { mutation, query } from './_generated/server';

const DEFAULT_PAGINATION = { numItems: 100, cursor: null };

export const getByToken = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const res = await ctx.runQuery(components.auth.api.findMany, {
            model: 'sessions',
            where: [{ field: 'token', operator: 'eq', value: args.token }],
            paginationOpts: DEFAULT_PAGINATION,
        });
        return res.page[0] || null;
    },
});

export const create = mutation({
    args: {
        userId: v.string(),
        token: v.string(),
        expiresAt: v.number(),
        ipAddress: v.optional(v.string()),
        userAgent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.runMutation(components.auth.api.create, {
            input: {
                model: 'sessions',
                data: {
                    ...args,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                },
            },
        });
    },
});

export const remove = mutation({
    args: { id: v.string() },
    handler: async (ctx, args) => {
        await ctx.runMutation(components.auth.api.deleteOne, {
            input: {
                model: 'sessions',
                where: [{ field: '_id', operator: 'eq', value: args.id }],
            },
        });
    },
});
