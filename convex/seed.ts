import { mutation } from "./_generated/server";

export const seedProducts = mutation({
    args: {},
    handler: async (ctx) => {
        const existing = await ctx.db.query("products").take(1);
        if (existing.length > 0) {
            console.log("Products already exist, skipping seed.");
            return;
        }

        const products = [
            {
                brand: "ZARA",
                title: "Oversized Cotton Blazer",
                price: 3999,
                mrp: 5999,
                category: "outerwear",
                images: ["https://picsum.photos/320/480?random=1"],
                attributes: {
                    color: "black",
                    material: "cotton",
                    fit: "oversized"
                },
                gender: "women",
                priceTier: "mid",
                onSale: true,
                createdAt: Date.now(),
            },
            {
                brand: "H&M",
                title: "Regular Fit Chinos",
                price: 1499,
                mrp: 2999,
                category: "bottoms",
                images: ["https://picsum.photos/320/480?random=2"],
                attributes: {
                    color: "beige",
                    material: "cotton",
                    fit: "regular"
                },
                gender: "men",
                priceTier: "budget",
                onSale: true,
                createdAt: Date.now(),
            },
            {
                brand: "Uniqlo",
                title: "Airism Cotton Oversized T-Shirt",
                price: 990,
                mrp: 1490,
                category: "tops",
                images: ["https://picsum.photos/320/480?random=3"],
                attributes: {
                    color: "white",
                    material: "cotton",
                    fit: "oversized"
                },
                gender: "unisex",
                priceTier: "budget",
                onSale: false,
                createdAt: Date.now(),
            },
            {
                brand: "Levi's",
                title: "501 Original Jeans",
                price: 3500,
                mrp: 5000,
                category: "bottoms",
                images: ["https://picsum.photos/320/480?random=4"],
                attributes: {
                    color: "blue",
                    material: "denim",
                    fit: "regular"
                },
                gender: "men",
                priceTier: "mid",
                onSale: false,
                createdAt: Date.now(),
            },
            {
                brand: "Mango",
                title: "Flowy Floral Dress",
                price: 4500,
                mrp: 6000,
                category: "dresses",
                images: ["https://picsum.photos/320/480?random=5"],
                attributes: {
                    color: "red",
                    material: "rayon",
                    fit: "flowy"
                },
                gender: "women",
                priceTier: "premium",
                onSale: true,
                createdAt: Date.now(),
            }
        ];

        for (const p of products) {
            // @ts-ignore
            await ctx.db.insert("products", p);
        }

        console.log(`Seeded ${products.length} products.`);
    },
});
