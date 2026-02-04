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
  // Get core org
  const orgs = await ctx.runQuery(components.auth.api.findMany, {
    model: 'organizations',
    where: [{ field: 'slug', operator: 'eq', value: 'styleswipe-core' }],
    paginationOpts: DEFAULT_PAGINATION,
  });

  if (orgs.page.length === 0) return false;
  const coreOrg = orgs.page[0];

  // Check if user is a member
  const members = await ctx.runQuery(components.auth.api.findMany, {
    model: 'members',
    where: [
      { field: 'userId', operator: 'eq', value: userId },
      { field: 'organizationId', operator: 'eq', value: coreOrg.id || coreOrg._id },
    ],
    paginationOpts: DEFAULT_PAGINATION,
  });

  return members.page.length > 0;
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
