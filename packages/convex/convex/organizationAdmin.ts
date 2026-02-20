/* eslint-disable @typescript-eslint/no-explicit-any */
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';

import { components } from './_generated/api';
import { mutation, query } from './_generated/server';
import { isCoreOrgAdmin, requireCoreAdmin } from './permissions';

const DEFAULT_PAGINATION = { numItems: 100, cursor: null };

/**
 * List all users with their organization memberships
 * Admin only
 */
export const listUsersWithOrgs = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    // Get current user and check admin status
    await requireCoreAdmin(ctx);

    // Paginate users at the app level (components can't use paginate)
    const usersRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'users',
      where: [],
      paginationOpts: args.paginationOpts,
    });

    const users = usersRes.page;

    // Fetch memberships for each user
    const usersWithMemberships = await Promise.all(
      users.map(async (user: any) => {
        const membershipsRes = await ctx.runQuery(components.auth.api.findMany, {
          model: 'members',
          where: [{ field: 'userId', operator: 'eq', value: user._id }],
          paginationOpts: { numItems: 100, cursor: null },
        });

        const memberships = membershipsRes.page;

        const membershipDetails = await Promise.all(
          memberships.map(async (membership: any) => {
            const org = await ctx.runQuery(components.auth.api.findOne, {
              model: 'organizations',
              where: [{ field: '_id', operator: 'eq', value: membership.organizationId }],
            });
            return {
              ...membership,
              organization: org,
            };
          }),
        );

        return {
          ...user,
          memberships: membershipDetails,
        };
      }),
    );

    return {
      ...usersRes,
      page: usersWithMemberships,
    };
  },
});

/**
 * Update user details
 * Admin only
 */
export const updateUserDetails = mutation({
  args: {
    userId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, { userId, name, email, image }) => {
    await requireCoreAdmin(ctx);

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (image !== undefined) updates.image = image;
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = Date.now();
      await ctx.runMutation(components.auth.api.updateOne, {
        input: {
          model: 'users',
          where: [{ field: '_id', operator: 'eq', value: userId }],
          update: updates,
        },
      });
    }

    return { success: true };
  },
});

/**
 * List all organizations with member counts
 * Admin only
 */
export const listOrganizationsWithMembers = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireCoreAdmin(ctx);

    // Paginate organizations at the app level
    const orgsRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'organizations',
      where: [],
      paginationOpts: args.paginationOpts,
    });

    const orgs = orgsRes.page;

    // Fetch member counts for each organization
    const orgsWithDetails = await Promise.all(
      orgs.map(async (org: any) => {
        const membersRes = await ctx.runQuery(components.auth.api.findMany, {
          model: 'members',
          where: [{ field: 'organizationId', operator: 'eq', value: org._id }],
          paginationOpts: { numItems: 1000, cursor: null },
        });

        const members = membersRes.page;

        return {
          ...org,
          memberCount: members.length,
          members: members.slice(0, 5), // Only return a snippet
        };
      }),
    );

    return {
      ...orgsRes,
      page: orgsWithDetails,
    };
  },
});

/**
 * Get organization members
 * Admin only
 */
export const getOrganizationMembers = query({
  args: {
    organizationId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireCoreAdmin(ctx);

    // Paginate members at the app level
    const membersRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'members',
      where: [{ field: 'organizationId', operator: 'eq', value: args.organizationId }],
      paginationOpts: args.paginationOpts,
    });

    const members = membersRes.page;

    // Fetch user details for each member
    const membersWithUsers = await Promise.all(
      members.map(async (member: any) => {
        const user = await ctx.runQuery(components.auth.api.findOne, {
          model: 'users',
          where: [{ field: '_id', operator: 'eq', value: member.userId }],
        });
        return {
          ...member,
          user,
        };
      }),
    );

    return {
      ...membersRes,
      page: membersWithUsers,
    };
  },
});

/**
 * Update member role
 * Admin only
 */
export const updateMemberRole = mutation({
  args: {
    memberId: v.string(),
    role: v.string(),
  },
  handler: async (ctx, { memberId, role }) => {
    await requireCoreAdmin(ctx);

    await ctx.runMutation(components.auth.api.updateOne, {
      input: {
        model: 'members', // Plural
        where: [{ field: '_id', operator: 'eq', value: memberId }],
        update: { role },
      },
    });

    return { success: true };
  },
});

/**
 * Remove member from organization
 * Admin only
 */
export const removeMemberFromOrg = mutation({
  args: {
    memberId: v.string(),
  },
  handler: async (ctx, { memberId }) => {
    await requireCoreAdmin(ctx);

    await ctx.runMutation(components.auth.api.deleteOne, {
      input: {
        model: 'members', // Plural
        where: [{ field: '_id', operator: 'eq', value: memberId }],
      },
    });

    return { success: true };
  },
});

/**
 * List all roles for organization
 * Admin only
 */
