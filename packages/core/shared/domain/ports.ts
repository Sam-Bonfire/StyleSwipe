// =============================================================================
// REPOSITORY PORTS (Interfaces)
// Hexagonal Architecture - Domain layer defines contracts, infrastructure implements
// =============================================================================

import type {
    User,
    StyleProfile,
    Session,
    Account,
    Verification,
    VerificationType,
    Organization,
    Member,
    MemberRole,
    FeatureFlag,
    Environment,
    LogEntry,
    LogLevel,
    SampledEvent,
    Product,
    PartnerSync,
    PartnerSyncStatus,
} from "./types";

// -----------------------------------------------------------------------------
// IDENTITY CONTEXT PORTS
// -----------------------------------------------------------------------------

/**
 * User repository port
 */
export interface UserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByPhone(phone: string): Promise<User | null>;
    create(user: Omit<User, "id">): Promise<User>;
    update(id: string, data: Partial<Omit<User, "id">>): Promise<User>;
    updateStyleProfile(id: string, profile: StyleProfile): Promise<User>;
    delete(id: string): Promise<void>;
}

/**
 * Session repository port
 */
export interface SessionRepository {
    findById(id: string): Promise<Session | null>;
    findByToken(token: string): Promise<Session | null>;
    findByUserId(userId: string): Promise<Session[]>;
    create(session: Omit<Session, "id">): Promise<Session>;
    delete(id: string): Promise<void>;
    deleteByUserId(userId: string): Promise<void>;
    deleteExpired(): Promise<number>; // Returns count of deleted sessions
}

/**
 * Account repository port (OAuth providers)
 */
export interface AccountRepository {
    findById(id: string): Promise<Account | null>;
    findByProvider(providerId: string, providerAccountId: string): Promise<Account | null>;
    findByUserId(userId: string): Promise<Account[]>;
    create(account: Omit<Account, "id">): Promise<Account>;
    update(id: string, data: Partial<Omit<Account, "id">>): Promise<Account>;
    delete(id: string): Promise<void>;
    deleteByUserId(userId: string): Promise<void>;
}

/**
 * Verification repository port (OTP)
 */
export interface VerificationRepository {
    findByIdentifier(identifier: string): Promise<Verification | null>;
    findByToken(token: string): Promise<Verification | null>;
    create(verification: Omit<Verification, "id">): Promise<Verification>;
    delete(id: string): Promise<void>;
    deleteByIdentifier(identifier: string): Promise<void>;
    deleteExpired(): Promise<number>;
}

// -----------------------------------------------------------------------------
// ORGANIZATION CONTEXT PORTS
// -----------------------------------------------------------------------------

/**
 * Organization repository port
 */
export interface OrganizationRepository {
    findById(id: string): Promise<Organization | null>;
    findBySlug(slug: string): Promise<Organization | null>;
    create(org: Omit<Organization, "id">): Promise<Organization>;
    update(id: string, data: Partial<Omit<Organization, "id">>): Promise<Organization>;
    delete(id: string): Promise<void>;
}

/**
 * Member repository port
 */
export interface MemberRepository {
    findById(id: string): Promise<Member | null>;
    findByOrgAndUser(orgId: string, userId: string): Promise<Member | null>;
    findByOrg(orgId: string): Promise<Member[]>;
    findByUser(userId: string): Promise<Member[]>;
    create(member: Omit<Member, "id">): Promise<Member>;
    updateRole(id: string, role: MemberRole): Promise<Member>;
    delete(id: string): Promise<void>;
    deleteByOrg(orgId: string): Promise<void>;
}

// -----------------------------------------------------------------------------
// GOVERNANCE CONTEXT PORTS
// -----------------------------------------------------------------------------

/**
 * Feature flag repository port
 */
export interface FeatureFlagRepository {
    findById(id: string): Promise<FeatureFlag | null>;
    findByName(environment: Environment, name: string): Promise<FeatureFlag | null>;
    findByEnvironment(environment: Environment): Promise<FeatureFlag[]>;
    create(flag: Omit<FeatureFlag, "id">): Promise<FeatureFlag>;
    update(id: string, data: Partial<Omit<FeatureFlag, "id">>): Promise<FeatureFlag>;
    delete(id: string): Promise<void>;
}

/**
 * Log repository port
 */
export interface LogRepository {
    create(entry: Omit<LogEntry, "id">): Promise<LogEntry>;
    findByLevel(level: LogLevel, limit?: number): Promise<LogEntry[]>;
    findByTraceId(traceId: string): Promise<LogEntry[]>;
    findByUserId(userId: string, limit?: number): Promise<LogEntry[]>;
    deleteOlderThan(timestamp: number): Promise<number>;
}

/**
 * Event repository port (Strategic sampling)
 */
export interface EventRepository {
    create(event: Omit<SampledEvent, "id">): Promise<SampledEvent>;
    findByUserAndType(userId: string, type: string, limit?: number): Promise<SampledEvent[]>;
    findByType(type: string, limit?: number): Promise<SampledEvent[]>;
    findSampledByType(type: string, limit?: number): Promise<SampledEvent[]>;
}

// -----------------------------------------------------------------------------
// CATALOG CONTEXT PORTS
// -----------------------------------------------------------------------------

/**
 * Product repository port
 */
export interface ProductRepository {
    findById(id: string): Promise<Product | null>;
    findByCategory(category: string, limit?: number): Promise<Product[]>;
    findByCategoryAndPrice(
        category: string,
        minPrice: number,
        maxPrice: number,
        limit?: number
    ): Promise<Product[]>;
    findByBrand(brand: string, limit?: number): Promise<Product[]>;
    searchByTitle(query: string, filters?: { brand?: string; category?: string }): Promise<Product[]>;
    findSimilar(embedding: number[], limit?: number, filters?: { category?: string; brand?: string }): Promise<Product[]>;
    create(product: Omit<Product, "id">): Promise<Product>;
    update(id: string, data: Partial<Omit<Product, "id">>): Promise<Product>;
    updateEmbedding(id: string, embedding: number[]): Promise<Product>;
    delete(id: string): Promise<void>;
}

// -----------------------------------------------------------------------------
// DISCOVERY CONTEXT PORTS
// -----------------------------------------------------------------------------

/**
 * Partner sync repository port
 */
export interface PartnerSyncRepository {
    findById(id: string): Promise<PartnerSync | null>;
    findByInviteCode(inviteCode: string): Promise<PartnerSync | null>;
    findByInitiator(initiatorId: string): Promise<PartnerSync[]>;
    findByPartner(partnerId: string): Promise<PartnerSync[]>;
    findActiveByUser(userId: string): Promise<PartnerSync | null>;
    create(sync: Omit<PartnerSync, "id">): Promise<PartnerSync>;
    update(id: string, data: Partial<Omit<PartnerSync, "id">>): Promise<PartnerSync>;
    updateStatus(id: string, status: PartnerSyncStatus): Promise<PartnerSync>;
    delete(id: string): Promise<void>;
    deleteExpired(): Promise<number>;
}

// -----------------------------------------------------------------------------
// AGGREGATE REPOSITORY INTERFACE
// -----------------------------------------------------------------------------

/**
 * Aggregate interface for all repositories
 * Used for dependency injection in use cases
 */
export interface Repositories {
    users: UserRepository;
    sessions: SessionRepository;
    accounts: AccountRepository;
    verifications: VerificationRepository;
    organizations: OrganizationRepository;
    members: MemberRepository;
    featureFlags: FeatureFlagRepository;
    logs: LogRepository;
    events: EventRepository;
    products: ProductRepository;
    partnerSync: PartnerSyncRepository;
}
