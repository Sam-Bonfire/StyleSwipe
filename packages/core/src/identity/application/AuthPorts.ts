import { Effect, Context } from 'effect';

import type { AuthSession, IdentityAccount } from '../domain/Auth';
import type { AuthRepositoryError, TokenError } from '../domain/errors';
import type { User } from '../domain/User';

export interface AuthRepository {
  readonly findUserById: (id: string) => Effect.Effect<User | null, AuthRepositoryError>;
  readonly findUserByEmail: (email: string) => Effect.Effect<User | null, AuthRepositoryError>;
  readonly findUserByPhone: (phone: string) => Effect.Effect<User | null, AuthRepositoryError>;
  readonly createSession: (session: AuthSession) => Effect.Effect<AuthSession, AuthRepositoryError>;
  readonly findSessionByToken: (token: string) => Effect.Effect<AuthSession | null, AuthRepositoryError>;
  readonly revokeSession: (sessionId: string) => Effect.Effect<void, AuthRepositoryError>;
  readonly linkAccount: (identity: IdentityAccount) => Effect.Effect<IdentityAccount, AuthRepositoryError>;
}

export const AuthRepository = Context.GenericTag<AuthRepository>('AuthRepository');

export interface TokenService {
  readonly signAccessToken: (payload: Record<string, unknown>, expiresInSec: number) => Effect.Effect<string, TokenError>;
  readonly verifyAccessToken: (token: string) => Effect.Effect<Record<string, unknown>, TokenError>;
  readonly hashToken: (raw: string) => Effect.Effect<string, TokenError>;
}

export const TokenService = Context.GenericTag<TokenService>('TokenService');
