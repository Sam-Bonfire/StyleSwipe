import { api } from '@app/convex';
import { ManageAdminDashboard, ManageAdminFeedback } from '@app/core';
import { FeedbackStatus } from '@app/core/shared/domain/types';
import { ConvexClient } from 'convex/browser';
/**
 * Admin hooks — Dashboard, Products, Feedback, Scraping Jobs
 * Reads wrap Convex queries; writes route through admin use cases.
 */
import { useQuery, usePaginatedQuery, useConvex } from 'convex/react';
import { Effect } from 'effect';

import { ConvexAdminRepository, ConvexFeedbackRepository } from '../../convex/repositories';

// ---------------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------------

/**
 * Read — admin dashboard stats.
 */
export function useAdminStats() {
    return useQuery(api.admin.getStats);
}

// ---------------------------------------------------------------------------
// PRODUCTS
// ---------------------------------------------------------------------------

/**
 * Read — paginated scraped products.
 */
export function useScrapedProducts(initialNumItems: number = 20) {
    return usePaginatedQuery(api.admin.getScrapedProducts, {}, { initialNumItems });
}

/**
 * Read — search products (skips when query is undefined).
 */
export function useSearchProducts(query: string | undefined) {
    return useQuery(api.admin.searchProducts, query ? { query } : 'skip');
}

/**
 * Write — retrigger scrape for a product.
 */
export function useRetriggerScrape() {
    const convex = useConvex();
    const repo = new ConvexAdminRepository(convex as unknown as ConvexClient);
    const useCase = new ManageAdminDashboard(repo);
    // The old mutation took { url: string }, but the useCase takes productId. 
    // Is url actually productId? Let's assume the argument being passed acts as the identifier.
    // wait, ManageAdminDashboard.retriggerScrape(productId: string).
    // so we map { url } -> url.
    return (args: { url: string }) => Effect.runPromise(useCase.retriggerScrape(args.url));
}

// ---------------------------------------------------------------------------
// SCRAPING JOBS
// ---------------------------------------------------------------------------

/**
 * Read — paginated scraping jobs.
 */
export function useScrapingJobs(initialNumItems: number = 20) {
    return usePaginatedQuery(api.admin.getScrapingJobs, {}, { initialNumItems });
}

// ---------------------------------------------------------------------------
// FEEDBACK (Admin-side)
// ---------------------------------------------------------------------------

/**
 * Read — paginated feedback list.
 */
export function useAdminFeedback(initialNumItems: number = 20) {
    return usePaginatedQuery(api.feedback.list, {}, { initialNumItems });
}

/**
 * Write — update feedback status.
 */
export function useUpdateFeedbackStatus() {
    const convex = useConvex();
    const repo = new ConvexFeedbackRepository(convex as unknown as ConvexClient);
    const useCase = new ManageAdminFeedback(repo);
    return (args: { id: string; status: string }) => Effect.runPromise(useCase.updateStatus(args.id, args.status as FeedbackStatus));
}

/**
 * Write — reply to feedback.
 */
export function useReplyToFeedback() {
    const convex = useConvex();
    const repo = new ConvexFeedbackRepository(convex as unknown as ConvexClient);
    const useCase = new ManageAdminFeedback(repo);
    // AdminId can be left empty if the backend picks it up from the auth token, else we can pass it.
    // The previous mutation took { id, message }.
    return (args: { id: string; message: string; adminId?: string }) => Effect.runPromise(useCase.reply(args.id, args.adminId || '', args.message));
}
