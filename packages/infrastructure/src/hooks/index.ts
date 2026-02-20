// =============================================================================
// HOOKS BARREL EXPORT
// Consumer-app hooks (use in apps/consumer-app)
// =============================================================================

export * from './useConvexClient';
export { useCurrentUser, useGetOrCreateUser } from './useAuth';
export { useLatestProducts, useProduct } from './useProducts';
export {
    useRecentlyViewed,
    useRecordProductView,
    useVectorFeed,
    useProcessSwipe,
} from './useDiscovery';
export { useCart, useAddToCart, useRemoveFromCart, useUpdateCartQuantity, useClearCart } from './useCart';
export { useMyFeedback, useCreateFeedback, useGenerateUploadUrl } from './useFeedback';
export { useUpdateUser, useUpdateStyleProfile } from './useUsers';
export { useSearch } from './useSearch';

// =============================================================================
// ADMIN HOOKS (use in apps/admin-panel)
// =============================================================================

export * from './admin'; // Exports everything from admin/index.ts (Stats, Products, Jobs, Feedback)
export * from './admin/useOrganizationAdmin'; // Orgs, Users
export { useCreateScrapingJob } from './admin/useScraperJobs';
export * from './admin/useLogs';
