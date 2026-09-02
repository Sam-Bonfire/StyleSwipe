import { v } from 'convex/values';

import { api } from './_generated/api';
import { action } from './_generated/server';

export const getVectorFeed = action({
  args: {
    limit: v.optional(v.number()),
    overrideVector: v.optional(v.array(v.float64())),
    influenceRatio: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Return public/trending products if not logged in
      return await ctx.runQuery(api.discovery.getCalibrationFeed, { limit: args.limit });
    }

    // 1. Get User Profile & Vector
    // We need to query the internal user to get the vector.
    // Since actions can't access database directly, we must call a query.
    const user = await ctx.runQuery(api.users.getUserPrivate, {
      email: identity.email || '',
    });

    if (!user || (!user.styleProfile?.preferenceVector && !args.overrideVector)) {
      // Fallback: No vector found, return standard discovery feed
      return await ctx.runQuery(api.discovery.getCalibrationFeed, { limit: args.limit });
    }

    let preferenceVector = args.overrideVector || user.styleProfile?.preferenceVector;
    
    // Server-side Blending Logic (Option A: Averaging)
    if (!args.overrideVector && user.styleProfile?.preferenceVector) {
      // Find active syncs
      const activeSyncsInitiator = await ctx.runQuery(api.partnerSync.getByInitiator, { initiatorId: user._id });
      const activeSyncsPartner = await ctx.runQuery(api.partnerSync.getByPartner, { partnerId: user._id });
      const activeSyncs = [...activeSyncsInitiator, ...activeSyncsPartner].filter(s => s.status === 'active');
      
      if (activeSyncs.length > 0) {
          const partnerVectors: number[][] = [];
          for (const sync of activeSyncs) {
              const partnerId = sync.initiatorId === user._id ? sync.partnerId : sync.initiatorId;
              if (partnerId) {
                  // Wait, we need to fetch internal user to get vector
                  // But getUserPrivate takes email. 
                  // Let's use internal user query by ID, but api.users.getById takes ID.
                  const partner = await ctx.runQuery(api.users.getById, { id: partnerId });
                  if (partner?.styleProfile?.preferenceVector) {
                      partnerVectors.push(partner.styleProfile.preferenceVector);
                  }
              }
          }
          
          if (partnerVectors.length > 0) {
              const blended = new Array(user.styleProfile.preferenceVector.length).fill(0);

              if (args.influenceRatio !== undefined) {
                  const partnerWeight = args.influenceRatio;
                  const hostWeight = 1.0 - partnerWeight;
                  // For simplicity, if multiple partners, we average their vectors first, then blend with host.
                  // Or just use the first partner's vector since UI supports 1 partner currently.
                  const avgPartnerVector = new Array(user.styleProfile.preferenceVector.length).fill(0);
                  for (let i = 0; i < partnerVectors.length; i++) {
                      for (let j = 0; j < avgPartnerVector.length; j++) {
                          avgPartnerVector[j] += partnerVectors[i][j];
                      }
                  }
                  for (let j = 0; j < avgPartnerVector.length; j++) {
                      avgPartnerVector[j] /= partnerVectors.length;
                  }

                  for (let j = 0; j < blended.length; j++) {
                      blended[j] = (user.styleProfile.preferenceVector[j] * hostWeight) + (avgPartnerVector[j] * partnerWeight);
                  }
                  console.log(`[Vector Blending] Calculated Blended Vector with ratio ${args.influenceRatio}`);
              } else {
                  // Default straight averaging
                  const allVectors = [user.styleProfile.preferenceVector, ...partnerVectors];
                  for (let i = 0; i < allVectors.length; i++) {
                      for (let j = 0; j < blended.length; j++) {
                          blended[j] += allVectors[i][j];
                      }
                  }
                  for (let j = 0; j < blended.length; j++) {
                      blended[j] /= allVectors.length;
                  }
                  console.log(`[Vector Blending] Calculated Unified Party Vector across ${allVectors.length} users`);
              }

              preferenceVector = blended;
          }
      }
    }
    
    if (!preferenceVector) {
      return await ctx.runQuery(api.discovery.getCalibrationFeed, { limit: args.limit });
    }

    // 2. Get Swiped IDs to exclude
    const swipedIds = await ctx.runQuery(api.discovery.getUserSwipedIds, {
      userId: user._id,
    });

    // 3. Vector Search
    // Construct filter based on user gender if specific
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let filter: any;
    if (user.styleProfile?.gender && user.styleProfile.gender !== 'both') {
      const gender = user.styleProfile.gender;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filter = (q: any) => q.eq('gender', gender);
    }

    const results = await ctx.vectorSearch(
      'product_embeddings',
      'by_embedding_v1',
      {
        vector: preferenceVector,
        limit: Math.min(256, (args.limit || 10) + swipedIds.length),
        filter,
      },
    );

    // We only have the Ids and scores. Need to fetch full docs.
    const allProductIds = await ctx.runQuery(api.helpers.getProductIdsFromEmbeddings, { ids: results.map((r) => r._id as any) });

    // Filter out swiped items
    const filteredProductIds = allProductIds.filter((id: any) => !swipedIds.includes(id as any));

    // Slice
    const productIds = filteredProductIds.slice(0, args.limit || 10);

    // Bulk fetch details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const products: any[] = await ctx.runQuery(api.helpers.getProductsByIds, {
      ids: productIds as any,
    });

    // Fallback: If vector search yields no results (e.g. no products have embeddings yet),
    // return the standard discovery feed (recent items)
    if (products.length === 0) {
      console.log('Vector search returned 0 items, falling back to discovery feed.');
      return await ctx.runQuery(api.discovery.getCalibrationFeed, { limit: args.limit });
    }

    return products;
  },
});
