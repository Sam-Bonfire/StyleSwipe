import { Effect } from 'effect';

import type {
    Organization,
    Member,
    User,
    PaginationOpts,
    PaginatedResult,
} from '../../../shared/domain/types';

import { OrganizationAdminRepository } from '../../../shared/application/ports';
import { RepositoryError } from '../../../shared/domain/errors';

export class OrganizationAdminError extends Error {
    readonly _tag = 'OrganizationAdminError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'OrganizationAdminError';
    }
}

export const listWithMembers = (
    paginationOpts: PaginationOpts,
): Effect.Effect<PaginatedResult<Organization & { members: Member[] }>, OrganizationAdminError | RepositoryError, OrganizationAdminRepository> =>
    Effect.gen(function* (_) {
        const orgAdmin = yield* _(OrganizationAdminRepository);
        return yield* _(orgAdmin.listOrganizationsWithMembers(paginationOpts));
    });

export const searchOrganizations = (
    query: string,
    paginationOpts: PaginationOpts,
): Effect.Effect<PaginatedResult<Organization>, OrganizationAdminError | RepositoryError, OrganizationAdminRepository> =>
    Effect.gen(function* (_) {
        const orgAdmin = yield* _(OrganizationAdminRepository);
        return yield* _(orgAdmin.searchOrganizations(query, paginationOpts));
    });

export const updateOrganization = (
    id: string,
    data: Partial<Organization>,
): Effect.Effect<Organization, OrganizationAdminError | RepositoryError, OrganizationAdminRepository> =>
    Effect.gen(function* (_) {
        const orgAdmin = yield* _(OrganizationAdminRepository);
        return yield* _(orgAdmin.updateOrganization(id, data));
    });

export const listUsers = (
    paginationOpts: PaginationOpts,
): Effect.Effect<PaginatedResult<User & { organizations: Organization[] }>, OrganizationAdminError | RepositoryError, OrganizationAdminRepository> =>
    Effect.gen(function* (_) {
        const orgAdmin = yield* _(OrganizationAdminRepository);
        return yield* _(orgAdmin.listUsersWithOrgs(paginationOpts));
    });

export const searchUsers = (
    query: string,
    paginationOpts: PaginationOpts,
): Effect.Effect<PaginatedResult<User>, OrganizationAdminError | RepositoryError, OrganizationAdminRepository> =>
    Effect.gen(function* (_) {
        const orgAdmin = yield* _(OrganizationAdminRepository);
        return yield* _(orgAdmin.searchUsers(query, paginationOpts));
    });

export const updateUserDetails = (
    id: string,
    data: Partial<User>,
): Effect.Effect<User, OrganizationAdminError | RepositoryError, OrganizationAdminRepository> =>
    Effect.gen(function* (_) {
        const orgAdmin = yield* _(OrganizationAdminRepository);
        return yield* _(orgAdmin.updateUserDetails(id, data));
    });
