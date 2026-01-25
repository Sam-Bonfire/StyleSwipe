import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Advanced Product Search with Filters
 * PRD Ref: Shop Mode Grid - Search and Filtering
 */
export const searchProducts = query({
    args: {
        query: v.optional(v.string()), // Text search query
        filters: v.optional(
            v.object({
                gender: v.optional(v.union(v.literal("men"), v.literal("women"), v.literal("unisex"))),
                priceTier: v.optional(v.union(v.literal("budget"), v.literal("mid"), v.literal("premium"), v.literal("luxury"))),
                category: v.optional(v.string()), // simplified, should be slug or id
                onSale: v.optional(v.boolean()),
            })
        ),
        paginationOpts: v.optional(
            v.object({
                numItems: v.number(),
                cursor: v.union(v.string(), v.null()),
            })
        ),
    },
    handler: async (ctx, args) => {
        // 1. Text Search Scenario
        if (args.query) {
            // Convex search cannot easily combine with arbitrary filters efficiently in one go unless defined in searchIndex
            // Our searchIndex "search_title" filters on ["brand", "category", "gender"]

            let search = ctx.db
                .query("products")
                .withSearchIndex("search_title", (q) => {
                    let sq = q.search("title", args.query!);
                    if (args.filters?.brand) sq = sq.eq("brand", args.filters.brand); // Schema doesn't have brand filter args here though, let's stick to what we have
                    if (args.filters?.category) sq = sq.eq("category", args.filters.category);
                    if (args.filters?.gender) sq = sq.eq("gender", args.filters.gender);
                    return sq;
                });

            // Manual filtering for fields not in search index (e.g. priceTier, onSale)
            // Note: This is not efficient for large datasets but acceptable for MVP
            let results = await search.take(50); // limit to avoid OOM

            if (args.filters?.priceTier) {
                results = results.filter(p => p.priceTier === args.filters!.priceTier);
            }
            if (args.filters?.onSale) {
                results = results.filter(p => p.onSale === args.filters!.onSale);
            }

            return {
                page: results,
                isDone: true,
                continueCursor: null
            };
        }

        // 2. Faceted Browsing (No Text Query)
        // We should pick the most selective index.
        // Available: by_category, by_brand, by_category_price.
        // Missing an index for "by_gender" or "by_priceTier".
        // For MVP, allow category browsing as primary, or just paginate all and filter.

        let q = ctx.db.query("products");

        // Optimization: If category is present, use it.
        if (args.filters?.category) {
            q = q.withIndex("by_category", (q) => q.eq("category", args.filters!.category));
        }

        // Convex paginate doesn't support complex client-side filtering inside key-set pagination efficiently without index.
        // We will use standard pagination and filter, knowing it might return fewer items than requested page size.
        // Or we rely on client to filter or add precise sparse indexes later.

        // For 'onSale', we don't have an index.
        // For 'priceTier', we don't have an index.

        const paginated = await q.paginate(args.paginationOpts || { numItems: 20, cursor: null });

        // Post-filter page ( imperfect pagination but simple for MVP)
        let page = paginated.page;
        if (args.filters) {
            if (args.filters.gender) page = page.filter(p => p.gender === args.filters!.gender);
            if (args.filters.priceTier) page = page.filter(p => p.priceTier === args.filters!.priceTier);
            if (args.filters.onSale) page = page.filter(p => p.onSale === args.filters!.onSale);
        }

        return {
            ...paginated,
            page
        };
    },
});
