import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// =============================================================================
// STYLESWIPE ENTERPRISE SCHEMA
// Integrates Better Auth, Organizations, RBAC, and Strategic Monitoring
// =============================================================================

// -----------------------------------------------------------------------------
// IDENTITY CONTEXT - Better Auth Core Tables
// -----------------------------------------------------------------------------
// Note: Auth tables (users, sessions, etc.) are managed by the 'auth' component.
// Access them via `authComponent.api` or `getAuth(ctx).api`.

// -----------------------------------------------------------------------------
// USER PROFILE EXTENSION
// -----------------------------------------------------------------------------

// Separate table for StyleSwipe custom user data (Join Table Pattern)
// PRD Ref: [cite: 112-135] - Style DNA
const styleProfiles = defineTable({
  userId: v.string(), // Foreign key to users table (Better Auth uses string IDs)

  gender: v.union(v.literal('men'), v.literal('women'), v.literal('both')),
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
  dna: v.optional(
    v.object({
      v1: v.optional(v.array(v.float64())), // 384-dim
      v2: v.optional(v.array(v.float64())), // Shadow
    }),
  ),
  lastUpdated: v.optional(v.number()),
}).index('by_user', ['userId']);

// -----------------------------------------------------------------------------
// GOVERNANCE CONTEXT - Feature Flags, Logging, Strategic Sampling
// -----------------------------------------------------------------------------

// Feature flag system with A/B testing support
const featureFlags = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  isEnabled: v.boolean(),
  environment: v.union(v.literal('dev'), v.literal('staging'), v.literal('prod')),
  // Targeting rules for gradual rollouts
  rules: v.optional(
    v.array(
      v.object({
        type: v.union(
          v.literal('user_id'),
          v.literal('role'),
          v.literal('percentage'),
          v.literal('org_id'),
        ),
        value: v.string(), // User ID, role name, percentage (0-100), or org ID
      }),
    ),
  ),
  updatedAt: v.number(),
}).index('by_env_name', ['environment', 'name']);

// High-fidelity structured logging
const logs = defineTable({
  level: v.union(v.literal('INFO'), v.literal('WARN'), v.literal('ERROR'), v.literal('DEBUG')),
  message: v.string(),
  context: v.optional(v.any()), // Flexible JSON context
  traceId: v.optional(v.string()), // Request correlation ID
  userId: v.optional(v.string()), // Foreign key to users (using string to match Better Auth)
  sessionId: v.optional(v.string()), // Session ID for correlation
  app: v.optional(v.string()), // 'consumer-app', 'admin-panel'
  timestamp: v.number(),
  error: v.optional(v.any()),

  // Smart Context
  device: v.optional(
    v.object({
      model: v.optional(v.union(v.string(), v.null())),
      osName: v.optional(v.union(v.string(), v.null())),
      osVersion: v.optional(v.union(v.string(), v.null())),
      batteryLevel: v.optional(v.union(v.number(), v.null())),
      networkType: v.optional(v.union(v.string(), v.null())),
      freeDisk: v.optional(v.union(v.number(), v.null())),
      freeMemory: v.optional(v.union(v.number(), v.null())),
      appVersion: v.optional(v.union(v.string(), v.null())),
      buildNumber: v.optional(v.union(v.string(), v.null())),
    }),
  ),
  breadcrumbs: v.optional(
    v.array(
      v.object({
        category: v.string(),
        message: v.string(),
        data: v.optional(v.any()),
        level: v.optional(v.string()),
        timestamp: v.number(),
      }),
    ),
  ),
})
  .index('by_level', ['level'])
  .index('by_user', ['userId'])
  .index('by_session', ['sessionId'])
  .index('by_trace', ['traceId'])
  .index('by_timestamp', ['timestamp']);

