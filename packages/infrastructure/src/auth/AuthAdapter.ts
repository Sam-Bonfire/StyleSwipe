import { convexClient } from '@convex-dev/better-auth/client/plugins';
import { organizationClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export class AuthAdapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public client: any;

  constructor(baseURL: string) {
    this.client = createAuthClient({
      baseURL: baseURL,
      plugins: [convexClient(), organizationClient()],
    });
  }

  async signInWithPhone(phoneNumber: string): Promise<void> {
    await this.client.signIn.phone({
      phoneNumber,
    });
  }

  async verifyOTP(phoneNumber: string, otp: string): Promise<void> {
    await this.client.signIn.phone({
      phoneNumber,
      otp,
    });
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

  async createOrganization(name: string, slug: string, metadata?: string) {
    return await this.client.organization.create({
      name,
      slug,
      metadata,
    });
  }

  async listOrganizations() {
    return await this.client.organization.list();
  }

  async getActiveOrganization() {
    return await this.client.organization.getActive();
  }

  async setActiveOrganization(organizationId: string) {
    return await this.client.organization.setActive({
      organizationId,
    });
  }

  async updateOrganization(
    organizationId: string,
    data: { name?: string; slug?: string; logo?: string; metadata?: string },
  ) {
    return await this.client.organization.update({
      organizationId,
      data,
    });
  }

  async deleteOrganization(organizationId: string) {
    return await this.client.organization.delete({
      organizationId,
    });
  }

  // Member Management Methods

  async inviteMember(organizationId: string, email: string, role?: string) {
    return await this.client.organization.inviteMember({
      organizationId,
      email,
      role,
    });
  }

  async removeMember(membershipId: string) {
    return await this.client.organization.removeMember({
      membershipId,
    });
  }

  async updateMemberRole(membershipId: string, role: string) {
    return await this.client.organization.updateMemberRole({
      membershipId,
      role,
    });
  }

  async listMembers(organizationId: string) {
    return await this.client.organization.listMembers({
      organizationId,
    });
  }

  // Invitation Methods

  async acceptInvitation(invitationId: string) {
    return await this.client.organization.acceptInvitation({
      invitationId,
    });
  }

  async rejectInvitation(invitationId: string) {
    return await this.client.organization.rejectInvitation({
      invitationId,
    });
  }

  async cancelInvitation(invitationId: string) {
    return await this.client.organization.cancelInvitation({
      invitationId,
    });
  }

  async listInvitations(organizationId: string) {
    return await this.client.organization.listInvitations({
      organizationId,
    });
  }

  // Dynamic Role Methods

  async createRole(organizationId: string, role: string, permissions: string[]) {
    return await this.client.organization.createRole({
      organizationId,
      role,
      permissions,
    });
  }

  async listRoles(organizationId: string) {
    return await this.client.organization.listRoles({
      organizationId,
    });
  }

  async updateRole(organizationId: string, role: string, permissions: string[]) {
    return await this.client.organization.updateRole({
      organizationId,
      role,
      permissions,
    });
  }

  async deleteRole(organizationId: string, role: string) {
    return await this.client.organization.deleteRole({
      organizationId,
      role,
    });
  }

  async hasPermission(
    userId: string,
    organizationId: string,
    permission: Record<string, string[]>,
  ) {
    return await this.client.organization.hasPermission({
      userId,
      organizationId,
      permission,
    });
  }
}
