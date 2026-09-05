// =============================================================================
// HOOKS BARREL EXPORT
// Consumer-app hooks (use in apps/consumer-app)
// =============================================================================

export * from './useConvexClient';
export { useCurrentUser, useGetOrCreateUser, useAuthActions } from './useAuth';
export { useLatestProducts, useProduct, useProductsByIds, useProductSourceUrl, useSimilarProducts } from './useProducts';
export { useReviews, useReviewBreakdown, useAddReview, useMarkHelpful } from './useReviews';
export {
  useRecentlyViewed,
  useRecordProductView,
  useVectorFeed,
  useProcessSwipe,
  useUserSwipedIds,
  usePartnerLikes,
} from './useDiscovery';
export {
  useCart,
  useAddToCart,
  useRemoveFromCart,
  useUpdateCartQuantity,
  useClearCart,
} from './useCart';
export { useMyFeedback, useCreateFeedback, useGenerateUploadUrl } from './useFeedback';
export { useUpdateUser, useUpdateStyleProfile, useUpdatePushToken } from './useUsers';
export * from './useOnboarding';
export * from './useAnalytics';
export * from './usePartnerSync';
export * from './useNotifications';
export { useSearch } from './useSearch';
export {
  useSystemBoard,
  useTrackMerchantRedirect,
  useWishlist,
  useToggleWishlist,
  useBoard,
  useAddBoardItem,
  useRemoveBoardItem,
  useUserBoards,
  useCreateBoard,
  useRenameBoard,
  useDeleteBoard,
  useMoveBoardItem,
} from './useBoards';
export type { UserBoardSummary } from './useBoards';
export * from './useGuestCart';
export * from './useOrders';
export * from './useAddresses';
export * from './useFeatureFlag';
export * from './useCategories';
export * from './useTrending';

// =============================================================================
// ADMIN HOOKS (use in apps/admin-panel)
// =============================================================================

export * from './admin'; // Exports everything from admin/index.ts (Stats, Products, Jobs, Feedback)
export * from './admin/useOrganizationAdmin'; // Orgs, Users
export { useCreateScrapingJob } from './admin/useScraperJobs';
export * from './admin/useLogs';
