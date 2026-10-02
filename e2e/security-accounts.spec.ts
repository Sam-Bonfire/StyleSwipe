import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Account-abuse spec — signup/OTP/seed surfaces that invite cost attacks.
 *
 * Criticality map:
 *   SEC-05 [High] Public seed/init/migration endpoints must not run on
 *     production data (seed:run inserts when empty — first-writer-wins
 *     catalog poisoning on a fresh prod deploy; init/migrations likewise).
 *     Remediation: requireCoreAdmin on seed:run, initializeOrganizations,
 *     and migration runners, or gate them behind an env flag present only
 *     on preview deployments. Acceptance: unauthenticated calls below are
 *     rejected while preview seeding (via deploy key, not caller) still
 *     works in CI.
 *   SEC-06 [Medium] OTP/email verification endpoints are throttled
 *     (brute-force codes, SMS/email pumping). Remediation: attempt limits
 *     + per-IP throttling on verify/send paths. Acceptance: repeated
 *     failing attempts below are eventually rejected with 429-style
 *     errors instead of perpetual per-attempt responses.
 *
 * Tests for unimplemented fixes are test.fixme (documented, CI-green).
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

function expectRejected(r: { http: number; body: ConvexResult }, what: string) {
  expect(
    r.body.status === 'error',
    `${what} must be rejected, got: ${JSON.stringify(r.body).slice(0, 200)}`,
  ).toBe(true);
}

test.describe('Account abuse surfaces', () => {
  test.fixme('[SEC-05 · High] seed:run rejects unauthenticated callers', async ({ request }) => {
    const r = await convexApi(request, 'mutation', 'seed:run', {});
    expectRejected(r, 'seed:run');
  });

  test.fixme('[SEC-05 · High] initializeOrganizations rejects unauthenticated callers', async ({
    request,
  }) => {
    const r = await convexApi(request, 'mutation', 'init:initializeOrganizations', {});
    expectRejected(r, 'init:initializeOrganizations');
  });

  test.fixme('[SEC-06 · Medium] OTP verification is throttled after repeated failures', async ({
    request,
  }) => {
    // Twenty rapid failing verifications against a phone that never
    // received a code: a throttled endpoint starts refusing (rate error),
    // an unthrottled one answers every attempt identically (oracle).
    const site = CONVEX_URL.replace('.convex.cloud', '.convex.site');
    let throttled = false;
    for (let i = 0; i < 20; i++) {
      const res = await request.post(`${site}/api/auth/phone-number/verify`, {
        data: { phoneNumber: '+15550000000', code: '000000' },
      });
      const text = await res.text().catch(() => '');
      if (res.status() === 429 || /too many|rate/i.test(text)) {
        throttled = true;
        break;
      }
    }
    expect(throttled, 'OTP verify endpoint must throttle repeated failures').toBe(true);
  });
});
