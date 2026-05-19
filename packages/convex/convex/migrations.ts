import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

const BATCH_SIZE = 50;

/**
 * Migration Step 1: Batch-fetch products that have an embedding on the main table
 * but haven't been copied to the separate product_embeddings table yet.
 */
export const getUnmigratedProducts = query({
  args: {
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query('products');
    if (args.cursor !== undefined) {
      const cursorVal = args.cursor;
      query = query.filter((q) => q.gt(q.field('_creationTime'), cursorVal));
    }
    const products = await query.take(150);
    
    const unmigrated: any[] = [];
    let lastCursor: number | undefined = args.cursor;
    for (const p of products) {
      lastCursor = p._creationTime;
      if (p.embedding || p.embeddingVersions?.v1) {
        const embDoc = await ctx.db
          .query('product_embeddings')
          .withIndex('by_productId', (q) => q.eq('productId', p._id))
          .first();
          
        if (!embDoc) {
          unmigrated.push(p);
          if (unmigrated.length >= BATCH_SIZE) break;
        }
      }
    }
    return { unmigrated, lastCursor, evaluated: products.length };
  },
});

export const migrateBatch = mutation({
  args: {
    cursor: v.optional(v.number()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query('products');
    if (args.cursor !== undefined) {
      const cursorVal = args.cursor;
      query = query.filter((q) => q.gt(q.field('_creationTime'), cursorVal));
    }
    const products = await query.take(150);
    
    let count = 0;
    let lastCursor: number | undefined = args.cursor;
    for (const p of products) {
      lastCursor = p._creationTime;
      if (p.embedding || p.embeddingVersions?.v1) {
        const embDoc = await ctx.db
          .query('product_embeddings')
          .withIndex('by_productId', (q) => q.eq('productId', p._id))
          .first();
          
        if (!embDoc) {
          const activeEmbedding = p.embedding || p.embeddingVersions?.v1;
          await ctx.db.insert('product_embeddings', {
            productId: p._id,
            embeddingVersions: {
              v1: activeEmbedding,
            },
            category: p.category,
            gender: p.gender,
            priceTier: p.priceTier,
            updatedAt: Date.now(),
          });
          count++;
          if (count >= args.limit) break;
        }
      }
    }
    return { count, lastCursor, evaluated: products.length };
  },
});

/**
 * Migration Step 3: Run final cleanup batch to delete legacy embeddings from products
 * and reclaim database storage space! Supports a strict `dryRun` flag.
 */
export const purgeLegacyEmbeddings = mutation({
  args: {
    limit: v.number(),
    dryRun: v.boolean(),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db.query('products').take(args.limit);
    let count = 0;
    let verifiedCount = 0;
    let missingEmbeddingsInNewTable = 0;

    for (const p of products) {
      if (
        p.embedding !== undefined ||
        p.embeddingVersions !== undefined ||
        (p.meta && p.meta.rawAttributes !== undefined)
      ) {
        // Verification: Ensure the new table has the embedding before we purge!
        const embDoc = await ctx.db
          .query('product_embeddings')
          .withIndex('by_productId', (q) => q.eq('productId', p._id))
          .first();

        if (embDoc && embDoc.embeddingVersions?.v1) {
          verifiedCount++;
        } else {
          missingEmbeddingsInNewTable++;
          console.warn(`⚠️ Warning: Product ${p._id} has legacy embedding but no split entry found!`);
        }

        const patches: any = {};
        if (p.embedding !== undefined) patches.embedding = undefined;
        if (p.embeddingVersions !== undefined) patches.embeddingVersions = undefined;
        
        // Clean up duplicate rawAttributes in metadata
        if (p.meta && p.meta.rawAttributes !== undefined) {
          const { rawAttributes, ...cleanMeta } = p.meta;
          patches.meta = cleanMeta;
        }
        
        if (!args.dryRun) {
          // Only perform the delete if dryRun is disabled!
          await ctx.db.patch(p._id, patches);
        }
        count++;
      }
    }

    console.log(`📊 Purge Summary [dryRun=${args.dryRun}]:`);
    console.log(`- Evaluated ${products.length} products`);
    console.log(`- Identified ${count} legacy fields to optimize`);
    console.log(`- Verified parity (exists in new table): ${verifiedCount}`);
    console.log(`- Missing split documents: ${missingEmbeddingsInNewTable}`);

    return {
      evaluated: products.length,
      identified: count,
      verified: verifiedCount,
      missing: missingEmbeddingsInNewTable,
      executed: !args.dryRun,
    };
  },
});
