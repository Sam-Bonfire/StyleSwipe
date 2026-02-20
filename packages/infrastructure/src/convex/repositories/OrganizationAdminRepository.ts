import type { OrganizationAdminRepository } from '@app/core';
import type { Organization, User, Member, PaginationOpts, PaginatedResult } from '@app/core';

import { api } from '@app/convex';
import { ConvexClient } from 'convex/browser';

export class ConvexOrganizationAdminRepository implements OrganizationAdminRepository {
    constructor(private client: ConvexClient) { }

    async listOrganizationsWithMembers(
        paginationOpts: PaginationOpts,
    ): Promise<PaginatedResult<Organization & { members: Member[] }>> {
        const result = await this.client.query(api.organizationAdmin.listOrganizationsWithMembers, {
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
    }

    async searchOrganizations(
        query: string,
        paginationOpts: PaginationOpts,
    ): Promise<PaginatedResult<Organization>> {
        const result = await this.client.query(api.organizationAdmin.searchOrganizations, {
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
    }

    async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
         
        await this.client.mutation(api.organizationAdmin.updateOrganization, {
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
    }

    async listUsersWithOrgs(
        paginationOpts: PaginationOpts,
    ): Promise<PaginatedResult<User & { organizations: Organization[] }>> {
        const result = await this.client.query(api.organizationAdmin.listUsersWithOrgs, {
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
    }

    async searchUsers(
        query: string,
        paginationOpts: PaginationOpts,
    ): Promise<PaginatedResult<User>> {
        const result = await this.client.query(api.organizationAdmin.searchUsers, {
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
    }

    async updateUserDetails(id: string, data: Partial<User>): Promise<User> {
         
        await this.client.mutation(api.organizationAdmin.updateUserDetails, {
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
    }
}
