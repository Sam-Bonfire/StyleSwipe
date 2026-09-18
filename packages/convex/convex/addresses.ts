import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const;

function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode);
}

function isValidState(state: string): boolean {
  return (INDIAN_STATES as readonly string[]).includes(state);
}

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query('addresses')
      .withIndex('by_user_created', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect();
    // Default first
    return docs.sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));
  },
});

export const getById = query({
  args: { addressId: v.id('addresses') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.addressId);
  },
});

export const getDefault = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const def = await ctx.db
      .query('addresses')
      .withIndex('by_user_default', (q) => q.eq('userId', args.userId).eq('isDefault', true))
      .unique();
    if (def) return def;
    // fallback to most recent
    const fallback = await ctx.db
      .query('addresses')
      .withIndex('by_user_created', (q) => q.eq('userId', args.userId))
      .order('desc')
      .first();
    return fallback ?? null;
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    fullName: v.string(),
    phone: v.string(),
    line1: v.string(),
    line2: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    pincode: v.string(),
    country: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!isValidPincode(args.pincode)) {
      throw new Error('Invalid pincode: must be 6 digits starting 1-9');
    }
    if (!isValidState(args.state)) {
      throw new Error(`Invalid state: ${args.state}`);
    }
    if (!args.fullName || !args.phone || !args.line1 || !args.city) {
      throw new Error('Missing required address fields');
    }
    const now = Date.now();
    const isDefault = args.isDefault ?? false;

    if (isDefault) {
      const existingDefaults = await ctx.db
        .query('addresses')
        .withIndex('by_user_default', (q) => q.eq('userId', args.userId).eq('isDefault', true))
        .collect();
      for (const d of existingDefaults) {
        await ctx.db.patch(d._id, { isDefault: false, updatedAt: now });
      }
    }

    // First address always default if none existing
    const existingCount = await ctx.db
      .query('addresses')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();
    const finalDefault = existingCount.length === 0 ? true : isDefault;

    const id = await ctx.db.insert('addresses', {
      userId: args.userId,
      fullName: args.fullName,
      phone: args.phone,
      line1: args.line1,
      line2: args.line2,
      city: args.city,
      state: args.state,
      pincode: args.pincode,
      country: args.country ?? 'India',
      isDefault: finalDefault,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    addressId: v.id('addresses'),
    fullName: v.optional(v.string()),
    phone: v.optional(v.string()),
    line1: v.optional(v.string()),
    line2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    pincode: v.optional(v.string()),
    country: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.addressId);
    if (!existing) throw new Error('Address not found');

    if (args.pincode !== undefined && !isValidPincode(args.pincode)) {
      throw new Error('Invalid pincode');
    }
    if (args.state !== undefined && !isValidState(args.state)) {
      throw new Error('Invalid state');
    }

    const now = Date.now();
    if (args.isDefault === true) {
      const siblings = await ctx.db
        .query('addresses')
        .withIndex('by_user_default', (q) => q.eq('userId', existing.userId).eq('isDefault', true))
        .collect();
      for (const s of siblings) {
        if (s._id !== args.addressId) {
          await ctx.db.patch(s._id, { isDefault: false, updatedAt: now });
        }
      }
    }

    const patch: Record<string, unknown> = { updatedAt: now };
    if (args.fullName !== undefined) patch['fullName'] = args.fullName;
    if (args.phone !== undefined) patch['phone'] = args.phone;
    if (args.line1 !== undefined) patch['line1'] = args.line1;
    if (args.line2 !== undefined) patch['line2'] = args.line2;
    if (args.city !== undefined) patch['city'] = args.city;
    if (args.state !== undefined) patch['state'] = args.state;
    if (args.pincode !== undefined) patch['pincode'] = args.pincode;
    if (args.country !== undefined) patch['country'] = args.country;
    if (args.isDefault !== undefined) patch['isDefault'] = args.isDefault;

    await ctx.db.patch(args.addressId, patch as never);
  },
});

export const remove = mutation({
  args: { addressId: v.id('addresses') },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.addressId);
    if (!existing) throw new Error('Address not found');
    await ctx.db.delete(args.addressId);
    // If deleted was default, promote most recent to default
    if (existing.isDefault) {
      const next = await ctx.db
        .query('addresses')
        .withIndex('by_user', (q) => q.eq('userId', existing.userId))
        .order('desc')
        .first();
      if (next) {
        await ctx.db.patch(next._id, { isDefault: true, updatedAt: Date.now() });
      }
    }
  },
});

export const setDefault = mutation({
  args: { addressId: v.id('addresses') },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.addressId);
    if (!existing) throw new Error('Address not found');
    const now = Date.now();
    const siblings = await ctx.db
      .query('addresses')
      .withIndex('by_user', (q) => q.eq('userId', existing.userId))
      .collect();
    for (const s of siblings) {
      await ctx.db.patch(s._id, { isDefault: s._id === args.addressId, updatedAt: now });
    }
  },
});

export const indianStates = INDIAN_STATES;
