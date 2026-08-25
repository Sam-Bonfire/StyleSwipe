 
// Shared Domain Types & Ports
export * from '../shared/domain/types';
export * from '../shared/domain/errors';
export * from '../shared/application/ports';

// Catalog
export * from './catalog/domain/TaggingService';
export * as TagProduct from './catalog/application/TagProduct';
export * as BrowseCatalog from './catalog/application/BrowseCatalog';
export * as ManageAdminDashboard from './catalog/application/ManageAdminDashboard';
export * as ManageScrapingJobs from './catalog/application/ManageScrapingJobs';

// Identity
export { AuthSessionSchema, AuthSessionService } from './identity/domain/AuthSession';
export type { AuthSession, DeviceContext } from './identity/domain/AuthSession';
export * from './identity/domain/IdentityAccount';
export * from './identity/domain/Permissions';
export * from './identity/domain/Role';
export * from './identity/domain/StyleDNA';
export * from './identity/domain/Auth';
export * from './identity/domain/errors';
export * from './identity/application/AuthPorts';
export * from './identity/application/OtpPorts';
export * as InitializeStyleProfile from './identity/application/InitializeStyleProfile';
export * as GetOnboardingQuestions from './identity/application/GetOnboardingQuestions';
export * as ManageFeedback from './identity/application/ManageFeedback';
export * as ManageUserProfile from './identity/application/ManageUserProfile';
export * as ManageOrganizations from './identity/application/ManageOrganizations';
export * as ManageLogs from './identity/application/ManageLogs';
export * as ManageAdminFeedback from './identity/application/ManageAdminFeedback';
export * as IdentityUseCases from './identity/application/IdentityUseCases';
export * as CompleteOnboarding from './identity/application/CompleteOnboarding';
// Commerce
export * from './commerce/domain/Cart';
export * from './commerce/application/CartRepository';
export * from './commerce/application/CheckoutService';
export * from './commerce/domain/PriceEstimator';
export * from './commerce/domain/Order';
export * from './commerce/domain/errors';
export * as ManageCart from './commerce/application/ManageCart';
export * as CheckoutService from './commerce/application/CheckoutService';

// Discovery
export * from './discovery/domain';
export * from './discovery/application/DiscoveryPorts';
export * as SearchProducts from './discovery/application/SearchProducts';
export * as ProcessSwipe from './discovery/application/ProcessSwipe';
export * as RecordInteraction from './discovery/application/RecordInteraction';
export * as GetRecommendations from './discovery/application/GetRecommendations';

// Feedback
export * from './feedback/domain';

// Notifications
export * from './notifications/domain';

// Audit
export * from './audit/domain';
// Social
export * from './social/domain/PartnerSyncSession';
export * from './social/domain/StyleBoard';

// Affiliate
export * from './affiliate/domain/AffiliateRedirect';
// Discovery Domain
export * from './discovery/domain/SwipeEvent';
export * from './discovery/domain/RecommendationScore';

// Identity Domain
export * from './identity/domain/Onboarding';
