import { Effect } from 'effect';

import { AuthService, AuthError } from '../../../shared/application/ports';

export const signInWithPhone = (phoneNumber: string): Effect.Effect<void, AuthError, AuthService> =>
  Effect.gen(function* (_) {
    const auth = yield* _(AuthService);
    return yield* _(auth.signInWithPhone(phoneNumber));
  });

export const verifyOTP = (
  phoneNumber: string,
  otp: string,
): Effect.Effect<void, AuthError, AuthService> =>
  Effect.gen(function* (_) {
    const auth = yield* _(AuthService);
    return yield* _(auth.verifyOTP(phoneNumber, otp));
  });

export const signUpWithEmail = (
  email: string,
  password: string,
  name: string,
): Effect.Effect<void, AuthError, AuthService> =>
  Effect.gen(function* (_) {
    const auth = yield* _(AuthService);
    return yield* _(auth.signUpWithEmail(email, password, name));
  });

export const signInWithEmail = (
  email: string,
  password: string,
): Effect.Effect<void, AuthError, AuthService> =>
  Effect.gen(function* (_) {
    const auth = yield* _(AuthService);
    return yield* _(auth.signInWithEmail(email, password));
  });

export const signOut = (): Effect.Effect<void, AuthError, AuthService> =>
  Effect.gen(function* (_) {
    const auth = yield* _(AuthService);
    return yield* _(auth.signOut());
  });
