/**
 * Error when a repository operation fails unexpectedly.
 * Wraps the underlying cause for debugging.
 */
export class RepositoryError {
  readonly _tag = 'RepositoryError' as const;
  constructor(
    readonly operation: string,
    readonly cause: unknown,
  ) {}
  get message() {
    return `Repository operation failed: ${this.operation}`;
  }
}

export class AuthError {
  readonly _tag = 'AuthError' as const;
  constructor(
    readonly operation: string,
    readonly message: string,
    readonly cause?: unknown,
  ) {}
}
