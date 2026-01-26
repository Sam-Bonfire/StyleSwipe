import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// =============================================================================
// STYLESWIPE ENTERPRISE SCHEMA
// Integrates Better Auth, Organizations, RBAC, and Strategic Monitoring
// =============================================================================

// -----------------------------------------------------------------------------
// IDENTITY CONTEXT - Better Auth Core Tables
// -----------------------------------------------------------------------------

// PRD Ref: [cite: 91, 108] - Better Auth standard fields
// PRD Ref: [cite: 107] - Custom phone field (Required, Unique)
// PRD Ref: [cite: 112-135] - Style DNA (styleProfile)
const users = defineTable({
    // Better Auth standard fields [cite: 91, 108]
    name: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.string()),

    // Custom fields [cite: 107]
    phone: v.optional(v.string()), // Optional - only required for phone auth
    activeOrgId: v.optional(v.id("organizations")),

    // Style DNA [cite: 112-135]
    styleProfile: v.optional(
        v.object({
            gender: v.union(v.literal("men"), v.literal("women"), v.literal("both")),
            age: v.optional(v.string()),
            sizes: v.object({
                top: v.optional(v.string()),
                bottom: v.optional(v.string()),
                shoe: v.optional(v.string()),
            }),
            vibes: v.array(v.string()), // e.g., ["party", "chill", "adventure"]
            budget: v.object({
                min: v.number(),
                max: v.number(),
            }),
            preferenceVector: v.optional(v.array(v.float64())), // 384-dim embedding (BGE-Small)

            // PRD Ref: [cite: 1.0, 5.0] - Vector DNA & Dual-Vector Strategy
            activeDNA: v.optional(v.string()), // "v1" or "v2"
            dna: v.optional(v.object({
                v1: v.optional(v.array(v.float64())), // 384-dim
                v2: v.optional(v.array(v.float64())), // Shadow
            })),
            lastUpdated: v.optional(v.number()),
        })
    ),
})
    .index("by_phone", ["phone"])
    .index("by_email", ["email"]);

// PRD Ref: [cite: 91] - Better Auth session management
const sessions = defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(), // Unix timestamp
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    createdAt: v.number(),
})
    .index("by_user", ["userId"])
    .index("by_token", ["token"]);

// PRD Ref: [cite: 91] - Better Auth OAuth accounts
const accounts = defineTable({
    userId: v.id("users"),
    providerId: v.string(), // e.g., "google", "phone"
    providerAccountId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    accessTokenExpiresAt: v.optional(v.number()),
    scope: v.optional(v.string()),
})
    .index("by_user", ["userId"])
    .index("by_provider", ["providerId", "providerAccountId"]);

// PRD Ref: [cite: 91] - OTP lifecycle management
const verifications = defineTable({
    identifier: v.string(), // Phone or email
    token: v.string(), // OTP code
    type: v.union(v.literal("phone_otp"), v.literal("email_otp"), v.literal("magic_link")),
    expiresAt: v.number(), // Unix timestamp
    createdAt: v.number(),
})
    .index("by_identifier", ["identifier"])
    .index("by_token", ["token"]);

// -----------------------------------------------------------------------------
// ORGANIZATION CONTEXT - Multi-Tenant RBAC
// -----------------------------------------------------------------------------

const organizations = defineTable({
    name: v.string(),
    slug: v.string(), // URL-safe identifier
    logo: v.optional(v.string()),
    metadata: v.optional(
        v.object({
            type: v.optional(v.union(v.literal("influencer_agency"), v.literal("brand_partner"))),
            website: v.optional(v.string()),
            description: v.optional(v.string()),
        })
    ),
    createdAt: v.number(),
})
    .index("by_slug", ["slug"]);

const members = defineTable({
    orgId: v.id("organizations"),
    userId: v.id("users"),
    role: v.union(
        v.literal("admin"),
        v.literal("member"),
        v.literal("influencer"),
        v.literal("brand_manager")
    ),
    joinedAt: v.number(),
})
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_org_user", ["orgId", "userId"]);

// -----------------------------------------------------------------------------
// GOVERNANCE CONTEXT - Feature Flags, Logging, Strategic Sampling
// -----------------------------------------------------------------------------

// Feature flag system with A/B testing support
const featureFlags = defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    isEnabled: v.boolean(),
    environment: v.union(v.literal("dev"), v.literal("staging"), v.literal("prod")),
    // Targeting rules for gradual rollouts
    rules: v.optional(
        v.array(
            v.object({
                type: v.union(
                    v.literal("user_id"),
                    v.literal("role"),
                    v.literal("percentage"),
                    v.literal("org_id")
                ),
                value: v.string(), // User ID, role name, percentage (0-100), or org ID
            })
        )
    ),
    updatedAt: v.number(),
})
    .index("by_env_name", ["environment", "name"]);

// High-fidelity structured logging
const logs = defineTable({
    level: v.union(v.literal("INFO"), v.literal("WARN"), v.literal("ERROR")),
    message: v.string(),
    context: v.optional(v.any()), // Flexible JSON context
    traceId: v.optional(v.string()), // Request correlation ID
    userId: v.optional(v.id("users")),
    timestamp: v.number(),
})
    .index("by_level", ["level"])
    .index("by_user", ["userId"])
    .index("by_trace", ["traceId"]);

// PRD Ref: [cite: 17, 31-33] - Strategic event sampling for analytics
const events = defineTable({
    type: v.string(), // e.g., "swipe_right", "add_to_cart", "purchase"
    userId: v.optional(v.id("users")),
    productId: v.optional(v.id("products")),
    variant: v.optional(v.string()), // A/B test variant identifier
    isSampled: v.boolean(), // True if this event was selected for detailed analysis
    metadata: v.optional(v.any()), // Additional event-specific data
    timestamp: v.number(),
})
    .index("by_user_type", ["userId", "type"])
    .index("by_type", ["type"]);

