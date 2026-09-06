import { describe, expect, it, beforeEach, vi } from 'vitest';

import { AuthAdapter } from '../../../src/auth/AuthAdapter';

// We test that AuthAdapter correctly delegates to its internal client.
// The client is created by better-auth, so we mock it post-construction.
// better-auth calls resolve { data, error } envelopes.

const ok = <T>(data: T) => Promise.resolve({ data, error: null });

function createMockAuthClient() {
    return {
        signIn: {
            email: vi.fn(() => ok({})),
        },
        signUp: {
            email: vi.fn(() => ok({})),
        },
        signOut: vi.fn(() => ok({})),
        getSession: vi.fn(() => ok({ session: { activeOrganizationId: 'org-1' }, user: { id: 'user-1' } })),
        phoneNumber: {
            sendOtp: vi.fn(() => ok({})),
            verify: vi.fn(() => ok({})),
        },
        organization: {
            create: vi.fn(() =>
                ok({ id: 'org-1', name: 'Acme', slug: 'acme', createdAt: new Date(0) }),
            ),
            list: vi.fn(() => ok([])),
            getFullOrganization: vi.fn(() =>
                ok({ id: 'org-1', name: 'Acme', slug: 'acme', createdAt: new Date(0) }),
            ),
            setActive: vi.fn(() => ok({})),
            update: vi.fn(() =>
                ok({ id: 'org-1', name: 'Acme', slug: 'acme', createdAt: new Date(0) }),
            ),
            delete: vi.fn(() => ok({})),
            inviteMember: vi.fn(() =>
                ok({
                    member: {
                        id: 'member-1',
                        organizationId: 'org-1',
                        userId: 'user-1',
                        role: 'admin',
                        createdAt: new Date(0),
                    },
                }),
            ),
            removeMember: vi.fn(() => ok({})),
            updateMemberRole: vi.fn(() =>
                ok({
                    member: {
                        id: 'member-1',
                        organizationId: 'org-1',
                        userId: 'user-1',
                        role: 'editor',
                        createdAt: new Date(0),
                    },
                }),
            ),
            listMembers: vi.fn(() => ok({ members: [] })),
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
        adapter.client = mockClient as unknown as typeof adapter.client;
    });

    describe('Authentication', () => {
        it('should delegate signInWithPhone to client', async () => {
            await adapter.signInWithPhone('+919876543210');
            expect(mockClient.phoneNumber.sendOtp).toHaveBeenCalledWith({
                phoneNumber: '+919876543210',
            });
        });

        it('should delegate verifyOTP to client', async () => {
            await adapter.verifyOTP('+919876543210', '123456');
            expect(mockClient.phoneNumber.verify).toHaveBeenCalledWith({
                phoneNumber: '+919876543210',
                code: '123456',
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
            const org = await adapter.createOrganization('Acme', 'acme');
            expect(mockClient.organization.create).toHaveBeenCalledWith({
                name: 'Acme',
                slug: 'acme',
            });
            expect(org.id).toBe('org-1');
        });

        it('should list organizations', async () => {
            await adapter.listOrganizations();
            expect(mockClient.organization.list).toHaveBeenCalledTimes(1);
        });

        it('should resolve the active organization from the session', async () => {
            const org = await adapter.getActiveOrganization();
            expect(mockClient.organization.getFullOrganization).toHaveBeenCalledWith({
                query: { organizationId: 'org-1' },
            });
            expect(org?.id).toBe('org-1');
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
            const member = await adapter.inviteMember('org-1', 'new@test.com', 'admin');
            expect(mockClient.organization.inviteMember).toHaveBeenCalledWith({
                organizationId: 'org-1',
                email: 'new@test.com',
                role: 'admin',
            });
            expect(member.id).toBe('member-1');
        });

        it('should remove member', async () => {
            await adapter.removeMember('member-1');
            expect(mockClient.organization.removeMember).toHaveBeenCalledWith({
                memberIdOrEmail: 'member-1',
            });
        });

        it('should update member role', async () => {
            const member = await adapter.updateMemberRole('member-1', 'editor');
            expect(mockClient.organization.updateMemberRole).toHaveBeenCalledWith({
                memberId: 'member-1',
                role: 'editor',
            });
            expect(member.role).toBe('editor');
        });
    });
});
