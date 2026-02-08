import type { BetterAuthOptions } from 'better-auth/minimal';
import type { FunctionHandle, SchemaDefinition } from 'convex/server';
import type { GenericId } from 'convex/values';

import { getAuthTables } from 'better-auth/db';
import { mutationGeneric, paginationOptsValidator, queryGeneric } from 'convex/server';
import { v } from 'convex/values';
import { asyncMap } from 'convex-helpers';
import { partial } from 'convex-helpers/validators';

import type { TableNames } from './_generated/dataModel';

import {
  adapterWhereValidator,
  checkUniqueFields,
  hasUniqueFields,
  listOne,
  paginate,
  selectFields,
} from './adapterUtils';

const whereValidator = (schema: SchemaDefinition<any, any>, tableName: TableNames) =>
  v.object({
    field: v.union(
      ...Object.keys(schema.tables[tableName].validator.fields).map((field) => v.literal(field)),
      v.literal('_id'),
    ),
    operator: v.optional(
      v.union(
        v.literal('lt'),
        v.literal('lte'),
        v.literal('gt'),
        v.literal('gte'),
        v.literal('eq'),
        v.literal('in'),
        v.literal('not_in'),
        v.literal('ne'),
        v.literal('contains'),
        v.literal('starts_with'),
        v.literal('ends_with'),
      ),
    ),
    value: v.union(
      v.string(),
      v.number(),
      v.boolean(),
      v.array(v.string()),
      v.array(v.number()),
      v.null(),
    ),
    connector: v.optional(v.union(v.literal('AND'), v.literal('OR'))),
  });

