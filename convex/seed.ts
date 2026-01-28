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
                description: `Experience premium quality with the ${brand} ${category}. Crafted for comfort and durability, this piece is designed to elevate your everyday style. Made from high-quality materials, it offers both breathability and a perfect fit.`,
                rating: 4.0 + Math.random(),
                reviewCount: Math.floor(Math.random() * 500),
                platform: "StyleSwipe Verified",
                price: price,
                mrp: Math.floor(price * 1.5),
                category: category,
                images: [`https://picsum.photos/320/480?random=${i + 10}`],
                attributes: {
                    color: colors[Math.floor(Math.random() * colors.length)],
                    material: "100% Cotton",
                    fit: "Regular Fit",
                    size: ["S", "M", "L", "XL"],
                    occasion: ["Casual", "Daily"],
                    care: "Machine Wash Cold",
                    origin: "Imported",
                    style: "Streetwear",
                    sleeve: "Short Sleeve",
                    neck: "Crew Neck",
                    season: "All Season",
                    collection: "SS26"
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
