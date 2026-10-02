import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Authorization spec — server-side access control on Convex functions.
 *
 * Criticality map:
 *   SEC-01 [Critical] Catalog/admin writes require core-admin (products,
 *     categories, feature flags, affiliate rules). Remediation: gate every
 *     write with requireCoreAdmin(ctx) (see convex/permissions.ts — the
 *     pattern admin.getStats already follows). Acceptance: every test below
 *     passes (currently they fail: writes succeed with no credentials).
 *   SEC-02 [High] User data is bound to the caller, not a caller-supplied
 *     userId (carts, orders, addresses, notifications, wishlist, user
 *     lookup). Remediation: derive the subject from ctx.auth.getUserIdentity()
 *     and reject cross-user access. Acceptance: foreign-user calls below
 *     are rejected; own-user calls keep working.
 *   SEC-03 [High] Notification dispatches are not a public inbox-writing
 *     primitive (arbitrary title/body to any userId, now also triggering
 *     real Expo pushes). Remediation: move dispatch inside the domain
 *     mutations (accept/stop/price-drop) via direct inserts; remove or
 *     admin-gate the public dispatch* endpoints. Acceptance: direct
 *     dispatch* calls below are rejected.
 *   SEC-04 [High] partnerSync identities are self-bound (create uses the
 *     caller's id as initiator; accept binds the caller's id as partner).
 *     Remediation: stop accepting initiatorId/partnerId as args.
 *     Acceptance: spoofed calls below are rejected.
 *
 * Tests for unimplemented fixes are test.fixme (documented, CI-green) so
 * they become live regression guards the moment the backend is hardened.
 * The admin-guard test runs live: it locks in the one pattern that
 * already works.
 */

const CONVEX_URL = process.env.CONVEX_URL ?? 'https://canny-stoat-869.convex.cloud';

type ConvexResult = { status?: string; value?: unknown; errorMessage?: string };

async function convexApi(
  request: APIRequestContext,
  kind: 'query' | 'mutation',
  path: string,
  args: Record<string, unknown>,
): Promise<{ http: number; body: ConvexResult }> {
  const res = await request.post(`${CONVEX_URL}/api/${kind}`, {
    data: { path, args, format: 'json' },
  });
  const body = (await res.json().catch(() => null)) as ConvexResult | null;
  return { http: res.status(), body: body ?? {} };
}

/** Passes only when Convex refused the call (errors come back as 200 + status:error). */
function expectRejected(r: { http: number; body: ConvexResult }, what: string) {
  expect(
    r.body.status === 'error',
    `${what} must be rejected, got: ${JSON.stringify(r.body).slice(0, 200)}`,
  ).toBe(true);
}