export const createApi = <Schema extends SchemaDefinition<any, any>>(
  schema: Schema,
  createAuthOptions: (ctx: any) => BetterAuthOptions,
) => {
  const betterAuthSchema = getAuthTables(createAuthOptions({} as any));
  return {
    create: mutationGeneric({
      args: {
        input: v.union(
          ...Object.entries(schema.tables).map(([model, table]) =>
            v.object({
              model: v.literal(model),
              data: v.object((table as any).validator.fields),
            }),
          ),
        ),
        select: v.optional(v.array(v.string())),
        onCreateHandle: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        await checkUniqueFields(ctx, schema, betterAuthSchema, args.input.model, args.input.data);
        const id = await ctx.db.insert(args.input.model as any, args.input.data);
        const doc = await ctx.db.get(id);
        if (!doc) {
          throw new Error(`Failed to create ${args.input.model}`);
        }
        const result = selectFields(doc, args.select);
        if (args.onCreateHandle) {
          await ctx.runMutation(args.onCreateHandle as FunctionHandle<'mutation'>, {
            model: args.input.model,
            doc,
          });
        }
        return result;
      },
    }),
    findOne: queryGeneric({
      args: {
        model: v.union(...Object.keys(schema.tables).map((model) => v.literal(model))),
        where: v.optional(v.array(adapterWhereValidator)),
        select: v.optional(v.array(v.string())),
        join: v.optional(v.any()),
      },
      handler: async (ctx, args) => {
        return await listOne(ctx, schema, betterAuthSchema, args);
      },
    }),
    findMany: queryGeneric({
      args: {
        model: v.union(...Object.keys(schema.tables).map((model) => v.literal(model))),
        where: v.optional(v.array(adapterWhereValidator)),
        limit: v.optional(v.number()),
        sortBy: v.optional(
          v.object({
            direction: v.union(v.literal('asc'), v.literal('desc')),
            field: v.string(),
          }),
        ),
        offset: v.optional(v.number()),
        join: v.optional(v.any()),
        paginationOpts: paginationOptsValidator,
      },
      handler: async (ctx, args) => {
        return await paginate(ctx, schema, betterAuthSchema, args);
      },
    }),
    updateOne: mutationGeneric({
      args: {
        input: v.union(
          ...Object.entries(schema.tables).map(
            ([name, table]: [string, Schema['tables'][string]]) => {
              const tableName = name as TableNames;
              const fields = partial(table.validator.fields);
              return v.object({
                model: v.literal(tableName),
                update: v.object(fields),
                where: v.optional(v.array(whereValidator(schema, tableName))),
              });
            },
          ),
        ),
        onUpdateHandle: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const doc = await listOne(ctx, schema, betterAuthSchema, args.input);
        if (!doc) {
          throw new Error(`Failed to update ${args.input.model}`);
        }
        await checkUniqueFields(
          ctx,
          schema,
          betterAuthSchema,
          args.input.model,
          args.input.update,
          doc,
        );
        await ctx.db.patch(doc._id as GenericId<string>, args.input.update as any);
        const updatedDoc = await ctx.db.get(doc._id as GenericId<string>);
        if (!updatedDoc) {
          throw new Error(`Failed to update ${args.input.model}`);
        }
        if (args.onUpdateHandle) {
          await ctx.runMutation(args.onUpdateHandle as FunctionHandle<'mutation'>, {
            model: args.input.model,
            newDoc: updatedDoc,
            oldDoc: doc,
          });
        }
        return updatedDoc;
      },
    }),
    updateMany: mutationGeneric({
      args: {
        input: v.union(
          ...Object.entries(schema.tables).map(
            ([name, table]: [string, Schema['tables'][string]]) => {
              const tableName = name as TableNames;
              const fields = partial(table.validator.fields);
              return v.object({
                model: v.literal(tableName),
                update: v.object(fields),
                where: v.optional(v.array(whereValidator(schema, tableName))),
              });
            },
          ),
        ),
        paginationOpts: paginationOptsValidator,
        onUpdateHandle: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const { page, ...result } = await paginate(ctx, schema, betterAuthSchema, {
          ...args.input,
          paginationOpts: args.paginationOpts,
        });
        if (args.input.update) {
          if (
            hasUniqueFields(betterAuthSchema, args.input.model, args.input.update ?? {}) &&
            page.length > 1
          ) {
            throw new Error(
              `Attempted to set unique fields in multiple documents in ${args.input.model} with the same value. Fields: ${Object.keys(args.input.update ?? {}).join(', ')}`,
            );
          }
          await asyncMap(page, async (doc) => {
            await checkUniqueFields(
              ctx,
              schema,
              betterAuthSchema,
              args.input.model,
              args.input.update ?? {},
              doc,
            );
            await ctx.db.patch(doc._id as GenericId<string>, args.input.update as any);

            if (args.onUpdateHandle) {
              await ctx.runMutation(args.onUpdateHandle as FunctionHandle<'mutation'>, {
                model: args.input.model,
                newDoc: await ctx.db.get(doc._id as GenericId<string>),
                oldDoc: doc,
              });
            }
          });
        }
        return {
          ...result,
          count: page.length,
          ids: page.map((doc) => doc._id),
        };
      },
    }),
    deleteOne: mutationGeneric({
      args: {
        input: v.union(
          ...Object.keys(schema.tables).map((name: string) => {
            const tableName = name as TableNames;
            return v.object({
              model: v.literal(tableName),
              where: v.optional(v.array(whereValidator(schema, tableName))),
            });
          }),
        ),
        onDeleteHandle: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const doc = await listOne(ctx, schema, betterAuthSchema, args.input);
        if (!doc) {
          return;
        }
        await ctx.db.delete(doc._id as GenericId<string>);
        if (args.onDeleteHandle) {
          await ctx.runMutation(args.onDeleteHandle as FunctionHandle<'mutation'>, {
            model: args.input.model,
            doc,
          });
        }
        return doc;
      },
    }),
    deleteMany: mutationGeneric({
      args: {
        input: v.union(
          ...Object.keys(schema.tables).map((name: string) => {
            const tableName = name as TableNames;
            return v.object({
              model: v.literal(tableName),
              where: v.optional(v.array(whereValidator(schema, tableName))),
            });
          }),
        ),
        paginationOpts: paginationOptsValidator,
        onDeleteHandle: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const { page, ...result } = await paginate(ctx, schema, betterAuthSchema, {
          ...args.input,
          paginationOpts: args.paginationOpts,
        });
        await asyncMap(page, async (doc) => {
          if (args.onDeleteHandle) {
            await ctx.runMutation(args.onDeleteHandle as FunctionHandle<'mutation'>, {
              model: args.input.model,
              doc,
            });
          }
          await ctx.db.delete(doc._id as GenericId<string>);
        });
        return {
          ...result,
          count: page.length,
          ids: page.map((doc) => doc._id),
        };
      },
    }),
    getCorePermissions: queryGeneric({
      args: {
        userId: v.string(),
      },
      handler: async (ctx, args) => {
        const org = await ctx.db
          .query('organizations' as any)
          .withIndex('slug', (q: any) => q.eq('slug', 'styleswipe-core'))
          .first();

        if (!org) return { isMember: false, isAdmin: false };

        // Better Auth IDs are strings, so we use string-based lookup
        const member = await ctx.db
          .query('members' as any)
          .withIndex('userId_organizationId', (q: any) =>
            q.eq('userId', args.userId).eq('organizationId', org._id)
          )
          .first();

        if (!member) return { isMember: false, isAdmin: false };

        const role = member.role;
        return {
          isMember: true,
          isAdmin: role === 'admin' || role === 'owner',
        };
      },
    }),
    getAdminDashboardStats: queryGeneric({
      args: {
        userId: v.string(),
      },
      handler: async (ctx, args) => {
        const org = await ctx.db
          .query('organizations' as any)
          .withIndex('slug', (q: any) => q.eq('slug', 'styleswipe-core'))
          .first();

        if (!org) {
          return { isMember: false, isAdmin: false, recentUsers: [], totalUsersCount: 0, hasMoreUsers: false };
        }

        const member = await ctx.db
          .query('members' as any)
          .withIndex('userId_organizationId', (q: any) =>
            q.eq('userId', args.userId).eq('organizationId', org._id)
          )
          .first();

        if (!member) {
          return { isMember: false, isAdmin: false, recentUsers: [], totalUsersCount: 0, hasMoreUsers: false };
        }

        const recentUsers = await ctx.db
          .query('users' as any)
          .withIndex('createdAt')
          .order('desc')
          .take(5);

        const totalUsers = await ctx.db
          .query('users' as any)
          .withIndex('createdAt')
          .take(101);

        return {
          isMember: true,
          isAdmin: member.role === 'admin' || member.role === 'owner',
          recentUsers,
          totalUsersCount: Math.min(totalUsers.length, 100),
          hasMoreUsers: totalUsers.length > 100,
        };
      },
    }),
    getCurrentUserWithPermissions: queryGeneric({
      args: {
        subject: v.string(),
        email: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        // 1. Find User
        let user = await ctx.db.get(args.subject as any);

        if (!user && args.email) {
          user = await ctx.db
            .query('users' as any)
            .withIndex('email', (q: any) => q.eq('email', args.email))
            .first();
        }

        if (!user) return null;

        // 2. Find Permissions
        const org = await ctx.db
          .query('organizations' as any)
          .withIndex('slug', (q: any) => q.eq('slug', 'styleswipe-core'))
          .first();

        let isMember = false;
        let isAdmin = false;

        if (org) {
          const member = await ctx.db
            .query('members' as any)
            .withIndex('userId_organizationId', (q: any) =>
              q.eq('userId', user._id).eq('organizationId', org._id)
            )
            .first();

          if (member) {
            isMember = true;
            isAdmin = member.role === 'admin' || member.role === 'owner';
          }
        }

        return {
          ...user,
          isCoreMember: isMember,
          isCoreAdmin: isAdmin,
        };
      },
    }),
    getAdminUserList: queryGeneric({
      args: {
        paginationOpts: v.optional(paginationOptsValidator),
      },
      handler: async (ctx, args) => {
        const usersRes = await ctx.db.query('users' as any).order('desc').paginate(args.paginationOpts || { numItems: 50, cursor: null });
        const users = usersRes.page;

        const usersWithMemberships = await Promise.all(
          users.map(async (user: any) => {
            const memberships = await ctx.db
              .query('members' as any)
              .withIndex('userId', (q: any) => q.eq('userId', user._id))
              .collect();

            const membershipDetails = await Promise.all(
              memberships.map(async (membership: any) => {
                const org = await ctx.db.get(membership.organizationId);
                return {
                  ...membership,
                  organization: org,
                };
              }),
            );

            return {
              ...user,
              memberships: membershipDetails,
            };
          }),
        );

        return {
          ...usersRes,
          page: usersWithMemberships,
        };
      },
    }),
    getAdminOrgList: queryGeneric({
      args: {
        paginationOpts: v.optional(paginationOptsValidator),
      },
      handler: async (ctx, args) => {
        const orgsRes = await ctx.db.query('organizations' as any).order('desc').paginate(args.paginationOpts || { numItems: 50, cursor: null });
        const orgs = orgsRes.page;

        const orgsWithDetails = await Promise.all(
          orgs.map(async (org: any) => {
            const members = await ctx.db
              .query('members' as any)
              .withIndex('organizationId', (q: any) => q.eq('organizationId', org._id))
              .collect();

            return {
              ...org,
              memberCount: members.length,
              members: members.slice(0, 5), // Only return a snippet to keep response size down
            };
          }),
        );

        return {
          ...orgsRes,
          page: orgsWithDetails,
        };
      },
    }),
    getMembersWithUsers: queryGeneric({
      args: {
        organizationId: v.string(),
        paginationOpts: v.optional(paginationOptsValidator),
      },
      handler: async (ctx, args) => {
        const membersRes = await ctx.db
          .query('members' as any)
          .withIndex('organizationId', (q: any) => q.eq('organizationId', args.organizationId))
          .paginate(args.paginationOpts || { numItems: 100, cursor: null });

        const members = membersRes.page;

        const membersWithUsers = await Promise.all(
          members.map(async (member: any) => {
            const user = await ctx.db.get(member.userId);
            return {
              ...member,
              user,
            };
          }),
        );

        return {
          ...membersRes,
          page: membersWithUsers,
        };
      },
    }),
  };
};
