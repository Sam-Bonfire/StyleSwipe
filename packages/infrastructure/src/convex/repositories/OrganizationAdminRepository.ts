import type { Organization, User, Member, PaginationOpts } from '@app/core';

import { api } from '@app/convex';
import { OrganizationAdminRepository, RepositoryError } from '@app/core';
import { ConvexClient } from 'convex/browser';
import { Layer, Effect } from 'effect';




export const createOrganizationAdminRepositoryLayer = (client: ConvexClient) => Layer.succeed(
    OrganizationAdminRepository,
    OrganizationAdminRepository.of({

    listOrganizationsWithMembers: (paginationOpts: PaginationOpts) => Effect.tryPromise({
      try: async () => {
          const result = await client.query(api.organizationAdmin.listOrganizationsWithMembers, {
    paginationOpts,
});
return {
    page: result.page.map((doc: Record<string, unknown>) => ({
        id: (doc._id as string) || '',
        name: (doc.name as string) || '',
        slug: (doc.slug as string) || '',
        logo: doc.logo as string | undefined,
        metadata: doc.metadata as Record<string, unknown> | undefined,
        createdAt: (doc._creationTime as number) || 0,
        members: (doc.members as Member[]) || [],
    })),
    isDone: result.isDone,
    continueCursor: result.continueCursor,
};
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    searchOrganizations: (query: string, paginationOpts: PaginationOpts) => Effect.tryPromise({
      try: async () => {
          const result = await client.query(api.organizationAdmin.searchOrganizations, {
    query,
    paginationOpts,
});
return {
    page: result.page.map((doc: Record<string, unknown>) => ({
        id: (doc._id as string) || '',
        name: (doc.name as string) || '',
        slug: (doc.slug as string) || '',
        logo: doc.logo as string | undefined,
        metadata: doc.metadata as Record<string, unknown> | undefined,
        createdAt: (doc._creationTime as number) || 0,
    })),
    isDone: result.isDone,
    continueCursor: result.continueCursor,
};
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    updateOrganization: (id: string, data: Partial<Organization>) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.organizationAdmin.updateOrganization, {
    id: id as any,
    name: data.name,
    slug: data.slug,
    logo: data.logo,
});
return {
    id,
    name: data.name || '',
    slug: data.slug || '',
    logo: data.logo,
    metadata: data.metadata,
    createdAt: 0,
};
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    listUsersWithOrgs: (paginationOpts: PaginationOpts) => Effect.tryPromise({
      try: async () => {
          const result = await client.query(api.organizationAdmin.listUsersWithOrgs, {
    paginationOpts,
});
return {
    page: result.page.map((doc: Record<string, unknown>) => ({
        id: (doc._id as string) || '',
        email: (doc.email as string) || '',
        name: (doc.name as string) || '',
        emailVerified: (doc.emailVerified as boolean) || false,
        phone: (doc.phone as string) || '',
        image: doc.image as string | undefined,
        activeOrgId: doc.activeOrgId as string | undefined,
        styleProfile: doc.styleProfile as User['styleProfile'],
        organizations: (doc.organizations as Organization[]) || [],
    })),
    isDone: result.isDone,
    continueCursor: result.continueCursor,
};
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    searchUsers: (query: string, paginationOpts: PaginationOpts) => Effect.tryPromise({
      try: async () => {
          const result = await client.query(api.organizationAdmin.searchUsers, {
    query,
    paginationOpts,
});
return {
    page: result.page.map((doc: Record<string, unknown>) => ({
        id: (doc._id as string) || '',
        email: (doc.email as string) || '',
        name: (doc.name as string) || '',
        emailVerified: (doc.emailVerified as boolean) || false,
        phone: (doc.phone as string) || '',
        image: doc.image as string | undefined,
        activeOrgId: doc.activeOrgId as string | undefined,
        styleProfile: doc.styleProfile as User['styleProfile'],
    })),
    isDone: result.isDone,
    continueCursor: result.continueCursor,
};
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    updateUserDetails: (id: string, data: Partial<User>) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.organizationAdmin.updateUserDetails, {
    userId: id as any,
    name: data.name,
    email: data.email,
    image: data.image,
});
return {
    id,
    email: data.email || '',
    name: data.name || '',
    emailVerified: data.emailVerified || false,
    phone: data.phone || '',
    image: data.image,
    activeOrgId: data.activeOrgId,
    styleProfile: data.styleProfile,
};
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    })
);

