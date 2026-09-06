import { v } from 'convex/values';

import { query, mutation } from './_generated/server';

export const getById = query({
  args: { id: v.id('categories') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('categories')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first();
  },
});

export const listTree = query({
  args: {},
  handler: async (ctx) => {
    // Return all categories; assembling tree logic typically happens in domain/app layer
    return await ctx.db.query('categories').collect();
  },
});

export const listRootCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('categories')
      .filter((q) => q.eq(q.field('level'), 0)) // or check parentId undefined
      .collect();
  },
});

export const save = mutation({
  args: {
    id: v.optional(v.id('categories')),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.id('categories')),
    level: v.number(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    if (id) {
      await ctx.db.patch(id, data);
      return id;
    } else {
      return await ctx.db.insert('categories', data);
    }
  },
});

export const listByParent = query({
  args: { parentId: v.optional(v.id('categories')) },
  handler: async (ctx, args) => {
    if (args.parentId === undefined) {
      return await ctx.db
        .query('categories')
        .filter((q) => q.eq(q.field('parentId'), undefined))
        .collect();
    }
    return await ctx.db
      .query('categories')
      .withIndex('by_parent', (q) => q.eq('parentId', args.parentId!))
      .collect();
  },
});

export const remove = mutation({
  args: { id: v.id('categories') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
