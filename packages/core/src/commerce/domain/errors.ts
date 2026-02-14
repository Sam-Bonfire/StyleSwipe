// =============================================================================
// COMMERCE DOMAIN ERRORS
// Tagged error types for Effect-based error handling
// =============================================================================

/**
 * Error when a cart is not found for a user.
 * Typed error channel forces callers to handle this case explicitly.
 */
export class CartNotFoundError {
    readonly _tag = 'CartNotFoundError' as const;
    constructor(readonly userId: string) { }
    get message() {
        return `Cart not found for user: ${this.userId}`;
    }
}

/**
 * Error when attempting to checkout an empty cart.
 */
export class EmptyCartError {
    readonly _tag = 'EmptyCartError' as const;
    constructor(readonly userId: string) { }
    get message() {
        return `Cannot checkout empty cart for user: ${this.userId}`;
    }
}

/**
 * Error when a repository operation fails unexpectedly.
 * Wraps the underlying cause for debugging.
 */
export class RepositoryError {
    readonly _tag = 'RepositoryError' as const;
    constructor(
        readonly operation: string,
        readonly cause: unknown,
    ) { }
    get message() {
        return `Repository operation failed: ${this.operation}`;
    }
}
