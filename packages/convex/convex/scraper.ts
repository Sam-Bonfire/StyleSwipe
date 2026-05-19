import { paginationOptsValidator, FunctionReference, RegisteredQuery } from 'convex/server';
import { v } from 'convex/values';

import { Doc, Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { MutationCtx } from './_generated/server';
import { requireCoreAdmin } from './permissions';

export const createJob = mutation({
  args: {
    type: v.union(v.literal('category'), v.literal('search'), v.literal('single')),
    query: v.string(),
    maxPages: v.optional(v.number()),
    startPage: v.optional(v.number()),
    scraperMode: v.optional(v.union(v.literal('API'), v.literal('BROWSER'))),
  },
  handler: async (ctx, args) => {
    await requireCoreAdmin(ctx);
    const jobId = await ctx.db.insert('scrape_jobs', {
      ...args,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return jobId;
  },
});

export const updateJobStatus = mutation({
  args: {
    jobId: v.id('scrape_jobs'),
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed'),
    ),
    productsFound: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCoreAdmin(ctx);
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
    embedding: v.optional(v.array(v.float64())),
  },
  handler: async (ctx, args) => {
    await saveInternal(ctx, args);
  },
});

export const saveBatch = mutation({
  args: {
    products: v.array(
      v.object({
        externalId: v.string(),
        url: v.string(),
        data: v.any(),
        embedding: v.optional(v.array(v.float64())),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const product of args.products) {
      await saveInternal(ctx, product);
    }
  },
});

async function saveInternal(
  ctx: MutationCtx,
  args: { externalId: string; url: string; data: any; embedding?: number[] },
) {
  const existing = await ctx.db
    .query('scraped_products')
    .withIndex('by_externalId', (q) => q.eq('externalId', args.externalId))
    .first();

  let scrapedId;
  // Ensure embedding is NOT in the data object stored in scraped_products
  const { embedding: _emb, ...cleanData } = args.data; // Try to strip if present in data
  // Also strip from args.data if it was passed there?
  // The worker might pass it in data OR separate. We'll rely on args.embedding.

  if (existing) {
    await ctx.db.patch(existing._id, {
      data: cleanData, // Storing raw data without embedding
      lastScrapedAt: Date.now(),
      status: 'active',
    });
    scrapedId = existing._id;
  } else {
    scrapedId = await ctx.db.insert('scraped_products', {
      externalId: args.externalId,
      url: args.url,
      data: cleanData,
      lastScrapedAt: Date.now(),
      status: 'active',
    });
  }

  // Auto-promote to catalog with the transient embedding
  await promoteInternal(ctx, scrapedId, args.embedding);
}

// Internal helper for promotion to keep logic DRY
async function promoteInternal(
  ctx: MutationCtx,
  scrapedProductId: Id<'scraped_products'>,
  embeddingOverride?: number[],
) {
  const scraped = await ctx.db.get(scrapedProductId);
  if (!scraped) return;

  const data = scraped.data;

  // Check if it's already a mapped object from extension or raw pdpData
  const isMapped = !!data.externalId;

  const price = isMapped ? data.price || 0 : data.price?.discounted || 0;

  // Ensure Occasion is an array
  let occasion = isMapped ? data.attributes?.occasion : data.articleAttributes?.['Occasion'];
  if (typeof occasion === 'string') {
    occasion = [occasion];
  } else if (!Array.isArray(occasion)) {
    occasion = [];
  }

  // Ensure Color is a string
  const color = isMapped
    ? data.attributes?.color ||
    data.attributes?.colour ||
    data.attributes?.primaryColor ||
    data.attributes?.primaryColour ||
    data.attributes?.baseColor ||
    data.attributes?.baseColour
    : data.primaryColor ||
    data.primaryColour ||
    data.baseColor ||
    data.baseColour ||
    data.articleAttributes?.['Color'] ||
    data.articleAttributes?.['Colour'];

  // Ensure category is a string (handle objects like {typeName: "..."})
  let category = '';
  if (isMapped && data.category) {
    category =
      typeof data.category === 'string'
        ? data.category
        : data.category.typeName || data.category.name || '';
  }

  let masterCategory = '';
  if (isMapped && data.masterCategory) {
    masterCategory =
      typeof data.masterCategory === 'string'
        ? data.masterCategory
        : data.masterCategory.typeName || data.masterCategory.name || '';
  } else if (data.analytics?.masterCategory) {
    masterCategory =
      typeof data.analytics.masterCategory === 'string'
        ? data.analytics.masterCategory
        : data.analytics.masterCategory.typeName || data.analytics.masterCategory.name || '';
  }

  let subCategory = '';
  if (isMapped && data.subCategory) {
    subCategory =
      typeof data.subCategory === 'string'
        ? data.subCategory
        : data.subCategory.typeName || data.subCategory.name || '';
  } else if (data.analytics?.subCategory) {
    subCategory =
      typeof data.analytics.subCategory === 'string'
        ? data.analytics.subCategory
        : data.analytics.subCategory.typeName || data.analytics.subCategory.name || '';
  }

  const rawImages: string[] = isMapped
    ? (Array.isArray(data.images) ? data.images : [])
    : data.media?.albums?.flatMap((album: { images?: { src: string }[] }) =>
      album.images?.map((img) => img.src),
    ) || [];
  const uniqueImages = Array.from(new Set(rawImages.filter((img) => typeof img === 'string')));

  const activeEmbedding = embeddingOverride || data.embedding || undefined;

  const productFields = {
    brand: isMapped ? data.brand || '' : data.brand?.name || '',
    title: isMapped ? data.title || '' : data.name || '',
    price: price,
    mrp: isMapped ? data.mrp || 0 : data.price?.mrp || 0,
    category: category,
    masterCategory: masterCategory,
    subCategory: subCategory,
    images: uniqueImages,
    description: isMapped
      ? data.description || ''
      : data.description || data.productDetails?.description || '',
    rating: isMapped ? data.rating : data.ratings?.averageRating,
    reviewCount: isMapped ? data.reviewCount : data.ratings?.totalCount,
    platform: 'Myntra',
    gender:
      isMapped && data.gender && ['men', 'women', 'unisex'].includes(data.gender.toLowerCase())
        ? (data.gender.toLowerCase() as 'men' | 'women' | 'unisex')
        : undefined,
    priceTier: (price < 1000
      ? 'budget'
      : price < 3000
        ? 'mid'
        : price < 10000
          ? 'premium'
          : 'luxury') as 'budget' | 'mid' | 'premium' | 'luxury',
    onSale: price < (isMapped ? data.mrp || 0 : data.price?.mrp || 0),
    embedding: activeEmbedding, // Use override first, then fallback to data (legacy)
    attributes: isMapped
      ? {
        ...(data.attributes || {}),
        size: data.availableSizes || data.attributes?.size || [],
        inventoryInfo: data.inventoryInfo || data.attributes?.inventoryInfo,
      }
      : {
        // Fallback for raw data
        ...data.articleAttributes,
        color: color || undefined,
        size:
          data.inventoryInfo && Array.isArray(data.inventoryInfo)
            ? data.inventoryInfo
              .filter(
                (i: { available?: boolean; inventory?: number }) =>
                  i.available || (i.inventory && i.inventory > 0),
              )
              .map(
                (i: { brandSizeLabel?: string; label: string }) => i.brandSizeLabel || i.label,
              )
            : data.availableSizes || [],
        inventoryInfo: data.inventoryInfo || data.style?.inventoryInfo,
      },
    meta: {
      scrapedAt: scraped.lastScrapedAt,
      originalUrl: scraped.url,
      externalId: scraped.externalId,
    },
    externalId: scraped.externalId, // Top-level for indexing
    updatedAt: Date.now(),
  };

  // Removed categoryId lookup - field no longer in schema

  let existingProduct: Doc<'products'> | null = null;
  if (productFields.externalId) {
    existingProduct = await ctx.db
      .query('products')
      .withIndex('by_externalId', (q) => q.eq('externalId', productFields.externalId))
      .first();
  } else {
    // Only fallback to Brand/Title if we don't have a reliable platform ID
    existingProduct = await ctx.db
      .query('products')
      .withIndex('by_brand_title', (q) =>
        q.eq('brand', productFields.brand).eq('title', productFields.title),
      )
      .first();
  }

  let productId: Id<'products'>;
  if (existingProduct) {
    // If updating without new embedding, preserve old one?
    // No, current logic overwrites. If embeddingOverride is undefined, productFields.embedding is undefined.
    // But patch helper merges? No, patch updates keys present.
    // Check if v.optional means explicit null or undefined deletes it?
    // Convex patch: undefined fields in object are NOT updated. explicit null deletes.
    // productFields.embedding is undefined if missing. So it won't overwrite existing embedding in DB. Good.
    await ctx.db.patch(existingProduct._id, productFields);
    productId = existingProduct._id;
  } else {
    productId = await ctx.db.insert('products', {
      ...productFields,
      // createdAt removed as it is auto-handled by system _creationTime or not needed
    });
  }

  // Dual-Write to the product_embeddings table
  if (activeEmbedding) {
    const existingEmbedding = await ctx.db
      .query('product_embeddings')
      .withIndex('by_productId', (q) => q.eq('productId', productId))
      .first();

    const embeddingFields = {
      productId,
      embeddingVersions: {
        v1: activeEmbedding,
      },
      category: productFields.category,
      gender: productFields.gender,
      priceTier: productFields.priceTier,
      updatedAt: Date.now(),
    };

    if (existingEmbedding) {
      await ctx.db.patch(existingEmbedding._id, embeddingFields);
    } else {
      await ctx.db.insert('product_embeddings', embeddingFields);
    }
  }
}

export const getPendingJobs: RegisteredQuery<"public", any, any> = query({
  handler: async (ctx): Promise<any> => {
    await requireCoreAdmin(ctx);
    return await ctx.db
      .query('scrape_jobs')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .take(5);
  },
}) as any;

export const getJobs = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireCoreAdmin(ctx);
    return await ctx.db.query('scrape_jobs').order('desc').paginate(args.paginationOpts);
  },
});

export const getProducts = query({
  args: { paginationOpts: v.optional(paginationOptsValidator) },
  handler: async (ctx, args) => {
    await requireCoreAdmin(ctx);
    if (!args.paginationOpts) {
      return await ctx.db
        .query('scraped_products')
        .order('desc')
        .paginate({ numItems: 20, cursor: null });
    }
    return await ctx.db.query('scraped_products').order('desc').paginate(args.paginationOpts);
  },
});
export const promoteToCatalog = mutation({
  args: {
    scrapedProductId: v.id('scraped_products'),
  },
  handler: async (ctx, args) => {
    await requireCoreAdmin(ctx);
    await promoteInternal(ctx, args.scrapedProductId);
  },
});

// =============================================================================
// SIMPLER QUERIES FOR SCRAPER API
// =============================================================================

export const getJobsSimple = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireCoreAdmin(ctx);
    const limit = args.limit ?? 20;
    return await ctx.db.query('scrape_jobs').order('desc').take(limit);
  },
});

