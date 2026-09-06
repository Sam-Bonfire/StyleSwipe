import { v } from 'convex/values';

import { components } from './_generated/api';
import { mutation, query } from './_generated/server';

const DEFAULT_PAGINATION = { numItems: 100, cursor: null };

export const getByIdentifier = query({
    args: { identifier: v.string() },
    handler: async (ctx, args) => {
        const res = await ctx.runQuery(components.auth.api.findMany, {
            model: 'verifications',
            where: [{ field: 'identifier', operator: 'eq', value: args.identifier }],
            paginationOpts: DEFAULT_PAGINATION,
        });
        return res.page[0] || null;
    },
});

export const getByToken = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const res = await ctx.runQuery(components.auth.api.findMany, {
            model: 'verifications',
            where: [{ field: 'token', operator: 'eq', value: args.token }],
            paginationOpts: DEFAULT_PAGINATION,
        });
        return res.page[0] || null;
    },
});

export const create = mutation({
    args: {
        identifier: v.string(),
        token: v.string(),
        expiresAt: v.number(),
        type: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.runMutation(components.auth.api.create, {
            input: {
                model: 'verifications',
                data: {
                    ...args,
                    value: args.identifier,
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
                model: 'verifications',
                where: [{ field: '_id', operator: 'eq', value: args.id }],
            },
        });
    },
});

export const removeByIdentifier = mutation({
    args: { identifier: v.string() },
    handler: async (ctx, args) => {
        await ctx.runMutation(components.auth.api.deleteOne, {
            input: {
                model: 'verifications',
                where: [{ field: 'identifier', operator: 'eq', value: args.identifier }],
            },
        });
    },
});

export const deleteExpired = mutation({
    args: { now: v.number() },
    handler: async () => {
        // Component should ideally handle its own cleanup, 
        // but we provide a placeholder to satisfy the repository.
        return 0;
    },
});
