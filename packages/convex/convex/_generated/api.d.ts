/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as auth_permissions from "../auth/permissions.js";
import type * as authOptions from "../authOptions.js";
import type * as backfillTrustBadges from "../backfillTrustBadges.js";
import type * as boards from "../boards.js";
import type * as cart from "../cart.js";
import type * as categories from "../categories.js";
import type * as crons from "../crons.js";
import type * as debug from "../debug.js";
import type * as discovery from "../discovery.js";
import type * as events from "../events.js";
import type * as featureFlags from "../featureFlags.js";
import type * as feedback from "../feedback.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as index from "../index.js";
import type * as init from "../init.js";
import type * as logs from "../logs.js";
import type * as members from "../members.js";
import type * as migrations from "../migrations.js";
import type * as orders from "../orders.js";
import type * as organizationAdmin from "../organizationAdmin.js";
import type * as organizations from "../organizations.js";
import type * as partnerSync from "../partnerSync.js";
import type * as permissions from "../permissions.js";
import type * as products from "../products.js";
import type * as recommendations from "../recommendations.js";
import type * as scraper from "../scraper.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";
import type * as sync from "../sync.js";
import type * as users from "../users.js";
import type * as verifications from "../verifications.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  admin: typeof admin;
  auth: typeof auth;
  "auth/permissions": typeof auth_permissions;
  authOptions: typeof authOptions;
  backfillTrustBadges: typeof backfillTrustBadges;
  boards: typeof boards;
  cart: typeof cart;
  categories: typeof categories;
  crons: typeof crons;
  debug: typeof debug;
  discovery: typeof discovery;
  events: typeof events;
  featureFlags: typeof featureFlags;
  feedback: typeof feedback;
  helpers: typeof helpers;
  http: typeof http;
  index: typeof index;
  init: typeof init;
  logs: typeof logs;
  members: typeof members;
  migrations: typeof migrations;
  orders: typeof orders;
  organizationAdmin: typeof organizationAdmin;
  organizations: typeof organizations;
  partnerSync: typeof partnerSync;
  permissions: typeof permissions;
  products: typeof products;
  recommendations: typeof recommendations;
  scraper: typeof scraper;
  search: typeof search;
  seed: typeof seed;
  sessions: typeof sessions;
  sync: typeof sync;
  users: typeof users;
  verifications: typeof verifications;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  auth: import("../betterAuth/_generated/component.js").ComponentApi<"auth">;
};
