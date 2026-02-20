import { api } from '@app/convex';
import { ManageOrganizations } from '@app/core';
import { ConvexClient } from 'convex/browser';
/**
 * Organization admin hooks
 * Reads wrap Convex paginated queries; writes route through ManageOrganizations use case.
 */
import { usePaginatedQuery, useConvex } from 'convex/react';
import { Effect } from 'effect';

import { ConvexOrganizationAdminRepository } from '../../convex/repositories';

// ---------------------------------------------------------------------------
// ORGANIZATIONS
// ---------------------------------------------------------------------------

/**
 * Read — paginated organizations with members.
 */
export function useOrganizationsWithMembers(initialNumItems: number = 20) {
    return usePaginatedQuery(api.organizationAdmin.listOrganizationsWithMembers, {}, { initialNumItems });
}

/**
 * Read — paginated search organizations.
 */
export function useSearchOrganizations(query: string, initialNumItems: number = 20) {
    return usePaginatedQuery(api.organizationAdmin.searchOrganizations, { query }, { initialNumItems });
}

/**
 * Write — update organization details.
 */
export function useUpdateOrganization() {
    const convex = useConvex();
    const repo = new ConvexOrganizationAdminRepository(convex as unknown as ConvexClient);
    const useCase = new ManageOrganizations(repo);
     
    return (args: { id: string; data: any }) => Effect.runPromise(useCase.updateOrganization(args.id, args.data));
}

// ---------------------------------------------------------------------------
// USERS
// ---------------------------------------------------------------------------

/**
 * Read — paginated users with org associations.
 */
export function useUsersWithOrgs(initialNumItems: number = 20) {
    return usePaginatedQuery(api.organizationAdmin.listUsersWithOrgs, {}, { initialNumItems });
}

/**
 * Read — paginated search users.
 */
export function useSearchUsers(query: string, initialNumItems: number = 20) {
    return usePaginatedQuery(api.organizationAdmin.searchUsers, { query }, { initialNumItems });
}

/**
 * Write — update user details (admin).
 */
export function useUpdateUserDetails() {
    const convex = useConvex();
    const repo = new ConvexOrganizationAdminRepository(convex as unknown as ConvexClient);
    const useCase = new ManageOrganizations(repo);
     
    return (args: { id: string; details: any }) => Effect.runPromise(useCase.updateUserDetails(args.id, args.details));
}
