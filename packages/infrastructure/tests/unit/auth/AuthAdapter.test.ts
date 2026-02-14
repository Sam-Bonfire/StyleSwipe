import { describe, it, expect, beforeEach, mock } from 'bun:test';

import { AuthAdapter } from '../../../src/auth/AuthAdapter';

// We test that AuthAdapter correctly delegates to its internal client.
// The client is created by better-auth, so we mock it post-construction.

function createMockAuthClient() {
    return {
        signIn: {
            phone: mock(() => Promise.resolve()),
            email: mock(() => Promise.resolve()),
        },
        signUp: {
            email: mock(() => Promise.resolve()),
        },
        signOut: mock(() => Promise.resolve()),
        organization: {
            create: mock(() => Promise.resolve({ id: 'org-1' })),
            list: mock(() => Promise.resolve([])),
            getActive: mock(() => Promise.resolve(null)),
            setActive: mock(() => Promise.resolve()),
            update: mock(() => Promise.resolve()),
            delete: mock(() => Promise.resolve()),
            inviteMember: mock(() => Promise.resolve()),
            removeMember: mock(() => Promise.resolve()),
            updateMemberRole: mock(() => Promise.resolve()),
            listMembers: mock(() => Promise.resolve([])),
            acceptInvitation: mock(() => Promise.resolve()),
            rejectInvitation: mock(() => Promise.resolve()),
            cancelInvitation: mock(() => Promise.resolve()),
            listInvitations: mock(() => Promise.resolve([])),
            createRole: mock(() => Promise.resolve()),
            listRoles: mock(() => Promise.resolve([])),
            updateRole: mock(() => Promise.resolve()),
            deleteRole: mock(() => Promise.resolve()),
            hasPermission: mock(() => Promise.resolve(true)),
        },
    };
}

describe('AuthAdapter', () => {
    let adapter: AuthAdapter;
    let mockClient: ReturnType<typeof createMockAuthClient>;

    beforeEach(() => {
        adapter = new AuthAdapter('http://localhost:3000');
        mockClient = createMockAuthClient();
        // Replace the internal client with our mock
        adapter.client = mockClient;
    });

    describe('Authentication', () => {
        it('should delegate signInWithPhone to client', async () => {
            await adapter.signInWithPhone('+919876543210');
            expect(mockClient.signIn.phone).toHaveBeenCalledWith({
                phoneNumber: '+919876543210',
            });
        });

        it('should delegate verifyOTP to client', async () => {
            await adapter.verifyOTP('+919876543210', '123456');
            expect(mockClient.signIn.phone).toHaveBeenCalledWith({
                phoneNumber: '+919876543210',
                otp: '123456',
            });
        });

        it('should delegate signUpWithEmail to client', async () => {
            await adapter.signUpWithEmail('test@test.com', 'pass123', 'John');
            expect(mockClient.signUp.email).toHaveBeenCalledWith({
                email: 'test@test.com',
                password: 'pass123',
                name: 'John',
            });
        });

        it('should delegate signInWithEmail to client', async () => {
            await adapter.signInWithEmail('test@test.com', 'pass123');
            expect(mockClient.signIn.email).toHaveBeenCalledWith({
                email: 'test@test.com',
                password: 'pass123',
            });
        });

        it('should delegate signOut to client', async () => {
            await adapter.signOut();
            expect(mockClient.signOut).toHaveBeenCalledTimes(1);
        });
    });

    describe('Organization Management', () => {
        it('should create organization with correct args', async () => {
            await adapter.createOrganization('Acme', 'acme', 'metadata');
            expect(mockClient.organization.create).toHaveBeenCalledWith({
                name: 'Acme',
                slug: 'acme',
                metadata: 'metadata',
            });
        });

        it('should list organizations', async () => {
            await adapter.listOrganizations();
            expect(mockClient.organization.list).toHaveBeenCalledTimes(1);
        });

        it('should set active organization', async () => {
            await adapter.setActiveOrganization('org-1');
            expect(mockClient.organization.setActive).toHaveBeenCalledWith({
                organizationId: 'org-1',
            });
        });

        it('should delete organization', async () => {
            await adapter.deleteOrganization('org-1');
            expect(mockClient.organization.delete).toHaveBeenCalledWith({
                organizationId: 'org-1',
            });
        });
    });

    describe('Member Management', () => {
        it('should invite member with role', async () => {
            await adapter.inviteMember('org-1', 'new@test.com', 'admin');
            expect(mockClient.organization.inviteMember).toHaveBeenCalledWith({
                organizationId: 'org-1',
                email: 'new@test.com',
                role: 'admin',
            });
        });

        it('should remove member', async () => {
            await adapter.removeMember('member-1');
            expect(mockClient.organization.removeMember).toHaveBeenCalledWith({
                membershipId: 'member-1',
            });
        });

        it('should update member role', async () => {
            await adapter.updateMemberRole('member-1', 'editor');
            expect(mockClient.organization.updateMemberRole).toHaveBeenCalledWith({
                membershipId: 'member-1',
                role: 'editor',
            });
        });
    });

    describe('Role Management', () => {
        it('should create role with permissions', async () => {
            await adapter.createRole('org-1', 'editor', ['read', 'write']);
            expect(mockClient.organization.createRole).toHaveBeenCalledWith({
                organizationId: 'org-1',
                role: 'editor',
                permissions: ['read', 'write'],
            });
        });

        it('should check permissions', async () => {
            await adapter.hasPermission('user-1', 'org-1', { post: ['create'] });
            expect(mockClient.organization.hasPermission).toHaveBeenCalledWith({
                userId: 'user-1',
                organizationId: 'org-1',
                permission: { post: ['create'] },
            });
        });
    });
});
