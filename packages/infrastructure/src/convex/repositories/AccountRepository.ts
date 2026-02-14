 
// =============================================================================
// CONVEX ACCOUNT REPOSITORY ADAPTER
// Implements AccountRepository port for OAuth provider accounts
// =============================================================================

import type { AccountRepository } from '@app/core';
import type { Account } from '@app/core';
// import type { Id } from '@convex-dataModel';

import { api } from '@app/convex';
import { ConvexClient } from 'convex/browser';

/**
 * Convex implementation of AccountRepository port
 */
export class ConvexAccountRepository implements AccountRepository {
  constructor(private client: ConvexClient) { }

  async findById(id: string): Promise<Account | null> {
    const doc = await this.client.query((api as any).accounts.getById, {
      id,
    });
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByProvider(providerId: string, providerAccountId: string): Promise<Account | null> {
    const doc = await this.client.query((api as any).accounts.getByProvider, {
      providerId,
      accountId: providerAccountId,
    });
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByUserId(userId: string): Promise<Account[]> {
    const docs = await this.client.query((api as any).accounts.getByUserId, {
      userId,
    });
    return docs.map((doc: any) => this.mapToEntity(doc));
  }

  async create(account: Omit<Account, 'id'>): Promise<Account> {
    const id = await this.client.mutation((api as any).accounts.create, {
      userId: account.userId,
      providerId: account.providerId,
      accountId: account.providerAccountId,
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      accessTokenExpiresAt: account.accessTokenExpiresAt,
      scope: account.scope,
    });
    return { ...account, id: id as string };
  }

  async update(id: string, data: Partial<Omit<Account, 'id'>>): Promise<Account> {
    await this.client.mutation((api as any).accounts.update, {
      id,
      ...data,
      accountId: data.providerAccountId,
    });
    const updated = await this.findById(id);
    if (!updated) throw new Error(`Account ${id} not found after update`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.client.mutation((api as any).accounts.remove, {
      id,
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.client.mutation((api as any).accounts.removeByUserId, {
      userId,
    });
  }

  private mapToEntity(doc: Record<string, unknown>): Account {
    return {
      id: (doc._id as string) || '',
      userId: (doc.userId as string) || '',
      providerId: (doc.providerId as string) || '',
      providerAccountId: (doc.accountId as string) || '',
      accessToken: doc.accessToken as string | undefined,
      refreshToken: doc.refreshToken as string | undefined,
      accessTokenExpiresAt: doc.accessTokenExpiresAt as number | undefined,
      scope: doc.scope as string | undefined,
    };
  }
}