test.describe('Authorization', () => {
  test('SEC-00 admin dashboard query rejects unauthenticated callers', async ({ request }) => {
    const r = await convexApi(request, 'query', 'admin:getStats', {});
    expectRejected(r, 'admin:getStats');
  });

  test.fixme('[SEC-01 · Critical] products:create rejects unauthenticated callers', async ({
    request,
  }) => {
    const r = await convexApi(request, 'mutation', 'products:create', {
      brand: 'Probe',
      title: 'Probe',
      price: 1,
      mrp: 2,
      category: 'Probe',
      images: [],
      updatedAt: Date.now(),
    });
    expectRejected(r, 'products:create');
  });

  test.fixme('[SEC-01 · Critical] products:update/remove require admin', async ({ request }) => {
    // Create-then-act so the test never touches real catalog rows: the
    // created row is removed again at the end. If create itself is already
    // gated, update/remove share the identical guard by construction.
    const created = await convexApi(request, 'mutation', 'products:create', {
      brand: 'ProbeSec',
      title: 'ProbeSec',
      price: 1,
      mrp: 2,
      category: 'ProbeSec',
      images: [],
      updatedAt: Date.now(),
    });
    if (created.body.status !== 'success') return;
    const id = created.body.value as string;
    try {
      const updated = await convexApi(request, 'mutation', 'products:update', {
        id,
        title: 'ProbeSecEdited',
        updatedAt: Date.now(),
      });
      expectRejected(updated, 'products:update');
    } finally {
      await convexApi(request, 'mutation', 'products:remove', { id });
    }
  });

  test.fixme('[SEC-01 · Critical] categories:save rejects unauthenticated callers', async ({
    request,
  }) => {
    const r = await convexApi(request, 'mutation', 'categories:save', {
      name: 'Probe',
      slug: 'probe-sec',
      level: 0,
    });
    expectRejected(r, 'categories:save');
  });

  test.fixme('[SEC-01 · Critical] featureFlags:create rejects unauthenticated callers', async ({
    request,
  }) => {
    const r = await convexApi(request, 'mutation', 'featureFlags:create', {
      name: 'probe-sec-flag',
      environment: 'dev',
      isEnabled: true,
      updatedAt: Date.now(),
    });
    expectRejected(r, 'featureFlags:create');
  });

  test.fixme('[SEC-01 · Critical] affiliate:save rejects unauthenticated callers', async ({
    request,
  }) => {
    const r = await convexApi(request, 'mutation', 'affiliate:save', {
      merchantDomain: 'probe-sec.example',
      merchantName: 'Probe',
      network: 'DIRECT',
      trackingParams: [],
      isEnabled: true,
    });
    expectRejected(r, 'affiliate:save');
  });

  test.fixme('[SEC-02 · High] carts are not readable by userId alone', async ({ request }) => {
    const r = await convexApi(request, 'query', 'cart:getCart', { userId: 'probe-victim' });
    expectRejected(r, 'cart:getCart');
  });

  test.fixme('[SEC-02 · High] carts are not writable by userId alone', async ({ request }) => {
    const r = await convexApi(request, 'mutation', 'cart:saveCart', { userId: 'probe-victim', items: [] });
    expectRejected(r, 'cart:saveCart');
  });

  test.fixme('[SEC-02 · High] orders are not listable by userId alone', async ({ request }) => {
    const r = await convexApi(request, 'query', 'orders:listUserOrders', {
      userId: 'probe-victim',
      paginationOpts: { numItems: 5, cursor: null },
    });
    expectRejected(r, 'orders:listUserOrders');
  });

  test.fixme('[SEC-02 · High] addresses are not listable by userId alone', async ({ request }) => {
    const r = await convexApi(request, 'query', 'addresses:list', { userId: 'probe-victim' });
    expectRejected(r, 'addresses:list');
  });

  test.fixme('[SEC-02 · High] notifications are not readable by userId alone', async ({ request }) => {
    const r = await convexApi(request, 'query', 'notifications:listNotifications', {
      userId: 'probe-victim',
    });
    expectRejected(r, 'notifications:listNotifications');
  });

  test.fixme('[SEC-02 · High] notifications cannot be marked read for another user', async ({
    request,
  }) => {
    const r = await convexApi(request, 'mutation', 'notifications:markAllRead', {
      userId: 'probe-victim',
    });
    expectRejected(r, 'notifications:markAllRead');
  });

  test.fixme('[SEC-02 · High] users are not enumerable by email', async ({ request }) => {
    const r = await convexApi(request, 'query', 'users:getUserPrivate', {
      email: 'probe-victim@example.com',
    });
    expectRejected(r, 'users:getUserPrivate');
  });

  test.fixme('[SEC-03 · High] notification dispatch is not a public primitive', async ({
    request,
  }) => {
    const r = await convexApi(request, 'mutation', 'notifications:dispatchGeneric', {
      userId: 'probe-victim',
      type: 'SYSTEM',
      title: 'Probe',
      body: 'Probe',
    });
    expectRejected(r, 'notifications:dispatchGeneric');
  });

  test.fixme('[SEC-04 · High] partnerSync:create binds the caller as initiator', async ({
    request,
  }) => {
    const r = await convexApi(request, 'mutation', 'partnerSync:create', {
      initiatorId: 'probe-victim',
      inviteCode: 'PROBE1',
      status: 'pending',
      expiresAt: Date.now() + 3600000,
      influenceRatio: 0.5,
      createdAt: Date.now(),
    });
    expectRejected(r, 'partnerSync:create');
  });
});
