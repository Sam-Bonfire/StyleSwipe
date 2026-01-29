import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

// =============================================================================
// ADMIN DASHBOARD QUERIES
// =============================================================================

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        // In a real production app, we would use a dedicated counters table.
        // For this MVP, we'll just fetch specific indexes or limited counts.

        // const _products = await ctx.db.query("products").take(1); // just to check existence? No we need counts.
        // Convex doesn't support efficient counting of full tables without iterating.
        // We will iterate but with a limit for safety, or assume low volume for now.

        // Efficiently estimate counts or just fetch recent items to show activity
        const recentUsers = await ctx.db.query("users").order("desc").take(5);

        const activeJobs = await ctx.db.query("scrape_jobs")
            .withIndex("by_status", (q) => q.eq("status", "processing"))
            .collect();

        // For total counts in MVP, we might just have to collect all IDs (lightweight) if tables are small (<10k)
        // Or just show "Recents" in stats for now to be safe.
        // Let's try to collect all ID's for accuracy if it's small, but cap it.

        return {
            totalUsers: (await ctx.db.query("users").collect()).length,
            totalProducts: (await ctx.db.query("products").collect()).length,
            activeJobs: activeJobs.length,
            recentUsers,
        };
    },
});

export const getScrapedProducts = query({
    args: {
        paginationOpts: paginationOptsValidator,
        filters: v.optional(v.object({
            brand: v.optional(v.string()),
            category: v.optional(v.string()),
        }))
    },
    handler: async (ctx, args) => {
        if (args.filters?.brand) {
            return await ctx.db
                .query("products")
                .withIndex("by_brand", (q) => q.eq("brand", args.filters!.brand!))
                .paginate(args.paginationOpts);
        }

        if (args.filters?.category) {
            return await ctx.db
                .query("products")
                .withIndex("by_category", (q) => q.eq("category", args.filters!.category!))
                .paginate(args.paginationOpts);
        }

        return await ctx.db
            .query("products")
            .withIndex("by_created")
            .order("desc")
            .paginate(args.paginationOpts);
    },
});

export const getScrapingJobs = query({
    args: {
        paginationOpts: paginationOptsValidator,
        status: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        if (args.status) {
            return await ctx.db
                .query("scrape_jobs")
                .withIndex("by_status", (q) => q.eq("status", args.status as any))
                .paginate(args.paginationOpts);
        }

        return await ctx.db
            .query("scrape_jobs")
            .withIndex("by_created")
            .order("desc")
            .paginate(args.paginationOpts);
    },
});

// =============================================================================
// ADMIN MUTATIONS
// =============================================================================

export const retriggerScrape = mutation({
    args: { productId: v.id("products") },
    handler: async (ctx, args) => {
        const product = await ctx.db.get(args.productId);
        if (!product) throw new Error("Product not found");

        // Logic to schedule a scrape
        // For now, we'll just create a new scrape job
        await ctx.db.insert("scrape_jobs", {
            type: "single",
            query: product.meta?.url || "", // Assuming URL is backed up in meta
            status: "pending",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});
