import { Effect, Layer } from 'effect';
import { describe, it, expect } from 'vitest';

import { AuthRepository, TokenService } from '../../../../src/identity/application/AuthPorts';
import { AuthSession, IdentityAccount } from '../../../../src/identity/domain/Auth';
import { AuthRepositoryError } from '../../../../src/identity/domain/errors';
import { User } from '../../../../src/identity/domain/User';

describe('AuthPorts', () => {
  it('should resolve AuthRepository port', async () => {
    const mockUser: User = { id: 'user-1', name: 'Test User' };

    const AuthRepositoryLive = Layer.succeed(
      AuthRepository,
      AuthRepository.of({
        findUserById: (id: string) => Effect.succeed(id === 'user-1' ? mockUser : null),
        findUserByEmail: () => Effect.fail(new AuthRepositoryError('Not implemented')),
        findUserByPhone: () => Effect.fail(new AuthRepositoryError('Not implemented')),
        createSession: (session: AuthSession) => Effect.succeed(session),
        findSessionByToken: () => Effect.fail(new AuthRepositoryError('Not implemented')),
        revokeSession: () => Effect.succeed(undefined),
        linkAccount: (identity: IdentityAccount) => Effect.succeed(identity),
      })
    );

    const program = Effect.gen(function* () {
      const repo = yield* AuthRepository;
      const user = yield* repo.findUserById('user-1');
      return user;
    });

    const result = await Effect.runPromise(Effect.provide(program, AuthRepositoryLive));

    expect(result).toEqual(mockUser);
  });

  it('should handle AuthRepository port error', async () => {
    const AuthRepositoryLive = Layer.succeed(
      AuthRepository,
      AuthRepository.of({
        findUserById: () => Effect.fail(new AuthRepositoryError('Database failure')),
        findUserByEmail: () => Effect.fail(new AuthRepositoryError('Not implemented')),
        findUserByPhone: () => Effect.fail(new AuthRepositoryError('Not implemented')),
        createSession: () => Effect.fail(new AuthRepositoryError('Not implemented')),
        findSessionByToken: () => Effect.fail(new AuthRepositoryError('Not implemented')),
        revokeSession: () => Effect.fail(new AuthRepositoryError('Not implemented')),
        linkAccount: () => Effect.fail(new AuthRepositoryError('Not implemented')),
      })
    );

    const program = Effect.gen(function* () {
      const repo = yield* AuthRepository;
      return yield* repo.findUserById('user-1');
    });

    const result = await Effect.runPromiseExit(Effect.provide(program, AuthRepositoryLive));

    expect(result._tag).toBe('Failure');
    if (result._tag === 'Failure') {
      const failure = result.cause;
      expect(failure._tag).toBe('Fail');
      if (failure._tag === 'Fail') {
        expect(failure.error).toBeInstanceOf(AuthRepositoryError);
        expect((failure.error as AuthRepositoryError).message).toBe('Database failure');
      }
    }
  });

  it('should resolve TokenService port', async () => {
    const TokenServiceLive = Layer.succeed(
      TokenService,
      TokenService.of({
        signAccessToken: () => Effect.succeed('mock-token'),
        verifyAccessToken: () => Effect.succeed({ userId: 'user-1' }),
        hashToken: () => Effect.succeed('hashed-token'),
      })
    );

    const program = Effect.gen(function* () {
      const service = yield* TokenService;
      const token = yield* service.signAccessToken({ userId: 'user-1' }, 3600);
      return token;
    });

    const result = await Effect.runPromise(Effect.provide(program, TokenServiceLive));

    expect(result).toBe('mock-token');
  });
});
