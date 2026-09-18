export class InvalidCredentialsError {
  readonly _tag = 'InvalidCredentialsError';
  constructor(public readonly message: string = 'Invalid credentials provided') {}
}

export class SessionExpiredError {
  readonly _tag = 'SessionExpiredError';
  constructor(public readonly message: string = 'Session has expired') {}
}

export class SessionRevokedError {
  readonly _tag = 'SessionRevokedError';
  constructor(public readonly message: string = 'Session has been revoked') {}
}

export class UnauthorizedError {
  readonly _tag = 'UnauthorizedError';
  constructor(public readonly message: string = 'Unauthorized access') {}
}

export class OtpExpiredError {
  readonly _tag = 'OtpExpiredError';
  constructor(public readonly message: string = 'OTP has expired') {}
}

export class InvalidOtpError {
  readonly _tag = 'InvalidOtpError';
  constructor(public readonly message: string = 'Invalid OTP provided') {}
}

export class OtpMaxAttemptsExceededError {
  readonly _tag = 'OtpMaxAttemptsExceededError';
  constructor(public readonly message: string = 'Maximum OTP attempts exceeded') {}
}

export class SmsDeliveryError {
  readonly _tag = 'SmsDeliveryError';
  constructor(public readonly message: string = 'Failed to deliver SMS', public readonly cause?: unknown) {}
}

export class EmailDeliveryError {
  readonly _tag = 'EmailDeliveryError';
  constructor(public readonly message: string = 'Failed to deliver Email', public readonly cause?: unknown) {}
}

export class AuthRepositoryError {
  readonly _tag = 'AuthRepositoryError';
  constructor(public readonly message: string = 'Auth repository operation failed', public readonly cause?: unknown) {}
}

export class TokenError {
  readonly _tag = 'TokenError';
  constructor(public readonly message: string = 'Token operation failed', public readonly cause?: unknown) {}
}
