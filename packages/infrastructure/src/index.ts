// =============================================================================
// INFRASTRUCTURE PACKAGE BARREL EXPORT
// Exports all adapters, factories, and hooks
// =============================================================================

// Convex Adapters
export * from './convex';

export { ConvexReactClient } from 'convex/react';
export { ConvexClient, ConvexHttpClient } from 'convex/browser';

// Auth Adapter
export * from './auth/AuthAdapter';
export * from './auth/AuthServiceAdapter';

// Queue Adapters
export * from './queue';

// Embedder Adapter
export * from './embedder';

// Hooks (React abstraction over Convex for UI layers)
export * from './hooks';
