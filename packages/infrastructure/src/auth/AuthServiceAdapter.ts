import { AuthService, AuthError } from '@app/core';
import { Layer, Effect } from 'effect';

import { AuthAdapter } from './AuthAdapter';

export const createAuthServiceLayer = (adapter: AuthAdapter) => {
  return Layer.succeed(
    AuthService,
    AuthService.of({
      signInWithPhone: (phoneNumber: string) =>
        Effect.tryPromise({
          try: () => adapter.signInWithPhone(phoneNumber),
          catch: (e) =>
            new AuthError('signInWithPhone', e instanceof Error ? e.message : String(e), e),
        }),
      verifyOTP: (phoneNumber: string, otp: string) =>
        Effect.tryPromise({
          try: () => adapter.verifyOTP(phoneNumber, otp),
          catch: (e) => new AuthError('verifyOTP', e instanceof Error ? e.message : String(e), e),
        }),
      signUpWithEmail: (email: string, password: string, name: string) =>
        Effect.tryPromise({
          try: () => adapter.signUpWithEmail(email, password, name),
          catch: (e) =>
            new AuthError('signUpWithEmail', e instanceof Error ? e.message : String(e), e),
        }),
      signInWithEmail: (email: string, password: string) =>
        Effect.tryPromise({
          try: () => adapter.signInWithEmail(email, password),
          catch: (e) =>
            new AuthError('signInWithEmail', e instanceof Error ? e.message : String(e), e),
        }),
      signOut: () =>
        Effect.tryPromise({
          try: () => adapter.signOut(),
          catch: (e) => new AuthError('signOut', e instanceof Error ? e.message : String(e), e),
        }),

      // Organization Management
      createOrganization: (name: string, slug: string, metadata?: string) =>
        Effect.tryPromise({
          try: () => adapter.createOrganization(name, slug, metadata),
          catch: (e) =>
            new AuthError('createOrganization', e instanceof Error ? e.message : String(e), e),
        }),
      listOrganizations: () =>
        Effect.tryPromise({
          try: () => adapter.listOrganizations(),
          catch: (e) =>
            new AuthError('listOrganizations', e instanceof Error ? e.message : String(e), e),
        }),
      getActiveOrganization: () =>
        Effect.tryPromise({
          try: () => adapter.getActiveOrganization(),
          catch: (e) =>
            new AuthError('getActiveOrganization', e instanceof Error ? e.message : String(e), e),
        }),
      setActiveOrganization: (organizationId: string) =>
        Effect.tryPromise({
          try: () => adapter.setActiveOrganization(organizationId),
          catch: (e) =>
            new AuthError('setActiveOrganization', e instanceof Error ? e.message : String(e), e),
        }),
      updateOrganization: (organizationId: string, data: any) =>
        Effect.tryPromise({
          try: () => adapter.updateOrganization(organizationId, data),
          catch: (e) =>
            new AuthError('updateOrganization', e instanceof Error ? e.message : String(e), e),
        }),
      deleteOrganization: (organizationId: string) =>
        Effect.tryPromise({
          try: () => adapter.deleteOrganization(organizationId),
          catch: (e) =>
            new AuthError('deleteOrganization', e instanceof Error ? e.message : String(e), e),
        }),

      // Member Management
      inviteMember: (organizationId: string, email: string, role?: string) =>
        Effect.tryPromise({
          try: () => adapter.inviteMember(organizationId, email, role),
          catch: (e) =>
            new AuthError('inviteMember', e instanceof Error ? e.message : String(e), e),
        }),
      removeMember: (membershipId: string) =>
        Effect.tryPromise({
          try: () => adapter.removeMember(membershipId),
          catch: (e) =>
            new AuthError('removeMember', e instanceof Error ? e.message : String(e), e),
        }),
      updateMemberRole: (membershipId: string, role: string) =>
        Effect.tryPromise({
          try: () => adapter.updateMemberRole(membershipId, role),
          catch: (e) =>
            new AuthError('updateMemberRole', e instanceof Error ? e.message : String(e), e),
        }),
      listMembers: (organizationId: string) =>
        Effect.tryPromise({
          try: () => adapter.listMembers(organizationId),
          catch: (e) => new AuthError('listMembers', e instanceof Error ? e.message : String(e), e),
        }),
    }),
  );
};
