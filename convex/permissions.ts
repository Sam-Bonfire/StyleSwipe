import { components } from './_generated/api';
import { MutationCtx, QueryCtx } from './_generated/server';

const DEFAULT_PAGINATION = { numItems: 100, cursor: null };

/**
 * Check if user is a member of the core organization
 */
export const isCoreOrgMember = async (
  ctx: QueryCtx | MutationCtx,
  userId: string,
): Promise<boolean> => {
  // Get permissions via optimized component query
  const perms = await ctx.runQuery(components.auth.api.getCorePermissions, {
    userId,
  });

  return perms.isMember;
};

/**
 * Check if user is an admin or owner of the core organization
 */
export const isCoreOrgAdmin = async (
  ctx: QueryCtx | MutationCtx,
  userId: string,
): Promise<boolean> => {
  // Get permissions via optimized component query
  const perms = await ctx.runQuery(components.auth.api.getCorePermissions, {
    userId,
  });

  return perms.isAdmin;
};

/**
 * Throws an error if the current user is not a core admin
 */
export const requireCoreAdmin = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Not authenticated');

  const isAdmin = await isCoreOrgAdmin(ctx, identity.subject);
  if (!isAdmin) {
    throw new Error('Unauthorized: Only core organization admins can perform this action');
  }
  return identity;
};

/**
 * Get user's role in organization
 */
export const getUserRole = async (
  ctx: QueryCtx | MutationCtx,
  userId: string,
  organizationId: string,
): Promise<string | null> => {
  const members = await ctx.runQuery(components.auth.api.findMany, {
    model: 'members',
    where: [
      { field: 'userId', operator: 'eq', value: userId },
      { field: 'organizationId', operator: 'eq', value: organizationId },
    ],
    paginationOpts: DEFAULT_PAGINATION,
  });

  return members.page.length > 0 ? members.page[0].role : null;
};

/**
 * Check if user is admin or owner in organization
 */
export const isAdminOrOwner = async (
  ctx: QueryCtx | MutationCtx,
  userId: string,
  organizationId: string,
): Promise<boolean> => {
  const role = await getUserRole(ctx, userId, organizationId);
  return role === 'admin' || role === 'owner';
};
