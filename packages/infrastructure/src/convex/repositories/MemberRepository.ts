import type { Member, MemberRole } from '@app/core';

import { MemberRepository, RepositoryError } from '@app/core';
import { Layer, Effect } from 'effect';
// import type { Id } from '@convex-dataModel';

import { api } from '@app/convex';
import { ConvexClient } from 'convex/browser';

/**
 * Convex implementation of MemberRepository port
 */


const mapToEntity = (doc: Record<string, unknown>): Member => {
    return {
  id: (doc._id as string) || '',
  orgId: (doc.orgId as string) || '',
  userId: (doc.userId as string) || '',
  role: (doc.role as MemberRole) || 'member',
  joinedAt: (doc.joinedAt as number) || 0,
};
};


export const createMemberRepositoryLayer = (client: ConvexClient) => Layer.succeed(
    MemberRepository,
    MemberRepository.of({

    findById: (id: string) => Effect.tryPromise({
      try: async () => {
          const doc = await client.query(api.members.getById, { id });
          return doc ? mapToEntity(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByOrgAndUser: (orgId: string, userId: string) => Effect.tryPromise({
      try: async () => {
          const doc = await client.query(api.members.getByOrgAndUser, {
  orgId,
  userId,
});
return doc ? mapToEntity(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByOrg: (orgId: string) => Effect.tryPromise({
      try: async () => {
          const docs = await client.query(api.members.getByOrg, {
  orgId,
});
return docs.map((doc: any) => mapToEntity(doc));
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByUser: (userId: string) => Effect.tryPromise({
      try: async () => {
          const docs = await client.query(api.members.getByUser, {
  userId,
});
return docs.map((doc: any) => mapToEntity(doc));
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    create: (member: Omit<Member, 'id'>) => Effect.tryPromise({
      try: async () => {
          const id = await client.mutation(api.members.create, {
  orgId: member.orgId,
  userId: member.userId,
  role: member.role,
  joinedAt: member.joinedAt,
});
return { ...member, id: id as string };
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    updateRole: (id: string, role: MemberRole) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.members.updateRole, {
              id,
              role,
          });
          const doc = await client.query(api.members.getById, { id });
          if (!doc) throw new Error(`Member ${id} not found after update`);
          return mapToEntity(doc);
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    delete: (id: string) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.members.remove, {
  id,
});
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    deleteByOrg: (orgId: string) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.members.removeByOrg, {
  orgId,
});
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    })
);

