import { useConvex as useConvexReact } from 'convex/react';

/**
 * Wrapper for useConvex to avoid direct imports from 'convex/react' in UI layer.
 * This keeps the dependency on Convex contained within the infrastructure layer.
 */
export function useConvexClient() {
    return useConvexReact();
}
