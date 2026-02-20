import { Context, Effect } from 'effect';

import type {
  User,
  StyleProfile,
  Session,
  Account,
  Verification,
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
  Feedback,
  FeedbackStatus,
  ScrapingJob,
  ScrapeJobType,
  ScraperMode,
  AdminStats,
  PaginationOpts,
  PaginatedResult,
} from '../domain/types';

import { RepositoryError, AuthError } from '../domain/errors';
export { RepositoryError, AuthError };

// -----------------------------------------------------------------------------
// AUTH PORTS
// -----------------------------------------------------------------------------

export class AuthService extends Context.Tag('AuthService')<
  AuthService,
  {
    readonly signInWithPhone: (phoneNumber: string) => Effect.Effect<void, AuthError>;
    readonly verifyOTP: (phoneNumber: string, otp: string) => Effect.Effect<void, AuthError>;
    readonly signUpWithEmail: (
      email: string,
      password: string,
      name: string,
    ) => Effect.Effect<void, AuthError>;
    readonly signInWithEmail: (email: string, password: string) => Effect.Effect<void, AuthError>;
    readonly signOut: () => Effect.Effect<void, AuthError>;

    // Organization Management
    readonly createOrganization: (
      name: string,
      slug: string,
      metadata?: string,
    ) => Effect.Effect<any, AuthError>;
    readonly listOrganizations: () => Effect.Effect<any[], AuthError>;
    readonly getActiveOrganization: () => Effect.Effect<any, AuthError>;
    readonly setActiveOrganization: (organizationId: string) => Effect.Effect<void, AuthError>;
    readonly updateOrganization: (
      organizationId: string,
      data: { name?: string; slug?: string; logo?: string; metadata?: string },
    ) => Effect.Effect<any, AuthError>;
    readonly deleteOrganization: (organizationId: string) => Effect.Effect<void, AuthError>;

    // Member Management
    readonly inviteMember: (
      organizationId: string,
      email: string,
      role?: string,
    ) => Effect.Effect<any, AuthError>;
    readonly removeMember: (membershipId: string) => Effect.Effect<void, AuthError>;
    readonly updateMemberRole: (
      membershipId: string,
      role: string,
    ) => Effect.Effect<void, AuthError>;
    readonly listMembers: (organizationId: string) => Effect.Effect<any[], AuthError>;
  }
>() {}

// -----------------------------------------------------------------------------
// IDENTITY CONTEXT PORTS
// -----------------------------------------------------------------------------

export class UserRepository extends Context.Tag('UserRepository')<
  UserRepository,
  {
    readonly findById: (id: string) => Effect.Effect<User | null, RepositoryError>;
    readonly findByEmail: (email: string) => Effect.Effect<User | null, RepositoryError>;
    readonly findByPhone: (phone: string) => Effect.Effect<User | null, RepositoryError>;
    readonly create: (user: Omit<User, 'id'>) => Effect.Effect<User, RepositoryError>;
    readonly update: (
      id: string,
      data: Partial<Omit<User, 'id'>>,
    ) => Effect.Effect<User, RepositoryError>;
    readonly updateStyleProfile: (
      id: string,
      profile: StyleProfile,
    ) => Effect.Effect<User, RepositoryError>;
    readonly delete: (id: string) => Effect.Effect<void, RepositoryError>;
  }
>() {}

export class SessionRepository extends Context.Tag('SessionRepository')<
  SessionRepository,
  {
    readonly findById: (id: string) => Effect.Effect<Session | null, RepositoryError>;
    readonly findByToken: (token: string) => Effect.Effect<Session | null, RepositoryError>;
    readonly findByUserId: (userId: string) => Effect.Effect<Session[], RepositoryError>;
    readonly create: (session: Omit<Session, 'id'>) => Effect.Effect<Session, RepositoryError>;
    readonly delete: (id: string) => Effect.Effect<void, RepositoryError>;
    readonly deleteByUserId: (userId: string) => Effect.Effect<void, RepositoryError>;
    readonly deleteExpired: () => Effect.Effect<number, RepositoryError>;
  }
>() {}

export class AccountRepository extends Context.Tag('AccountRepository')<
  AccountRepository,
  {
    readonly findById: (id: string) => Effect.Effect<Account | null, RepositoryError>;
    readonly findByProvider: (
      providerId: string,
      providerAccountId: string,
    ) => Effect.Effect<Account | null, RepositoryError>;
    readonly findByUserId: (userId: string) => Effect.Effect<Account[], RepositoryError>;
    readonly create: (account: Omit<Account, 'id'>) => Effect.Effect<Account, RepositoryError>;
    readonly update: (
      id: string,
      data: Partial<Omit<Account, 'id'>>,
    ) => Effect.Effect<Account, RepositoryError>;
    readonly delete: (id: string) => Effect.Effect<void, RepositoryError>;
    readonly deleteByUserId: (userId: string) => Effect.Effect<void, RepositoryError>;
  }
