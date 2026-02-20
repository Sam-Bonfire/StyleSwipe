import type { Product } from '../../../shared/domain/types';
/**
 * Value Object validating the Swipe Action
 */
export type SwipeAction = 'like' | 'pass' | 'super';

// =============================================================================
// DISCOVERY CONTEXT PORTS
// Extends the base ports for discovery-specific operations
// =============================================================================

// -----------------------------------------------------------------------------
// RECENTLY VIEWED PORT
// -----------------------------------------------------------------------------

/**
 * Repository for tracking and retrieving recently viewed products
 */
export interface RecentlyViewedRepository {
    getRecentlyViewed(userId: string, limit: number): Promise<Product[]>;
    recordProductView(userId: string, productId: string): Promise<void>;
}

// -----------------------------------------------------------------------------
// SWIPE PORT
// -----------------------------------------------------------------------------

/**
 * Repository for persisting user swipe interactions
 */
export interface SwipeRepository {
    recordSwipe(
        userId: string,
        productId: string,
        action: SwipeAction,
        timestamp: number,
    ): Promise<void>;
    getSwipesByUser(userId: string, limit?: number): Promise<SwipeRecord[]>;
}

/**
 * Recorded swipe interaction
 */
export interface SwipeRecord {
    userId: string;
    productId: string;
    action: SwipeAction;
    timestamp: number;
}

// -----------------------------------------------------------------------------
// RECOMMENDATION PORT
// -----------------------------------------------------------------------------

/**
 * Service for AI-powered product recommendations
 */
export interface RecommendationService {
    getVectorFeed(
        userId: string,
        limit: number,
    ): Promise<Product[]>;
}
