import { v } from 'convex/values';

import { components } from './_generated/api';
import { mutation, query } from './_generated/server';

// -----------------------------------------------------------------------------
// FEEDBACK MUTATIONS
// -----------------------------------------------------------------------------

export const create = mutation({
    args: {
        name: v.string(),
        contact: v.string(),
        type: v.string(),
        message: v.string(),
        attachment: v.optional(v.id('_storage')),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Unauthenticated');
        }

        const userId = identity.subject;

        await ctx.db.insert('feedback', {
            userId,
            ...args,
            status: 'Open',
            replies: [],
            updatedAt: Date.now(),
            createdAt: Date.now(),
        });
    },
});

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

// -----------------------------------------------------------------------------
// FEEDBACK QUERIES (USER)
// -----------------------------------------------------------------------------

export const listByUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const userId = identity.subject;

        return await ctx.db
            .query('feedback')
            .withIndex('by_user', (q) => q.eq('userId', userId))
            .order('desc')
            .collect();
    },
});

// -----------------------------------------------------------------------------
// ADMIN MUTATIONS & QUERIES
// -----------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureCoreAdmin(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');

    const user = await ctx.runQuery(components.auth.api.getCurrentUserWithPermissions, {
        subject: identity.subject,
        email: identity.email,
    });

    if (!user?.isCoreAdmin) {
        throw new Error('Unauthorized: Core Admin access required');
    }
    return user;
}

export const list = query({
    args: {
        status: v.optional(v.string()),
        search: v.optional(v.string()),
        paginationOpts: v.any(),
    },
    handler: async (ctx, args) => {
        await ensureCoreAdmin(ctx);

        if (args.search) {
            let query;
            if (args.status) {
                // If specific status requested
                query = ctx.db
                    .query("feedback")
                    .withSearchIndex("search_message", (q) =>
                        q.search("message", args.search!).eq("status", args.status!)
                    );
            } else {
                // Search global
                query = ctx.db
                    .query("feedback")
                    .withSearchIndex("search_message", (q) =>
                        q.search("message", args.search!)
                    );
            }
            return await query.paginate(args.paginationOpts);
        }

        const baseQuery = ctx.db.query('feedback');
        let query;

        if (args.status) {
            query = baseQuery.withIndex('by_status', (q) => q.eq('status', args.status!));
        } else {
            query = baseQuery.withIndex('by_created');
        }

        return await query.order('desc').paginate(args.paginationOpts);
    },
});

export const reply = mutation({
    args: {
        id: v.id('feedback'),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await ensureCoreAdmin(ctx);

        const feedback = await ctx.db.get(args.id);
        if (!feedback) {
            throw new Error('Feedback not found');
        }

        await ctx.db.patch(args.id, {
            replies: [
                ...feedback.replies,
                {
                    adminId: admin._id || admin.id,
                    message: args.message,
                    timestamp: Date.now(),
                },
            ],
            status: 'Replied',
            updatedAt: Date.now(),
        });
    },
});

export const updateStatus = mutation({
    args: {
        id: v.id('feedback'),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        await ensureCoreAdmin(ctx);

        const feedback = await ctx.db.get(args.id);
        if (!feedback) {
            throw new Error('Feedback not found');
        }

        await ctx.db.patch(args.id, {
            status: args.status,
            updatedAt: Date.now(),
        });
    },
});