>() {}

export class VerificationRepository extends Context.Tag('VerificationRepository')<
  VerificationRepository,
  {
    readonly findByIdentifier: (
      identifier: string,
    ) => Effect.Effect<Verification | null, RepositoryError>;
    readonly findByToken: (token: string) => Effect.Effect<Verification | null, RepositoryError>;
    readonly create: (
      verification: Omit<Verification, 'id'>,
    ) => Effect.Effect<Verification, RepositoryError>;
    readonly delete: (id: string) => Effect.Effect<void, RepositoryError>;
    readonly deleteByIdentifier: (identifier: string) => Effect.Effect<void, RepositoryError>;
    readonly deleteExpired: () => Effect.Effect<number, RepositoryError>;
  }
>() {}

// -----------------------------------------------------------------------------
// ORGANIZATION CONTEXT PORTS
// -----------------------------------------------------------------------------

export class OrganizationRepository extends Context.Tag('OrganizationRepository')<
  OrganizationRepository,
  {
    readonly findById: (id: string) => Effect.Effect<Organization | null, RepositoryError>;
    readonly findBySlug: (slug: string) => Effect.Effect<Organization | null, RepositoryError>;
    readonly create: (
      org: Omit<Organization, 'id'>,
    ) => Effect.Effect<Organization, RepositoryError>;
    readonly update: (
      id: string,
      data: Partial<Omit<Organization, 'id'>>,
    ) => Effect.Effect<Organization, RepositoryError>;
    readonly delete: (id: string) => Effect.Effect<void, RepositoryError>;
  }
>() {}

export class MemberRepository extends Context.Tag('MemberRepository')<
  MemberRepository,
  {
    readonly findById: (id: string) => Effect.Effect<Member | null, RepositoryError>;
    readonly findByOrgAndUser: (
      orgId: string,
      userId: string,
    ) => Effect.Effect<Member | null, RepositoryError>;
    readonly findByOrg: (orgId: string) => Effect.Effect<Member[], RepositoryError>;
    readonly findByUser: (userId: string) => Effect.Effect<Member[], RepositoryError>;
    readonly create: (member: Omit<Member, 'id'>) => Effect.Effect<Member, RepositoryError>;
    readonly updateRole: (id: string, role: MemberRole) => Effect.Effect<Member, RepositoryError>;
    readonly delete: (id: string) => Effect.Effect<void, RepositoryError>;
    readonly deleteByOrg: (orgId: string) => Effect.Effect<void, RepositoryError>;
  }
>() {}

// -----------------------------------------------------------------------------
// GOVERNANCE CONTEXT PORTS
// -----------------------------------------------------------------------------

export class FeatureFlagRepository extends Context.Tag('FeatureFlagRepository')<
  FeatureFlagRepository,
  {
    readonly findById: (id: string) => Effect.Effect<FeatureFlag | null, RepositoryError>;
    readonly findByName: (
      environment: Environment,
      name: string,
    ) => Effect.Effect<FeatureFlag | null, RepositoryError>;
    readonly findByEnvironment: (
      environment: Environment,
    ) => Effect.Effect<FeatureFlag[], RepositoryError>;
    readonly create: (flag: Omit<FeatureFlag, 'id'>) => Effect.Effect<FeatureFlag, RepositoryError>;
    readonly update: (
      id: string,
      data: Partial<Omit<FeatureFlag, 'id'>>,
    ) => Effect.Effect<FeatureFlag, RepositoryError>;
    readonly delete: (id: string) => Effect.Effect<void, RepositoryError>;
  }
>() {}

export class LogRepository extends Context.Tag('LogRepository')<
  LogRepository,
  {
    readonly create: (entry: Omit<LogEntry, 'id'>) => Effect.Effect<LogEntry, RepositoryError>;
    readonly findByLevel: (
      level: LogLevel,
      limit?: number,
    ) => Effect.Effect<LogEntry[], RepositoryError>;
    readonly findByTraceId: (traceId: string) => Effect.Effect<LogEntry[], RepositoryError>;
    readonly findByUserId: (
      userId: string,
      limit?: number,
    ) => Effect.Effect<LogEntry[], RepositoryError>;
    readonly deleteOlderThan: (timestamp: number) => Effect.Effect<number, RepositoryError>;
    readonly list: (
      paginationOpts: PaginationOpts,
    ) => Effect.Effect<PaginatedResult<LogEntry>, RepositoryError>;
  }
