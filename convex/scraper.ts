import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const createJob = mutation({
    args: {
        type: v.union(v.literal("category"), v.literal("search"), v.literal("single")),
        query: v.string(),
    },
    handler: async (ctx, args) => {
        const jobId = await ctx.db.insert("scrape_jobs", {
            ...args,
            status: "pending",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return jobId;
    },
});

export const updateJobStatus = mutation({
    args: {
        jobId: v.id("scrape_jobs"),
        status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
        productsFound: v.optional(v.number()),
        errorMessage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { jobId, ...updates } = args;
        await ctx.db.patch(jobId, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

export const saveProduct = mutation({
    args: {
        externalId: v.string(),
        url: v.string(),
        data: v.any(),
    },
    handler: async (ctx, args) => {
        await saveInternal(ctx, args);
    },
});

export const saveBatch = mutation({
    args: {
        products: v.array(v.object({
            externalId: v.string(),
            url: v.string(),
            data: v.any(),
        })),
    },
    handler: async (ctx, args) => {
        for (const product of args.products) {
            await saveInternal(ctx, product);
        }
    },
});

async function saveInternal(ctx: MutationCtx, args: { externalId: string, url: string, data: any }) {
    const existing = await ctx.db
        .query("scraped_products")
        .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
        .first();

    let scrapedId;
    if (existing) {
        await ctx.db.patch(existing._id, {
            data: args.data,
            lastScrapedAt: Date.now(),
            status: "active",
        });
        scrapedId = existing._id;
    } else {
        scrapedId = await ctx.db.insert("scraped_products", {
            ...args,
            lastScrapedAt: Date.now(),
            status: "active",
        });
    }

    // Auto-promote to catalog
    await promoteInternal(ctx, scrapedId);
}

// Internal helper for promotion to keep logic DRY
async function promoteInternal(ctx: MutationCtx, scrapedProductId: Id<"scraped_products">) {
    const scraped = await ctx.db.get(scrapedProductId);
    if (!scraped) return;

    const data = scraped.data;

    // Check if it's already a mapped object from extension or raw pdpData
    const isMapped = !!data.externalId;

    const price = isMapped ? (data.price || 0) : (data.price?.discounted || 0);

    // Ensure Occasion is an array
    let occasion = isMapped ? data.attributes?.occasion : data.articleAttributes?.['Occasion'];
    if (typeof occasion === 'string') {
        occasion = [occasion];
    } else if (!Array.isArray(occasion)) {
        occasion = [];
    }

    // Ensure Color is a string
    const color = isMapped ?
        (data.attributes?.color || data.attributes?.colour || data.attributes?.primaryColor || data.attributes?.primaryColour || data.attributes?.baseColor || data.attributes?.baseColour) :
        (data.primaryColor || data.primaryColour || data.baseColor || data.baseColour || data.articleAttributes?.['Color'] || data.articleAttributes?.['Colour']);

    // Ensure category is a string (handle objects like {typeName: "..."})
    let category = "";
    if (isMapped && data.category) {
        category = typeof data.category === 'string' ? data.category : (data.category.typeName || data.category.name || "");
    }

    let masterCategory = "";
    if (isMapped && data.masterCategory) {
        masterCategory = typeof data.masterCategory === 'string' ? data.masterCategory : (data.masterCategory.typeName || data.masterCategory.name || "");
    } else if (data.analytics?.masterCategory) {
        masterCategory = typeof data.analytics.masterCategory === 'string' ? data.analytics.masterCategory : (data.analytics.masterCategory.typeName || data.analytics.masterCategory.name || "");
    }

    let subCategory = "";
    if (isMapped && data.subCategory) {
        subCategory = typeof data.subCategory === 'string' ? data.subCategory : (data.subCategory.typeName || data.subCategory.name || "");
    } else if (data.analytics?.subCategory) {
        subCategory = typeof data.analytics.subCategory === 'string' ? data.analytics.subCategory : (data.analytics.subCategory.typeName || data.analytics.subCategory.name || "");
    }

    const productFields = {
        brand: isMapped ? (data.brand || "") : (data.brand?.name || ""),
        title: isMapped ? (data.title || "") : (data.name || ""),
        price: price,
        mrp: isMapped ? (data.mrp || 0) : (data.price?.mrp || 0),
        category: category,
        masterCategory: masterCategory,
        subCategory: subCategory,
        images: isMapped ? (Array.isArray(data.images) ? data.images : []) : (data.media?.albums?.flatMap((album: { images?: { src: string }[] }) => album.images?.map((img) => img.src)) || []),
        description: isMapped ? (data.description || "") : (data.description || data.productDetails?.description || ""),
        rating: isMapped ? data.rating : (data.ratings?.averageRating),
        reviewCount: isMapped ? data.reviewCount : (data.ratings?.totalCount),
        platform: "Myntra",
        gender: (isMapped && data.gender && ["men", "women", "unisex"].includes(data.gender.toLowerCase()))
            ? (data.gender.toLowerCase() as "men" | "women" | "unisex")
            : undefined,
        priceTier: ((price < 1000) ? "budget" : (price < 3000) ? "mid" : (price < 10000) ? "premium" : "luxury") as "budget" | "mid" | "premium" | "luxury",
        onSale: price < (isMapped ? (data.mrp || 0) : (data.price?.mrp || 0)),
        embedding: data.embedding || undefined, // Prioritize client-side embedding
        attributes: isMapped ? {
            ...(data.attributes || {}),
            size: data.availableSizes || data.attributes?.size || [],
            inventoryInfo: data.inventoryInfo || data.attributes?.inventoryInfo,
        } : {
            // Fallback for raw data
            ...data.articleAttributes,
            color: color || undefined,
            size: (data.inventoryInfo && Array.isArray(data.inventoryInfo))
                ? data.inventoryInfo.filter((i: { available?: boolean; inventory?: number }) => i.available || (i.inventory && i.inventory > 0)).map((i: { brandSizeLabel?: string; label: string }) => i.brandSizeLabel || i.label)
                : (data.availableSizes || []),
            inventoryInfo: data.inventoryInfo || data.style?.inventoryInfo,
        },
        meta: {
            scrapedAt: scraped.lastScrapedAt,
            originalUrl: scraped.url,
            externalId: scraped.externalId,
            rawAttributes: data.attributes
        },
        externalId: scraped.externalId, // Top-level for indexing
        updatedAt: Date.now(),
    };

    // Removed categoryId lookup - field no longer in schema

    let existingProduct: Doc<"products"> | null = null;
    if (productFields.externalId) {
        existingProduct = await ctx.db
            .query("products")
            .withIndex("by_externalId", (q) => q.eq("externalId", productFields.externalId))
            .first();
    } else {
        // Only fallback to Brand/Title if we don't have a reliable platform ID
        existingProduct = await ctx.db
            .query("products")
            .withIndex("by_brand_title", (q) =>
                q.eq("brand", productFields.brand).eq("title", productFields.title)
            )
            .first();
    }

    if (existingProduct) {
        await ctx.db.patch(existingProduct._id, productFields);
    } else {
        await ctx.db.insert("products", {
            ...productFields,
            // createdAt removed as it is auto-handled by system _creationTime or not needed
        });
    }
}

export const getPendingJobs = query({
    handler: async (ctx) => {
        return await ctx.db
            .query("scrape_jobs")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .take(5);
    },
});

export const getJobs = query({
    args: { paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("scrape_jobs")
            .order("desc")
            .paginate(args.paginationOpts);
    },
});

export const getProducts = query({
    args: { paginationOpts: v.optional(paginationOptsValidator) },
    handler: async (ctx, args) => {
        if (!args.paginationOpts) {
            return await ctx.db.query("scraped_products").order("desc").paginate({ numItems: 20, cursor: null });
        }
        return await ctx.db
            .query("scraped_products")
            .order("desc")
            .paginate(args.paginationOpts);
    },
});
export const promoteToCatalog = mutation({
    args: {
        scrapedProductId: v.id("scraped_products"),
    },
    handler: async (ctx, args) => {
        await promoteInternal(ctx, args.scrapedProductId);
    },
});

// =============================================================================
// SIMPLER QUERIES FOR SCRAPER API
// =============================================================================

export const getJobsSimple = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 20;
        return await ctx.db
            .query("scrape_jobs")
            .order("desc")
            .take(limit);
    },
});

export const getJob = query({
    args: { jobId: v.id("scrape_jobs") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.jobId);
    },
});

export const getScrapedProducts = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;
        return await ctx.db
            .query("scraped_products")
            .order("desc")
            .take(limit);
    },
});

