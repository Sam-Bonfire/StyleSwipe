import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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
        myntraId: v.string(),
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
            myntraId: v.string(),
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

async function saveInternal(ctx: any, args: { myntraId: string, url: string, data: any }) {
    const existing = await ctx.db
        .query("scraped_products")
        .withIndex("by_myntraId", (q: any) => q.eq("myntraId", args.myntraId))
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
async function promoteInternal(ctx: any, scrapedProductId: any) {
    const scraped = await ctx.db.get(scrapedProductId);
    if (!scraped) return;

    const data = scraped.data;

    // Check if it's already a mapped object from extension or raw pdpData
    const isMapped = !!data.myntraId;

    const price = isMapped ? (data.price || 0) : (data.price?.discounted || 0);

    // Ensure Occasion is an array
    let occasion = isMapped ? data.attributes?.occasion : data.articleAttributes?.['Occasion'];
    if (typeof occasion === 'string') {
        occasion = [occasion];
    } else if (!Array.isArray(occasion)) {
        occasion = [];
    }

    // Ensure Color is a string
    const color = isMapped ? (data.attributes?.color || data.attributes?.baseColor) : (data.articleAttributes?.['Color'] || data.baseColor);

    const productFields = {
        brand: isMapped ? (data.brand || "Unknown") : (data.brand?.name || "Unknown"),
        title: isMapped ? (data.title || "Unknown Product") : (data.name || "Unknown Product"),
        price: price,
        mrp: isMapped ? (data.mrp || 0) : (data.price?.mrp || 0),
        category: isMapped ? (data.category || "Default") : "Default",
        images: isMapped ? (data.images?.map((img: any) => typeof img === 'string' ? img : img.src) || []) : (data.media?.albums?.[0]?.images?.map((img: any) => img.src) || []),
        description: isMapped ? (data.description || "") : (data.productDetails?.description || ""),
        rating: isMapped ? data.rating : (data.ratings?.averageRating),
        reviewCount: isMapped ? data.reviewCount : (data.ratings?.totalCount),
        platform: "Myntra",
        gender: (isMapped && data.gender) ? (data.gender.toLowerCase() as any) : "unisex",
        priceTier: (price < 1000) ? "budget" : (price < 3000) ? "mid" : (price < 10000) ? "premium" : "luxury", // Simple heuristic
        onSale: price < (isMapped ? (data.mrp || 0) : (data.price?.mrp || 0)),
        attributes: {
            // Strictly map ONLY schema fields
            color: color || undefined,
            size: isMapped ? data.availableSizes : [],
            material: isMapped ? (data.attributes?.material || data.attributes?.['Fabric']) : (data.articleAttributes?.['Fabric']),
            fit: isMapped ? (data.attributes?.fit || data.attributes?.['Fit']) : (data.articleAttributes?.['Fit']),
            occasion: occasion.length > 0 ? occasion : undefined,
            care: isMapped ? (data.attributes?.care || data.attributes?.['Wash Care']) : (data.articleAttributes?.['Wash Care']),
            origin: isMapped ? (data.attributes?.origin || data.attributes?.['Country of Origin']) : (data.articleAttributes?.['Country of Origin']),
            style: isMapped ? (data.attributes?.style || data.attributes?.['Style Note']) : (data.articleAttributes?.['Style Note']),
            sleeve: isMapped ? (data.attributes?.sleeve || data.attributes?.['Sleeve Length']) : (data.articleAttributes?.['Sleeve Length']),
            neck: isMapped ? (data.attributes?.neck || data.attributes?.['Neck']) : (data.articleAttributes?.['Neck']),
            season: isMapped ? (data.attributes?.season || data.attributes?.['Season']) : (data.articleAttributes?.['Season']),
            collection: isMapped ? (data.attributes?.collection || data.attributes?.['Collection Name']) : (data.articleAttributes?.['Collection Name']),
        },
        meta: {
            scrapedAt: scraped.lastScrapedAt,
            originalUrl: scraped.url,
            myntraId: scraped.myntraId
        },
        updatedAt: Date.now(),
    };

    // Try to link to Category ID
    const categorySlug = productFields.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const categoryDoc = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q: any) => q.eq("slug", categorySlug))
        .first();

    if (categoryDoc) {
        // @ts-ignore
        productFields.categoryId = categoryDoc._id;
    }

    const existingProduct = await ctx.db
        .query("products")
        .withIndex("by_brand_title", (q: any) =>
            q.eq("brand", productFields.brand).eq("title", productFields.title)
        )
        .first();

    if (existingProduct) {
        await ctx.db.patch(existingProduct._id, productFields);
    } else {
        await ctx.db.insert("products", {
            ...productFields,
            createdAt: Date.now(),
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
    args: { paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
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