// -----------------------------------------------------------------------------
// CATALOG CONTEXT - Product Data with Vector Embeddings
// -----------------------------------------------------------------------------

// PRD Ref: [cite: 44, 201-203] - Product catalog with embedding support
// PRD Ref: [cite: 18, 36-37] - Category and price indexing
const products = defineTable({
    brand: v.string(),
    title: v.string(),
    price: v.number(),
    mrp: v.number(), // Maximum retail price (original)
    category: v.string(),
    categoryId: v.optional(v.id("categories")),
    images: v.array(v.string()),
    attributes: v.optional(
        v.object({
            color: v.optional(v.string()),
            size: v.optional(v.array(v.string())),
            material: v.optional(v.string()),
            fit: v.optional(v.string()),
            occasion: v.optional(v.array(v.string())),
        })
    ),
    // Discovery Attributes for Filtering
    gender: v.optional(v.union(v.literal("men"), v.literal("women"), v.literal("unisex"))),
    priceTier: v.optional(v.union(v.literal("budget"), v.literal("mid"), v.literal("premium"), v.literal("luxury"))),
    onSale: v.optional(v.boolean()),

    // PRD Ref: [cite: 201-203] - 384-dim vector for Discovery Mode similarity search (BGE-Small)
    embedding: v.optional(v.array(v.float64())),
    // PRD Ref: [cite: 6.0] - Versioned Embeddings
    embeddingVersions: v.optional(v.object({
        v1: v.optional(v.array(v.float64())), // 384-dim for BGE-Small-v1.5
        v2: v.optional(v.array(v.float64())),
    })),
    meta: v.optional(v.any()), // Flexible field for scraper extra data
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
})
    .index("by_category", ["category"])
    .index("by_category_price", ["category", "price"])
    .index("by_brand", ["brand"])
    .searchIndex("search_title", {
        searchField: "title",
        filterFields: ["brand", "category", "gender"],
    })
    .vectorIndex("by_embedding", {
        vectorField: "embedding",
        dimensions: 384, // Updated to 384 for BGE-Small
        filterFields: ["category", "brand", "gender", "priceTier"],
    })
    // We can add vector indexes for v1/v2 later or now. 
    // Convex supports multiple vector indexes.
    .vectorIndex("by_embedding_v1", {
        vectorField: "embeddingVersions.v1",
        dimensions: 384,
        filterFields: ["category", "gender", "priceTier"],
    });

// PRD Ref: [cite: 18] - Hierarchical Categories
const categories = defineTable({
    name: v.string(),
    slug: v.string(), // URL-safe identifier
    description: v.optional(v.string()),
    parentId: v.optional(v.id("categories")), // Self-referential for hierarchy
    level: v.number(), // 0 = Root, 1 = Sub-category
    image: v.optional(v.string()),
})
    .index("by_slug", ["slug"])
    .index("by_parent", ["parentId"]);

// -----------------------------------------------------------------------------
// DISCOVERY CONTEXT - Collaborative Shopping
// -----------------------------------------------------------------------------

// PRD Ref: [cite: 151-155, 172-173] - Partner Sync sessions
const partnerSync = defineTable({
    initiatorId: v.id("users"), // ID of user who started the session
    partnerId: v.optional(v.id("users")), // ID of invited partner
    inviteCode: v.string(), // Shareable invite code
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("expired")),
    expiresAt: v.number(), // Unix timestamp
    influenceRatio: v.number(), // 0.0 to 1.0 - How much partner preferences affect results
    createdAt: v.number(),
})
    .index("by_inviteCode", ["inviteCode"])
    .index("by_initiator", ["initiatorId"])
    .index("by_partner", ["partnerId"]);

// PRD Ref: [cite: 29, 33] - User swipes on products (Discovery Mode)
const swipes = defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    action: v.union(v.literal("like"), v.literal("pass"), v.literal("super")),
    timestamp: v.number(),
})
    .index("by_user", ["userId"])
    .index("by_product", ["productId"])
    .index("by_user_product", ["userId", "productId"]);



// PRD Ref: [cite: 3.1] - Weekly Semantic Summaries
const weeklySummaries = defineTable({
    userId: v.id("users"),
    period: v.string(), // "2026-W04"
    granularity: v.string(), // "8bit" or "float32"
    summary: v.any(), // JSON object with stored analysis
    centroidShift: v.array(v.float64()), // Vector shift direction
    hash: v.string(), // SHA-256 batch signature
    createdAt: v.number(),
})
    .index("by_user_period", ["userId", "period"]);

// -----------------------------------------------------------------------------
// COMMERCE CONTEXT - Cart, Checkout, Orders
// -----------------------------------------------------------------------------

const carts = defineTable({
    userId: v.string(), // User ID or Session ID
    items: v.array(
        v.object({
            productId: v.id("products"),
            quantity: v.number(),
            price: v.number(),
            attributes: v.optional(v.any()),
        })
    ),
    updatedAt: v.number(),
})
    .index("by_user", ["userId"]);

// =============================================================================
// SCHEMA EXPORT
// =============================================================================

export default defineSchema({
    // Identity Context (Better Auth)
    users,
    sessions,
    accounts,
    verifications,

    // Organization Context (RBAC)
    organizations,
    members,

    // Governance Context
    featureFlags,
    logs,
    events,

    // Catalog Context
    products,
    categories,

    // Discovery Context
    partnerSync,
    swipes,
    weeklySummaries,

    // Commerce Context
    carts,
});
