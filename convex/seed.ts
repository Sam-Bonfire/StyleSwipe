import { mutation } from "./_generated/server";

export const seedProducts = mutation({
    args: {},
    handler: async (ctx) => {
        const existing = await ctx.db.query("products").collect();
        // Clear existing to ensure schema updates (like createdAt) are applied
        for (const p of existing) {
            await ctx.db.delete(p._id);
        }
        console.log("Cleared existing products.");

        // Helper to create random 384-dim vector
        const createEmbedding = () => Array.from({ length: 384 }, () => Math.random() - 0.5);

        const products: any[] = [];
        const brands = ["ZARA", "H&M", "Uniqlo", "Levi's", "Mango", "Nike", "Adidas", "Gucci", "Prada", "Urban Outfitters"];
        const categories = ["tops", "bottoms", "outerwear", "dresses", "shoes", "accessories"];
        const colors = ["black", "white", "beige", "blue", "red", "green", "yellow", "pink"];
        const genders = ["men", "women", "unisex"];
        const prices = [990, 1490, 1990, 2990, 3990, 4990, 7990];

        for (let i = 0; i < 20; i++) {
            const price = prices[Math.floor(Math.random() * prices.length)];
            const brand = brands[Math.floor(Math.random() * brands.length)];
            const category = categories[Math.floor(Math.random() * categories.length)];

            products.push({
                brand: brand,
                title: `${brand} ${category} ${i + 1}`, // Simple dynamic title
                price: price,
                mrp: Math.floor(price * 1.5),
                category: category,
                images: [`https://picsum.photos/320/480?random=${i + 10}`],
                attributes: {
                    color: colors[Math.floor(Math.random() * colors.length)],
                    material: "mixed",
                    fit: "regular"
                },
                gender: genders[Math.floor(Math.random() * genders.length)],
                priceTier: price > 3000 ? "premium" : "budget",
                onSale: Math.random() > 0.5,
                createdAt: Date.now() - (i * 100000), // Staggered creation times
                embedding: createEmbedding(),
            });
        }

        for (const p of products) {
            // @ts-ignore
            await ctx.db.insert("products", p);
        }

        console.log(`Seeded ${products.length} products.`);
    },
});
