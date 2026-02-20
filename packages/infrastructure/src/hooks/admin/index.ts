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

import { createAdminRepositoryLayer } from '../../convex/repositories/AdminRepository';
import { createFeedbackRepositoryLayer } from '../../convex/repositories/FeedbackRepository';

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
    return (args: { url: string }) => {
        const program = ManageAdminDashboard.retriggerScrape(args.url);
        const layer = createAdminRepositoryLayer(convex as unknown as ConvexClient);
        return Effect.runPromise(program.pipe(Effect.provide(layer as any)) as any);
    }
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
    return (args: { id: string; status: string }) => {
        const program = ManageAdminFeedback.updateStatus(args.id, args.status as FeedbackStatus);
        const layer = createFeedbackRepositoryLayer(convex as unknown as ConvexClient);
        return Effect.runPromise(program.pipe(Effect.provide(layer as any)) as any);
    }
}

/**
 * Write — reply to feedback.
 */
export function useReplyToFeedback() {
    const convex = useConvex();
    return (args: { id: string; message: string; adminId?: string }) => {
        const program = ManageAdminFeedback.reply(args.id, args.adminId || '', args.message);
        const layer = createFeedbackRepositoryLayer(convex as unknown as ConvexClient);
        return Effect.runPromise(program.pipe(Effect.provide(layer as any)) as any);
    }
}
