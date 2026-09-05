import type { RegisteredMutation } from 'convex/server';

import type { MutationCtx } from './_generated/server';

import { mutation } from './_generated/server';

export const run: RegisteredMutation<'public', Record<string, never>, Promise<void>> = mutation({
  handler: async (ctx: MutationCtx) => {
    console.log("Seeding preview database...");

    try {
      // Create some initial products for testing
      const existingProducts = await ctx.db.query('products').collect();
      if (existingProducts.length === 0) {
        await ctx.db.insert('products', {
          brand: 'TestBrand',
          title: 'Test T-Shirt',
          price: 29.99,
          mrp: 39.99,
          category: 'T-Shirts',
          images: ['https://example.com/test-tshirt.jpg'],
          updatedAt: Date.now(),
        });
        await ctx.db.insert('products', {
          brand: 'TestBrand',
          title: 'Test Jeans',
          price: 49.99,
          mrp: 59.99,
          category: 'Jeans',
          images: ['https://example.com/test-jeans.jpg'],
          updatedAt: Date.now(),
        });
        console.log("Inserted test products.");
      }
      console.log("Seed script ran successfully. The database is initialized.");
    } catch (err) {
       console.error("Seed error", err);
    }
  },
});
