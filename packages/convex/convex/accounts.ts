import { v } from 'convex/values';
import { components } from './_generated/api';
import { mutation, query } from './_generated/server';

const DEFAULT_PAGINATION = { numItems: 100, cursor: null };

export const getById = query({
    args: { id: v.string() },
    handler: async (ctx, args) => {
        const res = await ctx.runQuery(components.auth.api.findMany, {
            model: 'accounts',
            where: [{ field: '_id', operator: 'eq', value: args.id }],
            paginationOpts: DEFAULT_PAGINATION,
        });
        return res.page[0] || null;
    },
});

export const getByProvider = query({
    args: { providerId: v.string(), accountId: v.string() },
    handler: async (ctx, args) => {
        const res = await ctx.runQuery(components.auth.api.findMany, {
            model: 'accounts',
            where: [
                { field: 'providerId', operator: 'eq', value: args.providerId },
                { field: 'accountId', operator: 'eq', value: args.accountId },
            ],
            paginationOpts: DEFAULT_PAGINATION,
        });
        return res.page[0] || null;
    },
});

export const create = mutation({
    args: {
        userId: v.string(),
        providerId: v.string(),
        accountId: v.string(),
        accessToken: v.optional(v.string()),
        refreshToken: v.optional(v.string()),
        idToken: v.optional(v.string()),
        expiresAt: v.optional(v.number()),
        password: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.runMutation(components.auth.api.create, {
            input: {
                model: 'accounts',
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
                model: 'accounts',
                where: [{ field: '_id', operator: 'eq', value: args.id }],
            },
        });
    },
});
