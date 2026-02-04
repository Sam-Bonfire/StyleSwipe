import { v } from 'convex/values';

import { components } from './_generated/api';
import { mutation } from './_generated/server';

const DEFAULT_PAGINATION = { numItems: 100, cursor: null };

/**
 * Initialize StyleSwipe organizations
 * Workaround: Using direct DB inserts to bypass adapter's unique field check crash.
 * This preserves the user's preferred plural naming while unblocking initialization.
 */
/**
 * Initialize StyleSwipe organizations using the auth component API
 */
export const initializeOrganizations = mutation({
  handler: async (ctx) => {
    // Fetch all organizations via component API
    const orgsRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'organizations',
      paginationOpts: DEFAULT_PAGINATION,
    });
    const allOrgs = orgsRes.page;

    // 1. Check for StyleSwipe Core Organization
    const coreOrg = allOrgs.find((o: any) => o.slug === 'styleswipe-core');
    if (!coreOrg) {
      await ctx.runMutation(components.auth.api.create, {
        input: {
          model: 'organizations',
          data: {
            name: 'StyleSwipe Core',
            slug: 'styleswipe-core',
            createdAt: Date.now(),
            metadata: JSON.stringify({ type: 'core' }),
          },
        },
      });
    }

    // 2. Check for StyleSwipe Customers Organization
    const customerOrg = allOrgs.find((o: any) => o.slug === 'styleswipe-customers');
    if (!customerOrg) {
      await ctx.runMutation(components.auth.api.create, {
        input: {
          model: 'organizations',
          data: {
            name: 'StyleSwipe Customers',
            slug: 'styleswipe-customers',
            createdAt: Date.now(),
            metadata: JSON.stringify({ type: 'customer' }),
          },
        },
      });
    }
  },
});

export const assignCoreAdmin = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Find User via component
    const users = await ctx.runQuery(components.auth.api.findMany, {
      model: 'users',
      where: [{ field: 'email', operator: 'eq' as any, value: args.email }],
      paginationOpts: DEFAULT_PAGINATION,
    });
    const user = users.page[0];
    if (!user) throw new Error(`User with email ${args.email} not found`);

    // 2. Find Core Org via component
    const orgsRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'organizations',
      where: [{ field: 'slug', operator: 'eq', value: 'styleswipe-core' }],
      paginationOpts: DEFAULT_PAGINATION,
    });
    const coreOrg = orgsRes.page[0];
    if (!coreOrg)
      throw new Error('Core organization not found. Run initializeOrganizations first.');

    // 3. Check if member exists via component
    const membersRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'members',
      where: [
        { field: 'userId', operator: 'eq', value: user._id },
        { field: 'organizationId', operator: 'eq', value: coreOrg._id },
      ],
      paginationOpts: DEFAULT_PAGINATION,
    });
    const existingMember = membersRes.page[0];

    if (existingMember) {
      // Update role via component
      await ctx.runMutation(components.auth.api.updateOne, {
        input: {
          model: 'members',
          where: [{ field: '_id', operator: 'eq' as any, value: existingMember._id }],
          update: { role: 'admin' },
        },
      });
    } else {
      // Create member via component
      await ctx.runMutation(components.auth.api.create, {
        input: {
          model: 'members',
          data: {
            userId: user._id,
            organizationId: coreOrg._id,
            role: 'admin',
            createdAt: Date.now(),
          },
        },
      });
    }

    return 'Success';
  },
});
