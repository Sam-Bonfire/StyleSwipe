import { Effect, Context } from 'effect';

import type {
  OtpExpiredError,
  InvalidOtpError,
  OtpMaxAttemptsExceededError,
  SmsDeliveryError,
  EmailDeliveryError
} from '../domain/errors';

export class OtpError {
  readonly _tag = 'OtpError';
  constructor(public readonly message: string = 'OTP generation failed', public readonly cause?: unknown) {}
}

export interface OtpService {
  readonly generateOtp: (target: string, length?: number) => Effect.Effect<{ code: string; expiresAt: Date }, OtpError>;
  readonly verifyOtp: (target: string, code: string) => Effect.Effect<boolean, OtpExpiredError | InvalidOtpError | OtpMaxAttemptsExceededError>;
}

export const OtpService = Context.GenericTag<OtpService>('OtpService');

export interface SmsProvider {
  readonly sendSms: (recipient: string, message: string, templateId?: string) => Effect.Effect<{ messageId: string }, SmsDeliveryError>;
}

export const SmsProvider = Context.GenericTag<SmsProvider>('SmsProvider');

export interface EmailOtpProvider {
  readonly sendOtpEmail: (email: string, otpCode: string) => Effect.Effect<{ messageId: string }, EmailDeliveryError>;
}

export const EmailOtpProvider = Context.GenericTag<EmailOtpProvider>('EmailOtpProvider');