// PRD Ref: [cite: 17, 31-33] - Strategic event sampling for analytics
const events = defineTable({
  type: v.string(), // e.g., "swipe_right", "add_to_cart", "purchase"
  userId: v.optional(v.string()), // Foreign key to users
  productId: v.optional(v.id('products')),
  variant: v.optional(v.string()), // A/B test variant identifier
  isSampled: v.boolean(), // True if this event was selected for detailed analysis
  metadata: v.optional(v.any()), // Additional event-specific data
  timestamp: v.number(),
})
  .index('by_user_type', ['userId', 'type'])
  .index('by_type', ['type']);

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
  masterCategory: v.optional(v.string()), // e.g., Apparel
  subCategory: v.optional(v.string()), // e.g., Topwear
  images: v.array(v.string()),
  description: v.optional(v.string()),
  rating: v.optional(v.number()),
  reviewCount: v.optional(v.number()),
  platform: v.optional(v.string()),
  attributes: v.optional(v.any()), // Dynamic scraped attributes
  // Discovery Attributes for Filtering
  gender: v.optional(v.union(v.literal('men'), v.literal('women'), v.literal('unisex'))),
  priceTier: v.optional(
    v.union(v.literal('budget'), v.literal('mid'), v.literal('premium'), v.literal('luxury')),
  ),
  onSale: v.optional(v.boolean()),

  // PRD Ref: [cite: 201-203] - 384-dim vector for Discovery Mode similarity search (BGE-Small)
  embedding: v.optional(v.array(v.float64())),
  // PRD Ref: [cite: 6.0] - Versioned Embeddings
  embeddingVersions: v.optional(
    v.object({
      v1: v.optional(v.array(v.float64())), // 384-dim for BGE-Small-v1.5
      v2: v.optional(v.array(v.float64())),
    }),
  ),
  meta: v.optional(v.any()), // Flexible field for scraper extra data
  externalId: v.optional(v.string()), // Generalized from Myntra ID for multi-platform support
  updatedAt: v.optional(v.number()),
})
  .index('by_externalId', ['externalId'])
  .index('by_category', ['category'])
  .index('by_master_category', ['masterCategory'])
  .index('by_category_price', ['category', 'price'])
  .index('by_brand', ['brand'])
  .index('by_brand_title', ['brand', 'title'])
  .searchIndex('search_title', {
    searchField: 'title',
    filterFields: ['brand', 'category', 'masterCategory', 'subCategory', 'gender'],
  })
  .vectorIndex('by_embedding', {
    vectorField: 'embedding',
    dimensions: 384, // Updated to 384 for BGE-Small
    filterFields: ['category', 'masterCategory', 'subCategory', 'brand', 'gender', 'priceTier'],
  })
  .vectorIndex('by_embedding_v1', {
    vectorField: 'embeddingVersions.v1',
    dimensions: 384,
    filterFields: ['category', 'gender', 'priceTier'],
  });

// PRD Ref: [cite: 18] - Hierarchical Categories
const categories = defineTable({
  name: v.string(),
  slug: v.string(), // URL-safe identifier
  description: v.optional(v.string()),
  parentId: v.optional(v.id('categories')), // Self-referential for hierarchy
  level: v.number(), // 0 = Root, 1 = Sub-category
  image: v.optional(v.string()),
})
  .index('by_slug', ['slug'])
  .index('by_parent', ['parentId']);

// -----------------------------------------------------------------------------
// DISCOVERY CONTEXT - Collaborative Shopping
// -----------------------------------------------------------------------------

// PRD Ref: [cite: 151-155, 172-173] - Partner Sync sessions
const partnerSync = defineTable({
  initiatorId: v.string(), // Foreign key to users
  partnerId: v.optional(v.string()), // Foreign key to users
  inviteCode: v.string(), // Shareable invite code
  status: v.union(v.literal('pending'), v.literal('active'), v.literal('expired')),
  expiresAt: v.number(), // Unix timestamp
  influenceRatio: v.number(), // 0.0 to 1.0 - How much partner preferences affect results
  createdAt: v.number(),
})
  .index('by_inviteCode', ['inviteCode'])
  .index('by_initiator', ['initiatorId'])
  .index('by_partner', ['partnerId']);