>() {}

export class EventRepository extends Context.Tag('EventRepository')<
  EventRepository,
  {
    readonly create: (
      event: Omit<SampledEvent, 'id'>,
    ) => Effect.Effect<SampledEvent, RepositoryError>;
    readonly findByUserAndType: (
      userId: string,
      type: string,
      limit?: number,
    ) => Effect.Effect<SampledEvent[], RepositoryError>;
    readonly findByType: (
      type: string,
      limit?: number,
    ) => Effect.Effect<SampledEvent[], RepositoryError>;
    readonly findSampledByType: (
      type: string,
      limit?: number,
    ) => Effect.Effect<SampledEvent[], RepositoryError>;
  }
>() {}

// -----------------------------------------------------------------------------
// CATALOG CONTEXT PORTS
// -----------------------------------------------------------------------------

export class ProductRepository extends Context.Tag('ProductRepository')<
  ProductRepository,
  {
    readonly findById: (id: string) => Effect.Effect<Product | null, RepositoryError>;
    readonly findByCategory: (
      category: string,
      limit?: number,
    ) => Effect.Effect<Product[], RepositoryError>;
    readonly findByCategoryAndPrice: (
      category: string,
      minPrice: number,
      maxPrice: number,
      limit?: number,
    ) => Effect.Effect<Product[], RepositoryError>;
    readonly findByBrand: (
      brand: string,
      limit?: number,
    ) => Effect.Effect<Product[], RepositoryError>;
    readonly searchByTitle: (
      query: string,
      filters?: { brand?: string; category?: string },
    ) => Effect.Effect<Product[], RepositoryError>;
    readonly findSimilar: (
      embedding: number[],
      limit?: number,
      filters?: { category?: string; brand?: string },
    ) => Effect.Effect<Product[], RepositoryError>;
    readonly getLatest: (limit: number) => Effect.Effect<Product[], RepositoryError>;
    readonly create: (product: Omit<Product, 'id'>) => Effect.Effect<Product, RepositoryError>;
    readonly update: (
      id: string,
      data: Partial<Omit<Product, 'id'>>,
    ) => Effect.Effect<Product, RepositoryError>;
    readonly updateEmbedding: (
      id: string,
      embedding: number[],
    ) => Effect.Effect<Product, RepositoryError>;
    readonly delete: (id: string) => Effect.Effect<void, RepositoryError>;
  }
>() {}

// -----------------------------------------------------------------------------
// DISCOVERY CONTEXT PORTS
// -----------------------------------------------------------------------------

export class PartnerSyncRepository extends Context.Tag('PartnerSyncRepository')<
  PartnerSyncRepository,
  {
    readonly findById: (id: string) => Effect.Effect<PartnerSync | null, RepositoryError>;
    readonly findByInviteCode: (
      inviteCode: string,
    ) => Effect.Effect<PartnerSync | null, RepositoryError>;
    readonly findByInitiator: (
      initiatorId: string,
    ) => Effect.Effect<PartnerSync[], RepositoryError>;
    readonly findByPartner: (partnerId: string) => Effect.Effect<PartnerSync[], RepositoryError>;
    readonly findActiveByUser: (
      userId: string,
    ) => Effect.Effect<PartnerSync | null, RepositoryError>;
    readonly create: (sync: Omit<PartnerSync, 'id'>) => Effect.Effect<PartnerSync, RepositoryError>;
    readonly update: (
      id: string,
      data: Partial<Omit<PartnerSync, 'id'>>,
    ) => Effect.Effect<PartnerSync, RepositoryError>;
    readonly updateStatus: (
      id: string,
      status: PartnerSyncStatus,
    ) => Effect.Effect<PartnerSync, RepositoryError>;
    readonly delete: (id: string) => Effect.Effect<void, RepositoryError>;
    readonly deleteExpired: () => Effect.Effect<number, RepositoryError>;
  }
>() {}

// -----------------------------------------------------------------------------
// SUPPORT CONTEXT PORTS
// -----------------------------------------------------------------------------

