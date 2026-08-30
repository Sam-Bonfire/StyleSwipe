// =============================================================================
// HOOKS BARREL EXPORT
// Consumer-app hooks (use in apps/consumer-app)
// =============================================================================

export * from './useConvexClient';
export { useCurrentUser, useGetOrCreateUser, useAuthActions } from './useAuth';
export { useLatestProducts, useProduct, useProductsByIds } from './useProducts';
export {
  useRecentlyViewed,
  useRecordProductView,
  useVectorFeed,
  useProcessSwipe,
} from './useDiscovery';
export {
  useCart,
  useAddToCart,
  useRemoveFromCart,
  useUpdateCartQuantity,
  useClearCart,
} from './useCart';
export { useMyFeedback, useCreateFeedback, useGenerateUploadUrl } from './useFeedback';
export { useUpdateUser, useUpdateStyleProfile } from './useUsers';
export * from './useOnboarding';
export * from './useAnalytics';
export * from './usePartnerSync';
export { useSearch } from './useSearch';
export { useSystemBoard, useTrackPurchaseClick, useWishlist, useToggleWishlist, useBoard, useAddBoardItem, useRemoveBoardItem } from './useBoards';

// =============================================================================
// ADMIN HOOKS (use in apps/admin-panel)
// =============================================================================

export * from './admin'; // Exports everything from admin/index.ts (Stats, Products, Jobs, Feedback)
export * from './admin/useOrganizationAdmin'; // Orgs, Users
export { useCreateScrapingJob } from './admin/useScraperJobs';
export * from './admin/useLogs';
