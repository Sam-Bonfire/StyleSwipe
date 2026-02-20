import { Effect } from 'effect';

import type { OrganizationAdminRepository } from '../../../shared/domain/ports';
import type {
    Organization,
    Member,
    User,
    PaginationOpts,
    PaginatedResult,
} from '../../../shared/domain/types';

// -----------------------------------------------------------------------------
// TAGGED ERRORS
// -----------------------------------------------------------------------------

export class OrganizationAdminError extends Error {
    readonly _tag = 'OrganizationAdminError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'OrganizationAdminError';
    }
}

// -----------------------------------------------------------------------------
// USE CASE: Manage Organizations (Admin)
// -----------------------------------------------------------------------------

/**
 * Admin-level organization and user management operations.
 */
export class ManageOrganizations {
    constructor(private readonly orgAdmin: OrganizationAdminRepository) { }

    listWithMembers(
        paginationOpts: PaginationOpts,
    ): Effect.Effect<PaginatedResult<Organization & { members: Member[] }>, OrganizationAdminError> {
        return Effect.tryPromise({
            try: () => this.orgAdmin.listOrganizationsWithMembers(paginationOpts),
            catch: () => new OrganizationAdminError('Failed to list organizations'),
        });
    }

    searchOrganizations(
        query: string,
        paginationOpts: PaginationOpts,
    ): Effect.Effect<PaginatedResult<Organization>, OrganizationAdminError> {
        return Effect.tryPromise({
            try: () => this.orgAdmin.searchOrganizations(query, paginationOpts),
            catch: () => new OrganizationAdminError('Failed to search organizations'),
        });
    }

    updateOrganization(
        id: string,
        data: Partial<Organization>,
    ): Effect.Effect<Organization, OrganizationAdminError> {
        return Effect.tryPromise({
            try: () => this.orgAdmin.updateOrganization(id, data),
            catch: () => new OrganizationAdminError('Failed to update organization'),
        });
    }

    listUsers(
        paginationOpts: PaginationOpts,
    ): Effect.Effect<PaginatedResult<User & { organizations: Organization[] }>, OrganizationAdminError> {
        return Effect.tryPromise({
            try: () => this.orgAdmin.listUsersWithOrgs(paginationOpts),
            catch: () => new OrganizationAdminError('Failed to list users'),
        });
    }

    searchUsers(
        query: string,
        paginationOpts: PaginationOpts,
    ): Effect.Effect<PaginatedResult<User>, OrganizationAdminError> {
        return Effect.tryPromise({
            try: () => this.orgAdmin.searchUsers(query, paginationOpts),
            catch: () => new OrganizationAdminError('Failed to search users'),
        });
    }

    updateUserDetails(
        id: string,
        data: Partial<User>,
    ): Effect.Effect<User, OrganizationAdminError> {
        return Effect.tryPromise({
            try: () => this.orgAdmin.updateUserDetails(id, data),
            catch: () => new OrganizationAdminError('Failed to update user details'),
        });
    }
}
