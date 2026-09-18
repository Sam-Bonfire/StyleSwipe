import { api } from '@app/convex';
import { ManageOrganizations, type Organization, type User } from '@app/core';
import { ConvexClient } from 'convex/browser';
/**
 * Organization admin hooks
 * Reads wrap Convex paginated queries; writes route through ManageOrganizations use case.
 */
import { usePaginatedQuery, useConvex } from 'convex/react';
import { Effect } from 'effect';

import { createOrganizationAdminRepositoryLayer } from '../../convex';

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
    return (args: { id: string; data: Partial<Organization> }) => {
        const program = ManageOrganizations.updateOrganization(args.id, args.data);
        const layer = createOrganizationAdminRepositoryLayer(convex as unknown as ConvexClient);
        return Effect.runPromise(program.pipe(Effect.provide(layer)));
    }
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
    return (args: { id: string; details: Partial<User> }) => {
        const program = ManageOrganizations.updateUserDetails(args.id, args.details);
        const layer = createOrganizationAdminRepositoryLayer(convex as unknown as ConvexClient);
        return Effect.runPromise(program.pipe(Effect.provide(layer)));
    }
}
