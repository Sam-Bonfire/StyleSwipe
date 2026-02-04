import { v } from 'convex/values';

import { components } from './_generated/api';
import { mutation, query } from './_generated/server';
import { isCoreOrgMember } from './permissions';

const DEFAULT_PAGINATION = { numItems: 100, cursor: null };

/**
 * List all users with their organization memberships
 * Admin only
 */
export const listUsersWithOrgs = query({
  handler: async (ctx) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    // Check if user is core org member
    const isCoreUser = await isCoreOrgMember(ctx, identity.subject);
    if (!isCoreUser) {
      throw new Error('Unauthorized: Only core organization members can access user management');
    }

    // Get all users from Component
    const usersRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'users',
      paginationOpts: DEFAULT_PAGINATION,
    });
    const users = usersRes.page;

    // Get memberships for each user
    const usersWithMemberships = await Promise.all(
      users.map(async (user: any) => {
        const membershipsRes = await ctx.runQuery(components.auth.api.findMany, {
          model: 'members', // Plural
          where: [{ field: 'userId', operator: 'eq', value: user.id }],
          paginationOpts: DEFAULT_PAGINATION,
        });
        const memberships = membershipsRes.page;

        const membershipDetails = await Promise.all(
          memberships.map(async (membership: any) => {
            const orgsRes = await ctx.runQuery(components.auth.api.findMany, {
              model: 'organizations', // Plural
              where: [{ field: '_id', operator: 'eq', value: membership.organizationId }],
              paginationOpts: DEFAULT_PAGINATION,
            });
            return {
              ...membership,
              organization: orgsRes.page[0],
            };
          }),
        );

        return {
          ...user,
          memberships: membershipDetails,
        };
      }),
    );

    return usersWithMemberships;
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
  },
  handler: async (ctx, { userId, name, email }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const isCoreUser = await isCoreOrgMember(ctx, identity.subject);
    if (!isCoreUser) {
      throw new Error('Unauthorized');
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
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
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const isCoreUser = await isCoreOrgMember(ctx, identity.subject);
    if (!isCoreUser) {
      throw new Error('Unauthorized');
    }

    const orgsRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'organizations', // Plural
      paginationOpts: DEFAULT_PAGINATION,
    });
    const orgs = orgsRes.page;

    const orgsWithDetails = await Promise.all(
      orgs.map(async (org: any) => {
        const membersRes = await ctx.runQuery(components.auth.api.findMany, {
          model: 'members', // Plural
          where: [{ field: 'organizationId', operator: 'eq', value: org.id }],
          paginationOpts: DEFAULT_PAGINATION,
        });
        const members = membersRes.page;

        return {
          ...org,
          memberCount: members.length,
          members,
        };
      }),
    );

    return orgsWithDetails;
  },
});

/**
 * Get organization members
 * Admin only
 */
export const getOrganizationMembers = query({
  args: { organizationId: v.string() },
  handler: async (ctx, { organizationId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const isCoreUser = await isCoreOrgMember(ctx, identity.subject);
    if (!isCoreUser) {
      throw new Error('Unauthorized');
    }

    const membersRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'members', // Plural
      where: [{ field: 'organizationId', operator: 'eq', value: organizationId }],
      paginationOpts: DEFAULT_PAGINATION,
    });
    const members = membersRes.page;

    const membersWithUsers = await Promise.all(
      members.map(async (member: any) => {
        const usersRes = await ctx.runQuery(components.auth.api.findMany, {
          model: 'users',
          where: [{ field: '_id', operator: 'eq', value: member.userId }],
          paginationOpts: DEFAULT_PAGINATION,
        });
        return {
          ...member,
          user: usersRes.page[0],
        };
      }),
    );

    return membersWithUsers;
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const isCoreUser = await isCoreOrgMember(ctx, identity.subject);
    if (!isCoreUser) {
      throw new Error('Unauthorized');
    }

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const isCoreUser = await isCoreOrgMember(ctx, identity.subject);
    if (!isCoreUser) {
      throw new Error('Unauthorized');
    }

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

    const isCoreUser = await isCoreOrgMember(ctx, identity.subject);
    if (!isCoreUser) {
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
    const isCoreUser = await isCoreOrgMember(ctx, identity.subject);
    if (!isCoreUser) throw new Error('Unauthorized');

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
    const isCoreUser = await isCoreOrgMember(ctx, identity.subject);
    if (!isCoreUser) throw new Error('Unauthorized');

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
          where: [{ field: '_id', operator: 'eq', value: role.id }],
        },
      });
    }

    return { success: true };
  },
});