export const getJob = query({
  args: { jobId: v.id('scrape_jobs') },
  handler: async (ctx, args) => {
    await requireCoreAdmin(ctx);
    return await ctx.db.get(args.jobId);
  },
});

export const getScrapedProducts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireCoreAdmin(ctx);
    const limit = args.limit ?? 50;
    return await ctx.db.query('scraped_products').order('desc').take(limit);
  },
});

// =============================================================================
// SERVICE ENDPOINTS (No Authentication Required)
// These are for the backend scraper service worker
// =============================================================================

/**
 * Service endpoint: Get pending jobs without authentication
 * Used by the scraper worker to poll for jobs
 */
export const servicePendingJobs: RegisteredQuery<"public", any, any> = query({
  handler: async (ctx): Promise<any> => {
    return await ctx.db
      .query('scrape_jobs')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .take(5);
  },
}) as any;

/**
 * Service endpoint: Update job status without authentication
 * Used by the scraper worker to update job progress
 */
export const serviceUpdateJobStatus = mutation({
  args: {
    jobId: v.id('scrape_jobs'),
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed'),
    ),
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

/**
 * Service endpoint: Save product without authentication
 * Used by the scraper worker to save scraped products
 */
export const serviceSaveProduct = mutation({
  args: {
    externalId: v.string(),
    url: v.string(),
    data: v.any(),
    embedding: v.optional(v.array(v.float64())),
  },
  handler: async (ctx, args) => {
    await saveInternal(ctx, args);
  },
});

/**
 * Service endpoint: Save batch of products without authentication
 * Used by the scraper worker to save multiple products at once
 */
export const serviceSaveBatch = mutation({
  args: {
    products: v.array(
      v.object({
        externalId: v.string(),
        url: v.string(),
        data: v.any(),
        embedding: v.optional(v.array(v.float64())),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const product of args.products) {
      await saveInternal(ctx, product);
    }
  },
});
