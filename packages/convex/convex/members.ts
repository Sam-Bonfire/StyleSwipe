import { v } from 'convex/values';

import { components } from './_generated/api';
import { query, mutation } from './_generated/server';

const DEFAULT_PAGINATION = { numItems: 100, cursor: null };

export const getById = query({
  args: { id: v.string() }, // Was v.id("members")
  handler: async (ctx, args) => {
    const res = await ctx.runQuery(components.auth.api.findMany, {
      model: 'members', // Plural
      where: [{ field: '_id', operator: 'eq', value: args.id }],
      paginationOpts: DEFAULT_PAGINATION,
    });
    return res.page[0] || null;
  },
});

export const removeByOrg = mutation({
  args: { orgId: v.string() }, // Was v.id("organizations")
  handler: async (ctx, args) => {
    const membersRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'members', // Plural
      where: [{ field: 'organizationId', operator: 'eq', value: args.orgId }],
      paginationOpts: DEFAULT_PAGINATION,
    });

    for (const member of membersRes.page) {
      await ctx.runMutation(components.auth.api.deleteOne, {
        input: {
          model: 'members', // Plural
          where: [{ field: '_id', operator: 'eq', value: member.id }],
        },
      });
    }
  },
});

export const create = mutation({
  args: {
    orgId: v.string(),
    userId: v.string(),
    role: v.union(
      v.literal('admin'),
      v.literal('member'),
      v.literal('influencer'),
      v.literal('brand_manager'),
    ),
    joinedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { orgId, userId, role, joinedAt } = args;
    return await ctx.runMutation(components.auth.api.create, {
      input: {
        model: 'members', // Plural
        data: {
          organizationId: orgId,
          userId: userId,
          role: role,
          createdAt: joinedAt,
        },
      },
    });
  },
});

export const getByOrg = query({
  args: { orgId: v.string() },
  handler: async (ctx, args) => {
    const res = await ctx.runQuery(components.auth.api.findMany, {
      model: 'members', // Plural
      where: [{ field: 'organizationId', operator: 'eq', value: args.orgId }],
      paginationOpts: DEFAULT_PAGINATION,
    });
    return res.page;
  },
});

export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const res = await ctx.runQuery(components.auth.api.findMany, {
      model: 'members', // Plural
      where: [{ field: 'userId', operator: 'eq', value: args.userId }],
      paginationOpts: DEFAULT_PAGINATION,
    });
    return res.page;
  },
});

export const getByOrgAndUser = query({
  args: { orgId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const res = await ctx.runQuery(components.auth.api.findMany, {
      model: 'members', // Plural
      where: [
        { field: 'organizationId', operator: 'eq', value: args.orgId },
        { field: 'userId', operator: 'eq', value: args.userId },
      ],
      paginationOpts: DEFAULT_PAGINATION,
    });
    return res.page[0] || null;
  },
});

export const updateRole = mutation({
  args: {
    id: v.string(),
    role: v.union(
      v.literal('admin'),
      v.literal('member'),
      v.literal('influencer'),
      v.literal('brand_manager'),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(components.auth.api.updateOne, {
      input: {
        model: 'members', // Plural
        where: [{ field: '_id', operator: 'eq', value: args.id }],
        update: { role: args.role },
      },
    });
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    await ctx.runMutation(components.auth.api.deleteOne, {
      input: {
        model: 'members', // Plural
        where: [{ field: '_id', operator: 'eq', value: args.id }],
      },
    });
  },
});
