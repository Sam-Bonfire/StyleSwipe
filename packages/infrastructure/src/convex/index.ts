// =============================================================================
// CONVEX REPOSITORY FACTORY
// Creates all repository instances with shared Convex client
// =============================================================================

import type { Repositories } from '@app/core';

import { ConvexClient } from 'convex/browser';

import { ConvexAccountRepository } from './repositories/AccountRepository';
import { ConvexEventRepository } from './repositories/EventRepository';
import { ConvexFeatureFlagRepository } from './repositories/FeatureFlagRepository';
import { ConvexLogRepository } from './repositories/LogRepository';
import { ConvexMemberRepository } from './repositories/MemberRepository';
import { ConvexOrganizationRepository } from './repositories/OrganizationRepository';
import { ConvexPartnerSyncRepository } from './repositories/PartnerSyncRepository';
import { ConvexProductRepository } from './repositories/ProductRepository';
import { ConvexSessionRepository } from './repositories/SessionRepository';
import { ConvexUserRepository } from './repositories/UserRepository';
import { ConvexVerificationRepository } from './repositories/VerificationRepository';

/**
 * Factory function to create all Convex repository adapters
 * @param convexUrl - The Convex deployment URL
 * @returns Repositories aggregate containing all repository instances
 */
export function createConvexRepositories(convexUrl: string): Repositories {
  const client = new ConvexClient(convexUrl);

  return {
    users: new ConvexUserRepository(client),
    sessions: new ConvexSessionRepository(client),
    accounts: new ConvexAccountRepository(client),
    verifications: new ConvexVerificationRepository(client),
    organizations: new ConvexOrganizationRepository(client),
    members: new ConvexMemberRepository(client),
    featureFlags: new ConvexFeatureFlagRepository(client),
    logs: new ConvexLogRepository(client),
    events: new ConvexEventRepository(client),
    products: new ConvexProductRepository(client),
    partnerSync: new ConvexPartnerSyncRepository(client),
  };
}

/**
 * Factory function to create repositories with an existing Convex client
 * Useful when you need to share a client instance
 */
export function createConvexRepositoriesWithClient(client: ConvexClient): Repositories {
  return {
    users: new ConvexUserRepository(client),
    sessions: new ConvexSessionRepository(client),
    accounts: new ConvexAccountRepository(client),
    verifications: new ConvexVerificationRepository(client),
    organizations: new ConvexOrganizationRepository(client),
    members: new ConvexMemberRepository(client),
    featureFlags: new ConvexFeatureFlagRepository(client),
    logs: new ConvexLogRepository(client),
    events: new ConvexEventRepository(client),
    products: new ConvexProductRepository(client),
    partnerSync: new ConvexPartnerSyncRepository(client),
  };
}
