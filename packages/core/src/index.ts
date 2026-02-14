/* eslint-disable hexagonal-architecture/enforce */
// Catalog
export * from './catalog/domain/TaggingService';

// Identity
// export * from './identity/User'; // Duplicated in shared/domain/types
// export * from "./identity/domain/StyleProfile"; // Duplicated in shared/domain/types
export * from './identity/domain/StyleDNA';
export * from './identity/application/InitializeStyleProfile';
export * from './identity/application/GetOnboardingQuestions';

// Shared Domain Types & Ports
export * from '../shared/domain/types';
export * from '../shared/domain/ports';

// Commerce
export * from './commerce/domain/Cart';
export * from './commerce/domain/CartRepository';
export * from './commerce/domain/PriceEstimator';
export * from './commerce/domain/Order';
export * from './commerce/domain/errors';
export * from './commerce/application/ManageCart';
export * from './commerce/application/CheckoutService';

// Discovery
export { EmbeddingError, SearchError } from './discovery/domain/ports';
export type { SearchResult, Embedder, ProductSearchRepository } from './discovery/domain/ports';
export * from './discovery/application/SearchProducts';
export * from './discovery/application/ProcessSwipe';