export const listOrganizationRoles = query({
  args: { organizationId: v.string() },
  handler: async (ctx, { organizationId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const isAdmin = await isCoreOrgAdmin(ctx, identity.subject);
    if (!isAdmin) {
      throw new Error('Unauthorized');
    }

    const rolesRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'organizationRoles', // Plural
      where: [{ field: 'organizationId', operator: 'eq', value: organizationId }],
      paginationOpts: DEFAULT_PAGINATION,
    });
    const roles = rolesRes.page;

    // Group by role name
    const roleMap = new Map<string, typeof roles>();
    roles.forEach((role: any) => {
      const existing = roleMap.get(role.role) || [];
      roleMap.set(role.role, [...existing, role]);
    });

    return Array.from(roleMap.entries()).map(([roleName, permissions]) => ({
      name: roleName,
      permissions,
    }));
  },
});

export const createCustomRole = mutation({
  args: {
    organizationId: v.string(),
    roleName: v.string(),
    permissions: v.array(
      v.object({
        resource: v.string(),
        action: v.string(),
      }),
    ),
  },
  handler: async (ctx, { organizationId, roleName, permissions }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const isAdmin = await isCoreOrgAdmin(ctx, identity.subject);
    if (!isAdmin) throw new Error('Unauthorized');

    for (const perm of permissions) {
      await ctx.runMutation(components.auth.api.create, {
        input: {
          model: 'organizationRoles', // Plural
          data: {
            organizationId,
            role: roleName,
            permission: `${perm.resource}:${perm.action}`,
            createdAt: Date.now(),
          },
        },
      });
    }
    return { success: true };
  },
});

export const deleteCustomRole = mutation({
  args: {
    organizationId: v.string(),
    roleName: v.string(),
  },
  handler: async (ctx, { organizationId, roleName }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const isAdmin = await isCoreOrgAdmin(ctx, identity.subject);
    if (!isAdmin) throw new Error('Unauthorized');

    // Find IDs to delete
    const rolesRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'organizationRoles', // Plural
      where: [
        { field: 'organizationId', operator: 'eq', value: organizationId },
        { field: 'role', operator: 'eq', value: roleName },
      ],
      paginationOpts: DEFAULT_PAGINATION,
    });
    const roles = rolesRes.page;

    for (const role of roles) {
      await ctx.runMutation(components.auth.api.deleteOne, {
        input: {
          model: 'organizationRoles', // Plural
          where: [{ field: '_id', operator: 'eq', value: role._id }],
        },
      });
    }

    return { success: true };
  },
});

/**
 * Search users by name or email
 * Admin only
 */
export const searchUsers = query({
  args: {
    query: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireCoreAdmin(ctx);

    if (!args.query || args.query.trim() === '') {
      return { page: [], isDone: true, continueCursor: '' };
    }

    const searchLower = args.query.toLowerCase();
    const usersRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'users',
      where: [],
      paginationOpts: { numItems: 100, cursor: null },
    });

    const filteredUsers = usersRes.page.filter(
      (user: any) =>
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower),
    );

    const usersWithMemberships = await Promise.all(
      filteredUsers.map(async (user: any) => {
        const membershipsRes = await ctx.runQuery(components.auth.api.findMany, {
          model: 'members',
          where: [{ field: 'userId', operator: 'eq', value: user._id }],
          paginationOpts: { numItems: 100, cursor: null },
        });

        const membershipDetails = await Promise.all(
          membershipsRes.page.map(async (membership: any) => {
            const org = await ctx.runQuery(components.auth.api.findOne, {
              model: 'organizations',
              where: [{ field: '_id', operator: 'eq', value: membership.organizationId }],
            });
            return { ...membership, organization: org };
          }),
        );

        return { ...user, memberships: membershipDetails };
      }),
    );

    return { page: usersWithMemberships, isDone: true, continueCursor: '' };
  },
});

/**
 * Search organizations by name or slug
 */
export const searchOrganizations = query({
  args: {
    query: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireCoreAdmin(ctx);

    if (!args.query || args.query.trim() === '') {
      return { page: [], isDone: true, continueCursor: '' };
    }

    const searchLower = args.query.toLowerCase();
    const orgsRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'organizations',
      where: [],
      paginationOpts: { numItems: 100, cursor: null },
    });

    const filteredOrgs = orgsRes.page.filter(
      (org: any) =>
        org.name?.toLowerCase().includes(searchLower) ||
        org.slug?.toLowerCase().includes(searchLower),
    );

    const orgsWithDetails = await Promise.all(
      filteredOrgs.map(async (org: any) => {
        const membersRes = await ctx.runQuery(components.auth.api.findMany, {
          model: 'members',
          where: [{ field: 'organizationId', operator: 'eq', value: org._id }],
          paginationOpts: { numItems: 1000, cursor: null },
        });

        return {
          ...org,
          memberCount: membersRes.page.length,
          members: membersRes.page.slice(0, 5),
        };
      }),
    );

    return { page: orgsWithDetails, isDone: true, continueCursor: '' };
  },
});

/**
 * Update organization details
 */
export const updateOrganization = mutation({
  args: {
    id: v.string(),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    logo: v.optional(v.string()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, { id, name, slug, logo, metadata }) => {
    await requireCoreAdmin(ctx);

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (logo !== undefined) updates.logo = logo;
    if (metadata !== undefined) updates.metadata = metadata;

    if (Object.keys(updates).length > 0) {
      await ctx.runMutation(components.auth.api.updateOne, {
        input: {
          model: 'organizations',
          where: [{ field: '_id', operator: 'eq', value: id }],
          update: updates,
        },
      });
    }

    return { success: true };
  },
});
