import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // Users table will be managed/augmented by better-auth, 
    // but we declare it here if we need specific index extensions later.
    // For now, relying on better-auth defaults or a separate migration.

    partnerSync: defineTable({
        initiatorId: v.string(), // ID of user who started the session
        partnerId: v.optional(v.string()), // ID of invited partner
        status: v.union(v.literal("pending"), v.literal("active"), v.literal("expired")),
        expiresAt: v.number(), // Unix timestamp
        influenceRatio: v.number(), // 0.0 to 1.0
    })
        .index("by_initiator", ["initiatorId"])
        .index("by_partner", ["partnerId"]),

    products: defineTable({
        brand: v.string(),
        title: v.string(),
        price: v.number(),
        mrp: v.number(),
        category: v.string(),
        images: v.array(v.string()),
        meta: v.optional(v.any()), // Flexible field for scraper extra data
    })
        .index("by_category", ["category"])
        .searchIndex("search_title", {
            searchField: "title",
            filterFields: ["brand", "category"],
        }),
});
