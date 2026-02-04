/* eslint-disable @typescript-eslint/no-explicit-any */
// =============================================================================
// CONVEX VERIFICATION REPOSITORY ADAPTER
// Implements VerificationRepository port for OTP lifecycle
// =============================================================================

import type { VerificationRepository } from '@app/core';
import type { Verification, VerificationType } from '@app/core';
// import type { Id } from '@convex-dataModel';

import { api } from '@convex-api';
import { ConvexClient } from 'convex/browser';

/**
 * Convex implementation of VerificationRepository port
 */
export class ConvexVerificationRepository implements VerificationRepository {
  constructor(private client: ConvexClient) { }

  async findByIdentifier(identifier: string): Promise<Verification | null> {
    const doc = await this.client.query((api as any).verifications.getByIdentifier, {
      identifier,
    });
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByToken(token: string): Promise<Verification | null> {
    const doc = await this.client.query((api as any).verifications.getByToken, {
      value: token,
    });
    return doc ? this.mapToEntity(doc) : null;
  }

  async create(verification: Omit<Verification, 'id'>): Promise<Verification> {
    const id = await this.client.mutation((api as any).verifications.create, {
      identifier: verification.identifier,
      value: verification.token,
      expiresAt: verification.expiresAt,
      createdAt: verification.createdAt,
    });
    return { ...verification, id: id as string };
  }

  async delete(id: string): Promise<void> {
    await this.client.mutation((api as any).verifications.remove, {
      id,
    });
  }

  async deleteByIdentifier(identifier: string): Promise<void> {
    await this.client.mutation((api as any).verifications.removeByIdentifier, {
      identifier,
    });
  }

  async deleteExpired(): Promise<number> {
    return await this.client.mutation((api as any).verifications.deleteExpired, {
      now: Date.now(),
    });
  }

  private mapToEntity(doc: Record<string, unknown>): Verification {
    return {
      id: (doc._id as string) || '',
      identifier: (doc.identifier as string) || '',
      token: (doc.token as string) || (doc.value as string) || '',
      type: (doc.type as VerificationType) || 'phone_otp',
      expiresAt: (doc.expiresAt as number) || 0,
      createdAt: (doc.createdAt as number) || 0,
    };
  }
}