// PRD Ref: [cite: 29, 33] - User swipes on products (Discovery Mode)
const swipes = defineTable({
  userId: v.string(), // Foreign key to users
  productId: v.id('products'),
  action: v.union(v.literal('like'), v.literal('pass'), v.literal('super')),
  timestamp: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_product', ['productId'])
  .index('by_user_product', ['userId', 'productId']);

// PRD Ref: [cite: 3.1] - Weekly Semantic Summaries
const weeklySummaries = defineTable({
  userId: v.string(), // Foreign key to users
  period: v.string(), // "2026-W04"
  granularity: v.string(), // "8bit" or "float32"
  summary: v.any(), // JSON object with stored analysis
  centroidShift: v.array(v.float64()), // Vector shift direction
  hash: v.string(), // SHA-256 batch signature
  createdAt: v.number(),
}).index('by_user_period', ['userId', 'period']);

// -----------------------------------------------------------------------------
// COMMERCE CONTEXT - Cart, Checkout, Orders
// -----------------------------------------------------------------------------

const carts = defineTable({
  userId: v.string(), // Foreign key to users
  items: v.array(
    v.object({
      productId: v.id('products'),
      quantity: v.number(),
      price: v.number(),
      attributes: v.optional(v.any()),
    }),
  ),
  updatedAt: v.number(),
}).index('by_user', ['userId']);

// -----------------------------------------------------------------------------
// SCRAPER CONTEXT - Data Ingestion
// -----------------------------------------------------------------------------

const scraped_products = defineTable({
  externalId: v.string(),
  url: v.string(),
  data: v.any(), // Raw JSON data
  lastScrapedAt: v.number(),
  status: v.union(v.literal('active'), v.literal('out_of_stock')),
})
  .index('by_externalId', ['externalId'])
  .index('by_url', ['url']);

const scrape_jobs = defineTable({
  type: v.union(v.literal('category'), v.literal('search'), v.literal('single')),
  query: v.string(), // URL or Search Term
  status: v.union(
    v.literal('pending'),
    v.literal('processing'),
    v.literal('completed'),
    v.literal('failed'),
  ),
  maxPages: v.optional(v.number()),
  startPage: v.optional(v.number()),
  scraperMode: v.optional(v.union(v.literal('API'), v.literal('BROWSER'))),
  productsFound: v.optional(v.number()),
  errorMessage: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_status', ['status'])
  .index('by_created', ['createdAt']);

// -----------------------------------------------------------------------------
// SUPPORT CONTEXT - User Feedback & Support
// -----------------------------------------------------------------------------

const feedback = defineTable({
  userId: v.string(), // Foreign key to users
  name: v.string(),
  contact: v.string(),
  type: v.string(), // Bug, Feature, Improvement, Other
  message: v.string(),
  attachment: v.optional(v.id('_storage')),
  status: v.string(), // Open, Read, Replied, Resolved
  replies: v.array(
    v.object({
      adminId: v.string(),
      message: v.string(),
      timestamp: v.number(),
    }),
  ),
  updatedAt: v.number(),
  createdAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_status', ['status'])
  .index('by_created', ['createdAt'])
  .searchIndex('search_message', {
    searchField: 'message',
    filterFields: ['status', 'type', 'userId'],
  });

// Separate table for product embeddings (Widen-Migrate-Narrow Pattern)
const product_embeddings = defineTable({
  productId: v.id('products'),
  embeddingVersions: v.object({
    v1: v.optional(v.array(v.float64())), // BGE-Small (384-dim)
  }),
  category: v.string(),
  gender: v.optional(v.union(v.literal('men'), v.literal('women'), v.literal('unisex'))),
  priceTier: v.optional(
    v.union(v.literal('budget'), v.literal('mid'), v.literal('premium'), v.literal('luxury')),
  ),
  updatedAt: v.number(),
})
  .index('by_productId', ['productId'])
  .vectorIndex('by_embedding_v1', {
    vectorField: 'embeddingVersions.v1',
    dimensions: 384,
    filterFields: ['category', 'gender', 'priceTier'],
  });

// =============================================================================
// SCHEMA EXPORT
// =============================================================================

export default defineSchema({
  // StyleSwipe Custom Tables
  styleProfiles,

  // Governance Context
  featureFlags,
  logs,
  events,

  // Catalog Context
  products,
  product_embeddings,
  categories,

  // Discovery Context
  partnerSync,
  swipes,
  weeklySummaries,

  // Commerce Context
  carts,

  // Scraper Context
  scraped_products,
  scrape_jobs,
  feedback,
});
