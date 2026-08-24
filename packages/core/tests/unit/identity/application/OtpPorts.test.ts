import { Effect, Layer } from 'effect';
import { describe, it, expect } from 'vitest';

import { OtpService, SmsProvider, EmailOtpProvider, OtpError } from '../../../../src/identity/application/OtpPorts';
import { InvalidOtpError, SmsDeliveryError, EmailDeliveryError } from '../../../../src/identity/domain/errors';

describe('OtpPorts', () => {
  it('should resolve OtpService port', async () => {
    const mockExpiry = new Date();
    const OtpServiceLive = Layer.succeed(
      OtpService,
      OtpService.of({
        generateOtp: () => Effect.succeed({ code: '123456', expiresAt: mockExpiry }),
        verifyOtp: (target: string, code: string) =>
          code === '123456' ? Effect.succeed(true) : Effect.fail(new InvalidOtpError()),
      })
    );

    const program = Effect.gen(function* () {
      const service = yield* OtpService;
      const otp = yield* service.generateOtp('user@example.com');
      return yield* service.verifyOtp('user@example.com', otp.code);
    });

    const result = await Effect.runPromise(Effect.provide(program, OtpServiceLive));

    expect(result).toBe(true);
  });

  it('should handle OtpService port error (InvalidOtpError)', async () => {
    const OtpServiceLive = Layer.succeed(
      OtpService,
      OtpService.of({
        generateOtp: () => Effect.fail(new OtpError('Generation failed')),
        verifyOtp: () => Effect.fail(new InvalidOtpError()),
      })
    );

    const program = Effect.gen(function* () {
      const service = yield* OtpService;
      return yield* service.verifyOtp('user@example.com', 'wrong-code');
    });

    const result = await Effect.runPromiseExit(Effect.provide(program, OtpServiceLive));

    expect(result._tag).toBe('Failure');
    if (result._tag === 'Failure') {
      const failure = result.cause;
      expect(failure._tag).toBe('Fail');
      if (failure._tag === 'Fail') {
        expect(failure.error).toBeInstanceOf(InvalidOtpError);
      }
    }
  });

  it('should resolve SmsProvider port', async () => {
    const SmsProviderLive = Layer.succeed(
      SmsProvider,
      SmsProvider.of({
        sendSms: () => Effect.succeed({ messageId: 'sms-123' }),
      })
    );

    const program = Effect.gen(function* () {
      const provider = yield* SmsProvider;
      return yield* provider.sendSms('+1234567890', 'Your code is 123456');
    });

    const result = await Effect.runPromise(Effect.provide(program, SmsProviderLive));

    expect(result.messageId).toBe('sms-123');
  });

  it('should handle SmsProvider port error', async () => {
    const SmsProviderLive = Layer.succeed(
      SmsProvider,
      SmsProvider.of({
        sendSms: () => Effect.fail(new SmsDeliveryError('Network error')),
      })
    );

    const program = Effect.gen(function* () {
      const provider = yield* SmsProvider;
      return yield* provider.sendSms('+1234567890', 'Your code is 123456');
    });

    const result = await Effect.runPromiseExit(Effect.provide(program, SmsProviderLive));

    expect(result._tag).toBe('Failure');
    if (result._tag === 'Failure') {
      const failure = result.cause;
      expect(failure._tag).toBe('Fail');
      if (failure._tag === 'Fail') {
        expect(failure.error).toBeInstanceOf(SmsDeliveryError);
      }
    }
  });

  it('should resolve EmailOtpProvider port', async () => {
    const EmailOtpProviderLive = Layer.succeed(
      EmailOtpProvider,
      EmailOtpProvider.of({
        sendOtpEmail: () => Effect.succeed({ messageId: 'email-123' }),
      })
    );

    const program = Effect.gen(function* () {
      const provider = yield* EmailOtpProvider;
      return yield* provider.sendOtpEmail('test@example.com', '123456');
    });

    const result = await Effect.runPromise(Effect.provide(program, EmailOtpProviderLive));

    expect(result.messageId).toBe('email-123');
  });

  it('should handle EmailOtpProvider port error', async () => {
    const EmailOtpProviderLive = Layer.succeed(
      EmailOtpProvider,
      EmailOtpProvider.of({
        sendOtpEmail: () => Effect.fail(new EmailDeliveryError('SMTP server unreachable')),
      })
    );

    const program = Effect.gen(function* () {
      const provider = yield* EmailOtpProvider;
      return yield* provider.sendOtpEmail('test@example.com', '123456');
    });

    const result = await Effect.runPromiseExit(Effect.provide(program, EmailOtpProviderLive));

    expect(result._tag).toBe('Failure');
    if (result._tag === 'Failure') {
      const failure = result.cause;
      expect(failure._tag).toBe('Fail');
      if (failure._tag === 'Fail') {
        expect(failure.error).toBeInstanceOf(EmailDeliveryError);
      }
    }
  });
});