export class FeedbackRepository extends Context.Tag('FeedbackRepository')<
  FeedbackRepository,
  {
    readonly create: (
      feedback: Omit<Feedback, 'id' | 'replies' | 'status' | 'updatedAt' | 'createdAt'>,
    ) => Effect.Effect<Feedback, RepositoryError>;
    readonly findById: (id: string) => Effect.Effect<Feedback | null, RepositoryError>;
    readonly listByUser: (userId: string) => Effect.Effect<Feedback[], RepositoryError>;
    readonly list: (
      paginationOpts: PaginationOpts,
    ) => Effect.Effect<PaginatedResult<Feedback>, RepositoryError>;
    readonly updateStatus: (
      id: string,
      status: FeedbackStatus,
    ) => Effect.Effect<void, RepositoryError>;
    readonly addReply: (
      id: string,
      adminId: string,
      message: string,
    ) => Effect.Effect<void, RepositoryError>;
    readonly generateUploadUrl: () => Effect.Effect<string, RepositoryError>;
  }
>() {}

// -----------------------------------------------------------------------------
// ADMIN CONTEXT PORTS
// -----------------------------------------------------------------------------

export class AdminRepository extends Context.Tag('AdminRepository')<
  AdminRepository,
  {
    readonly getStats: () => Effect.Effect<AdminStats, RepositoryError>;
    readonly getScrapedProducts: (
      paginationOpts: PaginationOpts,
    ) => Effect.Effect<PaginatedResult<Product>, RepositoryError>;
    readonly searchProducts: (
      query: string,
      paginationOpts: PaginationOpts,
    ) => Effect.Effect<PaginatedResult<Product>, RepositoryError>;
    readonly retriggerScrape: (productId: string) => Effect.Effect<void, RepositoryError>;
  }
>() {}

export class OrganizationAdminRepository extends Context.Tag('OrganizationAdminRepository')<
  OrganizationAdminRepository,
  {
    readonly listOrganizationsWithMembers: (
      paginationOpts: PaginationOpts,
    ) => Effect.Effect<PaginatedResult<Organization & { members: Member[] }>, RepositoryError>;
    readonly searchOrganizations: (
      query: string,
      paginationOpts: PaginationOpts,
    ) => Effect.Effect<PaginatedResult<Organization>, RepositoryError>;
    readonly updateOrganization: (
      id: string,
      data: Partial<Organization>,
    ) => Effect.Effect<Organization, RepositoryError>;
    readonly listUsersWithOrgs: (
      paginationOpts: PaginationOpts,
    ) => Effect.Effect<PaginatedResult<User & { organizations: Organization[] }>, RepositoryError>;
    readonly searchUsers: (
      query: string,
      paginationOpts: PaginationOpts,
    ) => Effect.Effect<PaginatedResult<User>, RepositoryError>;
    readonly updateUserDetails: (
      id: string,
      data: Partial<User>,
    ) => Effect.Effect<User, RepositoryError>;
  }
>() {}

// -----------------------------------------------------------------------------
// SCRAPER CONTEXT PORTS
// -----------------------------------------------------------------------------

export class ScraperRepository extends Context.Tag('ScraperRepository')<
  ScraperRepository,
  {
    readonly listJobs: (
      paginationOpts: PaginationOpts,
    ) => Effect.Effect<PaginatedResult<ScrapingJob>, RepositoryError>;
    readonly createJob: (input: {
      type: ScrapeJobType;
      query: string;
      maxPages?: number;
      startPage?: number;
      scraperMode?: ScraperMode;
    }) => Effect.Effect<ScrapingJob, RepositoryError>;
    readonly getJobById: (id: string) => Effect.Effect<ScrapingJob | null, RepositoryError>;
  }
>() {}

// -----------------------------------------------------------------------------
// QUEUE PORT
// -----------------------------------------------------------------------------

export interface QueueService<T> {
  readonly push: (item: T) => Effect.Effect<string, RepositoryError>;
  readonly pushBatch: (items: T[]) => Effect.Effect<string[], RepositoryError>;
  readonly pull: (
    batchSize?: number,
  ) => Effect.Effect<Array<{ id: string; data: T }>, RepositoryError>;
  readonly complete: (id: string) => Effect.Effect<void, RepositoryError>;
  readonly fail: (id: string, error?: string) => Effect.Effect<void, RepositoryError>;
  readonly size: () => Effect.Effect<number, RepositoryError>;
}
export const QueueTag = Context.GenericTag<QueueService<any>>('Queue');

// -----------------------------------------------------------------------------
// EMBEDDER PORT
// -----------------------------------------------------------------------------

export class Embedder extends Context.Tag('Embedder')<
  Embedder,
  {
    readonly generateEmbedding: (text: string) => Effect.Effect<number[], RepositoryError>;
    readonly getDimensions: () => Effect.Effect<number, never>;
  }
>() {}
