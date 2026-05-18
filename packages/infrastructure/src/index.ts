// =============================================================================
// INFRASTRUCTURE PACKAGE BARREL EXPORT
// Exports all adapters, factories, and hooks
// =============================================================================

// Convex Adapters
export * from './convex';

import { ConvexClient as BaseConvexClient, ConvexHttpClient as BaseConvexHttpClient } from 'convex/browser';
import { ConvexReactClient as BaseConvexReactClient } from 'convex/react';

export class ConvexReactClient extends BaseConvexReactClient {
  constructor(url: string, options?: any) {
    const sanitizedUrl = typeof url === 'string' ? url.replace(/\/+$/, '') : url;
    super(sanitizedUrl, options);
  }
}

export class ConvexClient extends BaseConvexClient {
  constructor(url: string, options?: any) {
    const sanitizedUrl = typeof url === 'string' ? url.replace(/\/+$/, '') : url;
    super(sanitizedUrl, options);
  }
}

export class ConvexHttpClient extends BaseConvexHttpClient {
  constructor(url: string) {
    const sanitizedUrl = typeof url === 'string' ? url.replace(/\/+$/, '') : url;
    super(sanitizedUrl);
  }
}

// Auth Adapter
export * from './auth/AuthAdapter';
export * from './auth/AuthServiceAdapter';

// Queue Adapters
export * from './queue';

// Embedder Adapter
export * from './embedder';

// Hooks (React abstraction over Convex for UI layers)
export * from './hooks';
