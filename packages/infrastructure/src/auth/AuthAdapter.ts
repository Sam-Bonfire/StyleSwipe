import type { Member, MemberRole, Organization, OrganizationMetadata } from '@app/core';

import { convexClient } from '@convex-dev/better-auth/client/plugins';
import { organizationClient, phoneNumberClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

const createStyleSwipeAuthClient = (baseURL: string) =>
  createAuthClient({
    baseURL: baseURL,
    plugins: [convexClient(), organizationClient(), phoneNumberClient()],
  });

type AuthClient = ReturnType<typeof createStyleSwipeAuthClient>;

/** Unwraps better-auth's { data, error } envelope or throws. */
async function unwrap<T>(promise: Promise<{ data: T | null; error: { message?: string } | null }>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(error.message ?? 'Authentication request failed');
  if (data === null || data === undefined) throw new Error('Authentication returned no data');
  return data;
}

function toOrganization(o: {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: unknown;
  createdAt: Date | number;
}): Organization {
  return {
    id: o.id,
    name: o.name,
    slug: o.slug,
    logo: o.logo ?? undefined,
    metadata: (o.metadata as OrganizationMetadata | undefined) ?? undefined,
    createdAt: o.createdAt instanceof Date ? o.createdAt.getTime() : o.createdAt,
  };
}

function toMember(m: {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: Date | number;
}): Member {
  return {
    id: m.id,
    orgId: m.organizationId,
    userId: m.userId,
    role: m.role as MemberRole,
    joinedAt: m.createdAt instanceof Date ? m.createdAt.getTime() : m.createdAt,
  };
}

export class AuthAdapter {
  public client: AuthClient;

  constructor(baseURL: string) {
    this.client = createStyleSwipeAuthClient(baseURL);
  }

  async signInWithPhone(phoneNumber: string): Promise<void> {
    await unwrap(this.client.phoneNumber.sendOtp({ phoneNumber }));
  }

  async verifyOTP(phoneNumber: string, code: string): Promise<void> {
    await unwrap(this.client.phoneNumber.verify({ phoneNumber, code }));
  }

  async signUpWithEmail(email: string, password: string, name: string): Promise<void> {
    await this.client.signUp.email({
      email,
      password,
      name,
    });
  }

  async signInWithEmail(email: string, password: string): Promise<void> {
    await this.client.signIn.email({
      email,
      password,
    });
  }

  async signOut(): Promise<void> {
    await this.client.signOut();
  }

  // Organization Management Methods

  async createOrganization(
    name: string,
    slug: string,
    metadata?: string,
  ): Promise<Organization> {
    const org = await unwrap(
      this.client.organization.create({
        name,
        slug,
        ...(metadata ? { metadata: JSON.parse(metadata) as Record<string, unknown> } : {}),
      }),
    );
    return toOrganization(org as unknown as Parameters<typeof toOrganization>[0]);
  }

  async listOrganizations(): Promise<Organization[]> {
    const orgs = await unwrap(this.client.organization.list());
    return (orgs ?? []).map((o) => toOrganization(o as unknown as Parameters<typeof toOrganization>[0]));
  }

  async getActiveOrganization(): Promise<Organization | null> {
    const { data: session } = await this.client.getSession();
    const activeOrganizationId = (
      session as unknown as { session?: { activeOrganizationId?: string } } | null
    )?.session?.activeOrganizationId;
    if (!activeOrganizationId) return null;
    const full = await unwrap(
      this.client.organization.getFullOrganization({
        query: { organizationId: activeOrganizationId },
      }),
    );
    if (!full) return null;
    return toOrganization(full as unknown as Parameters<typeof toOrganization>[0]);
  }

  async setActiveOrganization(organizationId: string): Promise<void> {
    await unwrap(
      this.client.organization.setActive({
        organizationId,
      }),
    );
  }

  async updateOrganization(
    organizationId: string,
    data: { name?: string; slug?: string; logo?: string; metadata?: string },
  ): Promise<Organization> {
    const { metadata, ...rest } = data;
    const org = await unwrap(
      this.client.organization.update({
        organizationId,
        data: {
          ...rest,
          ...(metadata !== undefined ? { metadata: JSON.parse(metadata) as Record<string, unknown> } : {}),
        },
      }),
    );
    return toOrganization(org as unknown as Parameters<typeof toOrganization>[0]);
  }

  async deleteOrganization(organizationId: string): Promise<void> {
    await unwrap(
      this.client.organization.delete({
        organizationId,
      }),
    );
  }

  // Member Management Methods

  async inviteMember(organizationId: string, email: string, role?: string): Promise<Member> {
    const res = await unwrap(
      this.client.organization.inviteMember({
        organizationId,
        email,
        role: (role ?? 'member') as 'member',
      }),
    );
    const member = (res as unknown as { member?: unknown }).member ?? res;
    return toMember(member as unknown as Parameters<typeof toMember>[0]);
  }

  async removeMember(memberIdOrEmail: string): Promise<void> {
    await unwrap(
      this.client.organization.removeMember({
        memberIdOrEmail,
      }),
    );
  }

  async updateMemberRole(memberId: string, role: string): Promise<Member> {
    const res = await unwrap(
      this.client.organization.updateMemberRole({
        memberId,
        role: role as 'member',
      }),
    );
    const member = (res as unknown as { member?: unknown }).member ?? res;
    return toMember(member as unknown as Parameters<typeof toMember>[0]);
  }

  async listMembers(organizationId: string): Promise<Member[]> {
    const res = await unwrap(
      this.client.organization.listMembers({
        query: { organizationId },
      }),
    );
    const members = (res as unknown as { members?: unknown }).members ?? res;
    return ((members ?? []) as Array<unknown>).map((m) =>
      toMember(m as unknown as Parameters<typeof toMember>[0]),
    );
  }
}
