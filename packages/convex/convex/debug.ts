import 'convex/server';
import { FunctionReference } from 'convex/server';
import { query } from './_generated/server';

export const analyzeMismatch = query({
  handler: async (ctx) => {
    const scraped = await ctx.db.query('scraped_products').collect();
    const catalog = await ctx.db.query('products').collect();

    const catalogById = new Map();
    catalog.forEach((p) => {
      if (p.externalId) catalogById.set(p.externalId, p);
    });

    const catalogByBrandTitle = new Map();
    catalog.forEach((p) => {
      catalogByBrandTitle.set(`${p.brand}|${p.title}`, p);
    });

    const results = scraped.map((s) => {
      const data = (s as any).data || {};
      const key = `${data.brand || ''}|${data.title || ''}`;
      const foundById = catalogById.get(s.externalId);
      const foundByBT = catalogByBrandTitle.get(key);

      return {
        externalId: s.externalId,
        brand: data.brand,
        title: data.title,
        inCatalogById: !!foundById,
        inCatalogByBT: !!foundByBT,
        catalogIdMatched: foundById?._id || foundByBT?._id,
      };
    });

    // Find duplicates in scraped data (same brand/title but different externalId)
    const btCounts = new Map();
    scraped.forEach((s) => {
      const data = (s as any).data || {};
      const key = `${data.brand || ''}|${data.title || ''}`;
      if (!btCounts.has(key)) btCounts.set(key, []);
      btCounts.get(key).push(s.externalId);
    });

    const potentialCollisions = Array.from(btCounts.entries())
      .filter(([_, ids]) => {
        // Only count as collision if they have different externalIds
        const uniqueIds = new Set(ids);
        return uniqueIds.size > 1;
      })
      .map(([key, ids]) => ({ key, ids: Array.from(new Set(ids)) }));

    return {
      totalScraped: scraped.length,
      totalCatalog: catalog.length,
      potentialCollisions,
      details: results,
    };
  },
}) as unknown as FunctionReference<"query", "public", any, any>;
