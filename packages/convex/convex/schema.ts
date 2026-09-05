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
const style_profiles = defineTable({
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

// Per-device push notification tokens for a user (Join Table Pattern)
// PRD Ref: Push Notifications - partner sync, drops, price alerts
const user_devices = defineTable({
  userId: v.string(), // Foreign key to users table (Better Auth uses string IDs)
  token: v.string(), // Expo push token
  platform: v.union(v.literal('IOS'), v.literal('ANDROID'), v.literal('WEB')),
  service: v.union(v.literal('APNS'), v.literal('FCM')),
  isActive: v.boolean(),
  lastSeenAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_token', ['token']);

// Req 9.1: push_tokens table — explicit per spec (alias of user_devices for hexagonal clarity)
// Keep both tables in sync via updatePushToken mutation.
const push_tokens = defineTable({
  userId: v.string(),
  token: v.string(), // Expo push token
  platform: v.union(v.literal('IOS'), v.literal('ANDROID'), v.literal('WEB')),
  service: v.union(v.literal('APNS'), v.literal('FCM')),
  isActive: v.boolean(),
  lastSeenAt: v.number(),
  createdAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_token', ['token']);

const notification_preferences = defineTable({
  userId: v.string(),
  push: v.boolean(),
  email: v.boolean(),
  inApp: v.boolean(),
  priceDrops: v.boolean(),
  partnerSync: v.boolean(),
  dailyDrops: v.boolean(),
  marketing: v.boolean(),
  updatedAt: v.number(),
}).index('by_user', ['userId']);

const notifications = defineTable({
  userId: v.string(),
  type: v.union(
    v.literal('PRICE_DROP'),
    v.literal('BACK_IN_STOCK'),
    v.literal('PARTNER_LIKED'),
    v.literal('ORDER_UPDATE'),
    v.literal('PARTNER_INVITE'),
    v.literal('PARTNER_MATCH'),
    v.literal('DISCOVERY_DROP'),
    v.literal('SYSTEM'),
  ),
  title: v.string(),
  body: v.string(),
  data: v.optional(v.any()),
  isRead: v.boolean(),
  createdAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_user_created', ['userId', 'createdAt'])
  .index('by_user_type', ['userId', 'type']);

// -----------------------------------------------------------------------------
// GOVERNANCE CONTEXT - Feature Flags, Logging, Strategic Sampling
// -----------------------------------------------------------------------------

// Feature flag system with A/B testing support
const feature_flags = defineTable({
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
  .index('by_type', ['type'])
  .index('by_timestamp', ['timestamp']);

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


  meta: v.optional(v.any()), // Flexible field for scraper extra data
  externalId: v.optional(v.string()), // Generalized from Myntra ID for multi-platform support
  trustBadges: v.optional(v.array(v.string())), // Dynamic trust indicators like 'authentic', 'sustainable'
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
const partner_sync = defineTable({
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
  .index('by_user_product', ['userId', 'productId'])
  .index('by_timestamp', ['timestamp']);

// PRD Ref: [cite: 3.1] - Weekly Semantic Summaries
const weekly_summaries = defineTable({
  userId: v.string(), // Foreign key to users
  period: v.string(), // "2026-W04"
  granularity: v.string(), // "8bit" or "float32"
  summary: v.any(), // JSON object with stored analysis
  centroidShift: v.array(v.float64()), // Vector shift direction
  hash: v.string(), // SHA-256 batch signature
  createdAt: v.number(),
}).index('by_user_period', ['userId', 'period']);

// Bag (cart-as-list): the aggregator keeps a cross-retailer saved-items list.
// orders/addresses below back optional direct shopping behind the
// direct_shopping feature flag (off by default).

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

const orders = defineTable({
  orderNumber: v.string(),
  userId: v.string(),
  items: v.array(
    v.object({
      productId: v.string(),
      quantity: v.number(),
      price: v.number(),
      brand: v.optional(v.string()),
      title: v.optional(v.string()),
      image: v.optional(v.string()),
      attributes: v.optional(v.any()),
    })
  ),
  pricing: v.object({
    subtotal: v.number(),
    shippingCost: v.number(),
    discountAmount: v.number(),
    tax: v.number(),
    totalAmount: v.number(),
  }),
  deliveryAddress: v.object({
    name: v.string(),
    line1: v.string(),
    line2: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    postalCode: v.string(),
    country: v.string(),
    phone: v.string(),
  }),
  // Flattened convenience fields per 5.1 spec
  address: v.optional(
    v.object({
      name: v.string(),
      line1: v.string(),
      line2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      postalCode: v.string(),
      country: v.string(),
      phone: v.string(),
    })
  ),
  paymentMethod: v.optional(v.string()),
  paymentInfo: v.optional(
    v.object({
      method: v.string(),
      transactionId: v.optional(v.string()),
      paymentStatus: v.string(),
    })
  ),
  trackingId: v.optional(v.string()),
  tracking: v.optional(
    v.object({
      carrier: v.string(),
      trackingNumber: v.string(),
      estimatedDeliveryDate: v.optional(v.number()),
    })
  ),
  status: v.union(
    v.literal('pending'),
    v.literal('paid'),
    v.literal('shipped'),
    v.literal('delivered'),
    v.literal('returned'),
    v.literal('cancelled'),
    v.literal('PENDING'),
    v.literal('CONFIRMED'),
    v.literal('PAID'),
    v.literal('SHIPPED'),
    v.literal('DELIVERED'),
    v.literal('RETURNED'),
    v.literal('CANCELLED'),
    v.string()
  ),
  statusHistory: v.array(
    v.object({
      status: v.string(),
      timestamp: v.number(),
      reason: v.optional(v.string()),
    })
  ),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_order_number', ['orderNumber'])
  .index('by_user_created', ['userId', 'createdAt'])
  .index('by_status', ['status']);

// Address book — Req 5.2: addresses table with default, pincode, Indian states
const addresses = defineTable({
  userId: v.string(),
  fullName: v.string(),
  phone: v.string(),
  line1: v.string(),
  line2: v.optional(v.string()),
  city: v.string(),
  state: v.string(),
  pincode: v.string(), // 6-digit Indian pincode
  country: v.string(), // default 'India'
  isDefault: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_user_default', ['userId', 'isDefault'])
  .index('by_user_created', ['userId', 'createdAt']);


const boards = defineTable({
  userId: v.string(),
  name: v.string(),
  slug: v.string(),
  isSystem: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.number(),
  deletedAt: v.optional(v.number()),
})
  .index('by_user', ['userId'])
  .index('by_user_slug', ['userId', 'slug'])
  .index('by_user_system', ['userId', 'isSystem']);

const board_items = defineTable({
  boardId: v.id('boards'),
  productId: v.id('products'),
  addedAt: v.number(),
  deletedAt: v.optional(v.number()),
})
  .index('by_board', ['boardId'])
  .index('by_board_product', ['boardId', 'productId']);


// -----------------------------------------------------------------------------
// SCRAPER CONTEXT - Data Ingestion
// -----------------------------------------------------------------------------

const scraped_products = defineTable({
  externalId: v.string(),
  url: v.string(),
  storageId: v.id('_storage'), // Pointer to File Storage blob
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

// PDP Reviews — Req 4.2: product reviews with rating breakdown
const reviews = defineTable({
  productId: v.id('products'),
  userId: v.string(),
  rating: v.number(), // 1..5
  text: v.string(),
  images: v.optional(v.array(v.string())),
  helpful: v.number(), // helpful count
  createdAt: v.number(),
})
  .index('by_product', ['productId'])
  .index('by_user', ['userId'])
  .index('by_product_created', ['productId', 'createdAt']);

// =============================================================================
// SCHEMA EXPORT
// =============================================================================

export default defineSchema({
  // StyleSwipe Custom Tables
  style_profiles,
  user_devices,
  push_tokens,
  notification_preferences,
  notifications,

  // Governance Context
  feature_flags,
  logs,
  events,

  // Catalog Context
  products,
  product_embeddings,
  categories,
  reviews,

  // Discovery Context
  partner_sync,
  swipes,
  weekly_summaries,

  // Collections
  boards,
  board_items,

  // Bag (cart-as-list)
  carts,

  // Direct shopping (feature-flagged, off by default)
  orders,
  addresses,

  // Scraper Context
  scraped_products,
  scrape_jobs,
  feedback,
});
