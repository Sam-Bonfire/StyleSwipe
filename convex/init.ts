import { v } from 'convex/values';

import { components } from './_generated/api';
import { mutation } from './_generated/server';

const DEFAULT_PAGINATION = { numItems: 100, cursor: null };

/**
 * Initialize StyleSwipe organizations
 * Workaround: Using direct DB inserts to bypass adapter's unique field check crash.
 * This preserves the user's preferred plural naming while unblocking initialization.
 */
export const initializeOrganizations = mutation({
  handler: async (ctx) => {
    // Fetch all organizations to check for existence
    const orgsRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'organizations',
      paginationOpts: DEFAULT_PAGINATION,
    });
    const allOrgs = orgsRes.page;

    // 1. Check for StyleSwipe Core Organization
    const coreOrg = allOrgs.find((o: any) => o.slug === 'styleswipe-core');
    if (!coreOrg) {
      // Workaround: Use direct DB insert as the component adapter may crash on unique checks for plural tables
      await ctx.db.insert('organizations' as any, {
        name: 'StyleSwipe Core',
        slug: 'styleswipe-core',
        createdAt: Date.now(),
        metadata: JSON.stringify({ type: 'core' }),
      });
    }

    // 2. Check for StyleSwipe Customers Organization
    const customerOrg = allOrgs.find((o: any) => o.slug === 'styleswipe-customers');
    if (!customerOrg) {
      await ctx.db.insert('organizations' as any, {
        name: 'StyleSwipe Customers',
        slug: 'styleswipe-customers',
        createdAt: Date.now(),
        metadata: JSON.stringify({ type: 'customer' }),
      });
    }
  },
});

export const assignCoreAdmin = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Find User
    const users = await ctx.runQuery(components.auth.api.findMany, {
      model: 'users',
      where: [{ field: 'email', operator: 'eq' as any, value: args.email }],
      paginationOpts: DEFAULT_PAGINATION,
    });
    const user = users.page[0];
    if (!user) throw new Error(`User with email ${args.email} not found`);

    // 2. Find Core Org
    const orgsRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'organizations',
      paginationOpts: DEFAULT_PAGINATION,
    });
    const coreOrg = orgsRes.page.find((o: any) => o.slug === 'styleswipe-core');
    if (!coreOrg)
      throw new Error('Core organization not found. Run initializeOrganizations first.');

    // 3. Check if member exists
    const membersRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'members',
      paginationOpts: DEFAULT_PAGINATION,
    });
    const existingMember = membersRes.page.find(
      (m: any) => m.userId === user.id && m.organizationId === (coreOrg.id || coreOrg._id),
    );

    if (existingMember) {
      // Update role
      await ctx.runMutation(components.auth.api.updateOne, {
        input: {
          model: 'members',
          where: [{ field: '_id', operator: 'eq' as any, value: existingMember.id }],
          update: { role: 'admin' },
        },
      });
    } else {
      // Create member via direct insert to avoid crash
      await ctx.db.insert('members' as any, {
        userId: user.id || user._id,
        organizationId: coreOrg.id || coreOrg._id,
        role: 'admin',
        createdAt: Date.now(),
      });
    }

    return 'Success';
  },
});
