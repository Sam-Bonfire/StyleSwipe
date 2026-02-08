import { v } from 'convex/values';

import { components } from './_generated/api';
import { query, mutation } from './_generated/server';

const DEFAULT_PAGINATION = { numItems: 100, cursor: null };

export const getById = query({
  args: { id: v.string() }, // Was v.id
  handler: async (ctx, args) => {
    const res = await ctx.runQuery(components.auth.api.findMany, {
      model: 'organizations', // Plural
      where: [{ field: '_id', operator: 'eq', value: args.id }],
      paginationOpts: DEFAULT_PAGINATION,
    });
    return res.page[0] || null;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const res = await ctx.runQuery(components.auth.api.findMany, {
      model: 'organizations', // Plural
      where: [{ field: 'slug', operator: 'eq', value: args.slug }],
      paginationOpts: DEFAULT_PAGINATION,
    });
    return res.page[0] || null;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    logo: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        type: v.optional(v.union(v.literal('influencer_agency'), v.literal('brand_partner'))),
        website: v.optional(v.string()),
        description: v.optional(v.string()),
      }),
    ),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.auth.api.create, {
      input: {
        model: 'organizations', // Plural
        data: {
          name: args.name,
          slug: args.slug,
          logo: args.logo,
          metadata: args.metadata ? JSON.stringify(args.metadata) : undefined,
          createdAt: args.createdAt,
        },
      },
    });
  },
});

export const update = mutation({
  args: {
    id: v.string(),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    logo: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        type: v.optional(v.union(v.literal('influencer_agency'), v.literal('brand_partner'))),
        website: v.optional(v.string()),
        description: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const data: any = {};
    if (updates.name) data.name = updates.name;
    if (updates.slug) data.slug = updates.slug;
    if (updates.logo) data.logo = updates.logo;
    if (updates.metadata) data.metadata = JSON.stringify(updates.metadata);

    await ctx.runMutation(components.auth.api.updateOne, {
      input: {
        model: 'organizations', // Plural
        where: [{ field: '_id', operator: 'eq', value: id }],
        update: data,
      },
    });
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    await ctx.runMutation(components.auth.api.deleteOne, {
      input: {
        model: 'organizations', // Plural
        where: [{ field: '_id', operator: 'eq', value: args.id }],
      },
    });
  },
});
