// =============================================================================
// STYLESWIPE DOMAIN ENTITIES
// Pure TypeScript types for Hexagonal Architecture - Zero external dependencies
// =============================================================================

// -----------------------------------------------------------------------------
// IDENTITY CONTEXT
// -----------------------------------------------------------------------------

/**
 * Style sizing preferences
 * PRD Ref: [cite: 112-135]
 */
export interface StyleSizes {
  top?: string;
  bottom?: string;
  shoe?: string;
}

/**
 * Budget range for product recommendations
 * PRD Ref: [cite: 112-135]
 */
export interface BudgetRange {
  min: number;
  max: number;
}

/**
 * User style DNA profile
 * PRD Ref: [cite: 112-135]
 */
export interface StyleProfile {
  gender: 'men' | 'women' | 'both';
  age?: string;
  sizes: StyleSizes;
  vibes: string[]; // e.g., ["party", "chill", "adventure"]
  budget: BudgetRange;
  preferenceVector?: number[]; // 512-dim embedding
}

/**
 * Core user entity
 * PRD Ref: [cite: 91, 107, 108]
 */
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  phone: string; // Required, Unique - Primary auth identifier
  activeOrgId?: string;
  styleProfile?: StyleProfile;
}

/**
 * Session entity for device management
 * PRD Ref: [cite: 91]
 */
export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: number;
  userAgent?: string;
  ipAddress?: string;
  createdAt: number;
}

/**
 * OAuth account linkage
 * PRD Ref: [cite: 91]
 */
export interface Account {
  id: string;
  userId: string;
  providerId: string;
  providerAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
  scope?: string;
}

/**
 * OTP verification entity
 * PRD Ref: [cite: 91]
 */
export type VerificationType = 'phone_otp' | 'email_otp' | 'magic_link';

export interface Verification {
  id: string;
  identifier: string;
  token: string;
  type: VerificationType;
  expiresAt: number;
  createdAt: number;
}

// -----------------------------------------------------------------------------
// ORGANIZATION CONTEXT
// -----------------------------------------------------------------------------

/**
 * Organization types for multi-tenant classification
 */
export type OrganizationType = 'influencer_agency' | 'brand_partner';

/**
 * Organization metadata
 */
export interface OrganizationMetadata {
  type?: OrganizationType;
  website?: string;
  description?: string;
}

/**
 * Multi-tenant organization entity
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  metadata?: OrganizationMetadata;
  createdAt: number;
}

/**
 * RBAC member roles
 */
export type MemberRole = 'admin' | 'member' | 'influencer' | 'brand_manager';

/**
 * Organization membership entity
 */
export interface Member {
  id: string;
  orgId: string;
  userId: string;
  role: MemberRole;
  joinedAt: number;
}

// -----------------------------------------------------------------------------
// GOVERNANCE CONTEXT
// -----------------------------------------------------------------------------

/**
 * Feature flag targeting rule types
 */
export type FeatureFlagRuleType = 'user_id' | 'role' | 'percentage' | 'org_id';

/**
 * Targeting rule for gradual rollouts and A/B testing
 */
export interface FeatureFlagRule {
  type: FeatureFlagRuleType;
  value: string;
}

/**
 * Deployment environment
 */
export type Environment = 'dev' | 'staging' | 'prod';

/**
 * Feature flag entity for controlled rollouts
 */
export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  environment: Environment;
  rules?: FeatureFlagRule[];
  updatedAt: number;
}

/**
 * Log severity levels
 */
export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

/**
 * Structured log entry
 */
export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  traceId?: string;
  userId?: string;
  timestamp: number;
}

/**
 * Strategic event sampling for analytics
 * PRD Ref: [cite: 17, 31-33]
 */
export interface SampledEvent {
  id: string;
  type: string;
  userId?: string;
  productId?: string;
  variant?: string;
  isSampled: boolean;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

// -----------------------------------------------------------------------------
// CATALOG CONTEXT
// -----------------------------------------------------------------------------

/**
 * Product attributes for filtering and display
 */
export interface ProductAttributes {
  color?: string;
  size?: string[];
  material?: string;
  fit?: string;
  occasion?: string[];
}

/**
 * Product entity
 * PRD Ref: [cite: 44, 201-203]
 */
export interface Product {
  id: string;
  brand: string;
  title: string;
  price: number;
  mrp: number;
  category: string;
  images: string[];
  attributes?: ProductAttributes;
  embedding?: number[]; // 512-dim vector for similarity search
  meta?: Record<string, unknown>;
  createdAt?: number;
  updatedAt?: number;
}

// -----------------------------------------------------------------------------
// DISCOVERY CONTEXT
// -----------------------------------------------------------------------------

/**
 * Partner sync session status
 */
export type PartnerSyncStatus = 'pending' | 'active' | 'expired';

/**
 * Partner sync session for collaborative shopping
 * PRD Ref: [cite: 151-155, 172-173]
 */
export interface PartnerSync {
  id: string;
  initiatorId: string;
  partnerId?: string;
  inviteCode: string;
  status: PartnerSyncStatus;
  expiresAt: number;
  influenceRatio: number; // 0.0 to 1.0
  createdAt: number;
}

// -----------------------------------------------------------------------------
// SCRAPER CONTEXT
// -----------------------------------------------------------------------------

/**
 * Supported e-commerce platforms
 */
export type Platform = 'Myntra' | 'Ajio' | 'Amazon';

/**
 * Scraped product data from e-commerce platforms
 * Matches browser extension's mapToScrapedProduct output
 */
export interface ScrapedProduct {
  externalId: string;
  url: string;
  brand: string;
  title: string;
  price: number;
  mrp: number;
  discount: string;
  images: string[];
  availableSizes: string[];
  description: string;
  rating: number;
  reviewCount: number;
  platform: Platform;
  attributes: Record<string, unknown>;
  gender?: string;
  category?: string;
  masterCategory?: string;
  subCategory?: string;
  embedding?: number[];
  raw?: unknown;
}

/**
 * Queue item status for processing pipeline
 */
export type QueueItemStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Generic queue item wrapper
 */
export interface QueueItem<T = unknown> {
  id: string;
  data: T;
  status: QueueItemStatus;
  retries: number;
  createdAt: number;
  updatedAt: number;
  error?: string;
}

// -----------------------------------------------------------------------------
// UTILITY TYPES
// -----------------------------------------------------------------------------

/**
 * Generic ID type for Convex document references
 */
export type DocumentId<T extends string = string> = string & { __tableName: T };

/**
 * Timestamp in Unix milliseconds
 */
export type UnixTimestamp = number;

/**
 * Embedding vector type (384 dimensions for BGE-Small)
 */
export type EmbeddingVector = number[];
