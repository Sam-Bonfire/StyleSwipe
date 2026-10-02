import { test, expect, type Browser, type Page, type Locator } from '@playwright/test';

// Two-user partner sync handshake (web accept flow). Runs both sides in one
// test with isolated browser contexts: A signs up, invites, B signs up,
// accepts, feeds blend, slider persists, shared board links, stop restores
// solo. Helpers mirror e2e/consumer-pages.spec.ts (kept local so that file
// stays untouched).
//
// NOTE: profile setup bypasses the visual-quiz onboarding by writing a stub
// styleProfile through the authenticated Convex mutation endpoint (JWT from
// the app's own better-auth convex plugin) — the handshake under test
// starts after.

test.use({ hasTouch: true });

const CONVEX_URL = process.env.CONVEX_URL ?? 'https://canny-stoat-869.convex.cloud';

async function expectNoCrash(page: Page) {
  await expect(page.locator('text="An error occurred in the"')).not.toBeVisible();
}

async function isTrulyVisible(target: Locator): Promise<boolean> {
  try {
    if (!(await target.isVisible())) return false;
    // Deliberately minimal on top of isVisible: only an opacity:0
    // ancestor (Tamagui Sheet's closed frame) hides content that still
    // has layout boxes. Earlier revisions also excluded fixed-subtree and
    // overflow-clipped content, but every such rule produced false
    // negatives on real content while opacity alone already excludes
    // every proven impostor (closed sheets and the drawer chips inside
    // them); expo-router twins are zero-size and caught by isVisible.
    const ok = await target.evaluate((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      let p: Element | null = el;
      while (p && p !== document.body) {
        if (getComputedStyle(p).opacity === '0') return false;
        p = p.parentElement;
      }
      return true;
    });
    return ok === true;
  } catch {
    return false;
  }
}

async function resolveVisible(locator: Locator, timeout = 15000): Promise<Locator> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const n = await locator.count();
    for (let i = 0; i < n; i++) {
      if (await isTrulyVisible(locator.nth(i))) return locator.nth(i);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('no visible element for locator');
}

async function firstVisible(page: Page, text: string | RegExp, timeout = 20000): Promise<Locator> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      return await resolveVisible(page.getByText(text), 1000);
    } catch {
      await page.waitForTimeout(500);
    }
  }
  const body = await page.locator('body').innerText().catch(() => '<no body>');
  console.log(`firstVisible gave up at ${page.url()}: ${body.slice(0, 600)}`);
  throw new Error(`no visible element with text: ${text}`);
}

async function tap(page: Page, locator: Locator, timeout = 15000): Promise<void> {
  await expect(page.getByTestId('app-loading-overlay')).toBeHidden({ timeout: 10000 }).catch(() => {});
  const target = await resolveVisible(locator, timeout);
  // Center, don't just reveal: scrollIntoViewIfNeeded stops when a single
  // pixel peeks into view, leaving the target's center under the fixed tab
  // bar — the tap then hits the tab and navigates away instead.
  await target.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'center' })).catch(() => {});
  const box = await target.boundingBox();
  if (!box) throw new Error('tap target has no bounding box');
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

async function seesText(page: Page, text: string | RegExp): Promise<boolean> {
  try {
    await resolveVisible(page.getByText(text), 1500);
    return true;
  } catch {
    return false;
  }
}

/**
 * Tap until cond() passes. Feed/auth re-renders shift layout mid-tap and
 * touchscreen taps then land on (harmless) empty space with no error, so
 * fire-and-forget taps flake. Retrying is safe: share reuses the pending
 * invite, accept/stop are idempotent.
 */
/**
 * Navigate and prove the route committed. Playwright's goto resolves on
 * document load, but on cold edges the SPA can stay on the previous route
 * (stale chunk/fallback shell) while reporting success — every downstream
 * assert then fails on the wrong page. Expo web strips route groups, so
 * /(app)/partner-sync lands at /partner-sync.
 */
async function gotoRoute(page: Page, path: string, timeout = 60000): Promise<void> {
  const clean = path.replace(/\/\([^)]*\)/g, '') || '/';
  const start = Date.now();
  while (Date.now() - start < timeout) {
    await page.goto(path).catch(() => {});
    try {
      await page.waitForURL(`**${clean}**`, { timeout: 8000 });
      return;
    } catch {
      /* not committed yet — reload the route */
    }
  }
  throw new Error(`never landed on ${path}, stuck at ${page.url()}`);
}

/**
 * Land on a route AND see its content. AuthGuard can bounce a fresh
 * navigation back out (stale route segments at effect time resolve to the
 * wrong branch and land on tabs) — re-landing retries until the content
 * itself renders, which is the only proof that counts.
 */
async function gotoRouteContent(
  page: Page,
  path: string,
  text: string | RegExp,
  timeout = 120000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    await gotoRoute(page, path, 30000).catch(() => {});
    try {
      await firstVisible(page, text, 15000);
      return;
    } catch {
      /* bounced or still loading — land again */
    }
  }
  const body = await page.locator('body').innerText().catch(() => '<no body>');
  console.log(`gotoRouteContent gave up at ${page.url()}: ${body.slice(0, 600)}`);
  throw new Error(`never saw content for ${path}, stuck at ${page.url()}`);
}

async function tapUntil(
  page: Page,
  locator: Locator,
  cond: () => Promise<boolean>,
  timeout = 45000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    await tap(page, locator).catch(() => {});
    try {
      if (await cond()) return;
    } catch {
      /* keep trying */
    }
    await page.waitForTimeout(1500);
  }
  const body = await page.locator('body').innerText().catch(() => '<no body>');
  console.log(`tap-until gave up at ${page.url()}: ${body.slice(0, 600)}`);
  throw new Error('tap-until condition never met');
}

/** Sign up via the email form (placeholders double as selectors). */
async function signUp(page: Page, name: string, email: string, password: string) {
  await gotoRoute(page, '/(auth)/email');
  await tap(page, page.locator('button:has-text("Don\'t have an account?")'));
  await page.getByPlaceholder('Full Name').fill(name);
  await page.getByPlaceholder('Email Address').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await tap(page, page.locator('button:has-text("Sign Up")'));
  // AuthGuard routes fresh users (no style profile) to onboarding. Match
  // onboarding-only copy: /Continue/i also matches the sign-in form's
  // "Enter your email to continue", which would pass without signing up.
  await firstVisible(page, /Swipe to discover|What.*style|Welcome/i, 30000);
}

/**
 * Convex JWT for direct API calls, via the same better-auth convex plugin
 * endpoint the app itself uses (the opaque session token is not a JWT).
 */
async function convexJwt(page: Page): Promise<string> {
  const site = CONVEX_URL.replace('.convex.cloud', '.convex.site');
  const token = await page.evaluate(async (siteUrl: string) => {
    const r = await fetch(`${siteUrl}/api/auth/convex/token`, {
      method: 'GET',
      credentials: 'include',
    });
    const j = await r.json().catch(() => null);
    return (j?.token as string) ?? null;
  }, site);
  if (!token) throw new Error('no convex jwt for E2E user');
  return token;
}

/** Stub a style profile through the authenticated Convex mutation endpoint. */
async function stubStyleProfile(page: Page) {
  const jwt = await convexJwt(page);
  const res = await page.request.post(`${CONVEX_URL}/api/mutation`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: {
      path: 'users:updateStyleProfile',
      args: {
        styleProfile: {
          gender: 'women',
          vibes: ['casual'],
          sizes: {},
          budget: { min: 0, max: 5000 },
        },
      },
      format: 'json',
    },
  });
  if (!res.ok()) throw new Error(`style profile stub failed: ${res.status()}`);
  // Full reload, not SPA navigation: the app's Convex client serves the
  // pre-mutation cached user otherwise, and AuthGuard redirects to
  // onboarding on the stale profile-less object before the refetch lands.
  await gotoRoute(page, '/(app)/(tabs)/discover');
  await page.reload();
  await firstVisible(page, 'Discovery', 45000);
}

type SyncUser = { name: string; email: string; password: string };

// Shared across the serial tests below (same worker, declaration order).
// Regenerated whenever the invite test (re)runs, so retries never collide
// with users from a previous attempt.
const runState: { userA?: SyncUser; userB?: SyncUser; inviteCode?: string } = {};

/** Sign in an existing stubbed user (fast path, no signup/onboarding). */
async function signIn(page: Page, user: SyncUser) {
  await gotoRoute(page, '/(auth)/email');
  await page.getByPlaceholder('Email Address').fill(user.email);
  await page.getByPlaceholder('Password').fill(user.password);
  await expect(page.locator('button:has-text("Sign In")')).toBeEnabled({ timeout: 20000 });
  await tap(page, page.locator('button:has-text("Sign In")'));
  await firstVisible(page, 'Discovery', 45000);
}

// Serial: each step builds on the previous one's server state, and each
// step is small enough that CI retries re-run one step, not the whole
// 5-minute handshake.
test.describe.serial('Partner sync handshake', () => {
  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    // Warm shared infra once: cold preview deployments serve chunks slowly
    // and cold-start every Convex function, which starves the per-step
    // timeouts below. One load + one backend ping warms CDN edge, function
    // isolates, and vector indexes for the whole file. Best effort only.
    const ctx = await browser.newContext();
    try {
      const page = await ctx.newPage();
      await page.goto('/(app)/(tabs)/discover');
      await firstVisible(page, 'Discovery', 90000).catch(() => {});
      await page
        .request.post(`${CONVEX_URL}/api/query`, {
          data: { path: 'products:getLatest', args: { limit: 1 }, format: 'json' },
        })
        .catch(() => {});
    } finally {
      await ctx.close().catch(() => {});
    }
  });

  test('A signs up and creates a reusable invite', async ({ browser }: { browser: Browser }) => {
    test.setTimeout(300000);
    const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    runState.userA = { name: 'Aarav E2E', email: `e2e-a-${stamp}@example.com`, password: 'E2eTest!123' };
    runState.userB = { name: 'Bella E2E', email: `e2e-b-${stamp}@example.com`, password: 'E2eTest!123' };
    runState.inviteCode = undefined;

    const ctxA = await browser.newContext({ hasTouch: true });
    try {
      const pageA = await ctxA.newPage();
      await signUp(pageA, runState.userA.name, runState.userA.email, runState.userA.password);
      await stubStyleProfile(pageA);

      // A invites: pending invite appears with a reusable code.
      await gotoRouteContent(pageA, '/(app)/partner-sync', 'Collaborative Shopping');
      // Invite buttons stay disabled until auth resolves (taps while
      // loading would silently no-op).
      await expect(pageA.locator('button:has-text("Share Link")')).toBeEnabled({ timeout: 20000 });
      await tapUntil(pageA, pageA.locator('button:has-text("Share Link")'), () =>
        seesText(pageA, 'Waiting for Partner'),
      );
      await firstVisible(pageA, 'Waiting for Partner', 45000);
      const codeEl = await resolveVisible(pageA.locator('text=/^[A-Z0-9]{6}$/'), 20000);
      const inviteCode = ((await codeEl.textContent()) ?? '').trim();
      expect(inviteCode).toMatch(/^[A-Z0-9]{6}$/);
      runState.inviteCode = inviteCode;
      await expectNoCrash(pageA);
    } finally {
      await ctxA.close().catch(() => {});
    }
  });

  test('B accepts and feeds blend both ways', async ({ browser }: { browser: Browser }) => {
    test.setTimeout(300000);
    const { userA, userB, inviteCode } = runState;
    if (!userA || !userB || !inviteCode) throw new Error('invite step did not run');

    const ctxB = await browser.newContext({ hasTouch: true });
    const ctxA = await browser.newContext({ hasTouch: true });
    try {
      const pageB = await ctxB.newPage();
      await signUp(pageB, userB.name, userB.email, userB.password);
      await stubStyleProfile(pageB);

      // B accepts on the web flow. Accept navigates away from /sync/...
      // (expo web strips route-group segments, so match leaving sync).
      await gotoRouteContent(pageB, `/sync/${inviteCode}`, 'Style Sync Invite');
      await tapUntil(
        pageB,
        pageB.locator('button:has-text("Accept Invite")'),
        async () => !pageB.url().includes('/sync/'),
      );
      await gotoRouteContent(pageB, '/(app)/(tabs)/discover', `Partner Syncing with ${userA.name.split(' ')[0]}`);
      await expectNoCrash(pageB);

      // A sees the join: banner names B.
      const pageA = await ctxA.newPage();
      await signIn(pageA, userA);
      await gotoRouteContent(pageA, '/(app)/(tabs)/discover', `Partner Syncing with ${userB.name.split(' ')[0]}`);
      await expectNoCrash(pageA);
    } finally {
      await ctxB.close().catch(() => {});
      await ctxA.close().catch(() => {});
    }
  });

  test('blend persists and shared board links out', async ({ browser }: { browser: Browser }) => {
    test.setTimeout(300000);
    const { userA, userB } = runState;
    if (!userA || !userB) throw new Error('invite step did not run');

    const ctxB = await browser.newContext({ hasTouch: true });
    const ctxA = await browser.newContext({ hasTouch: true });
    try {
      // Blend persists: B dials to partner-led, reloads, still partner-led.
      // Coordinates come from the track container itself (fixed 48px tall),
      // not fractions of the whole slider frame whose proportions shift
      // with fonts/loading states. Re-resolved every attempt (stale boxes
      // miss; pinned .first() hits expo-router's hidden twin).
      const pageB = await ctxB.newPage();
      await signIn(pageB, userB);
      await gotoRouteContent(pageB, '/(app)/(tabs)/discover', `Partner Syncing with ${userA.name.split(' ')[0]}`);
      let blended = false;
      const blendStart = Date.now();
      while (!blended && Date.now() - blendStart < 90000) {
        const el = await resolveVisible(pageB.getByTestId('blend-slider-track'), 10000).catch(
          () => null,
        );
        const box = el ? await el.boundingBox().catch(() => null) : null;
        if (box) {
          await pageB.touchscreen.tap(box.x + box.width * 0.85, box.y + box.height / 2);
          await pageB.waitForTimeout(1500);
          const t = await pageB.locator('body').innerText().catch(() => '');
          if (/leading the way|Mostly .* style/.test(t)) blended = true;
        }
        if (!blended) await pageB.waitForTimeout(2000);
      }
      expect(blended).toBe(true);
      await pageB.waitForTimeout(2500); // debounce persist window
      await pageB.reload();
      await firstVisible(pageB, /leading the way|Mostly .* style/, 30000);
      await expectNoCrash(pageB);

      // Shared board card links out to the couple board.
      // Cold preview databases answer session queries slowly on first hit.
      const pageA = await ctxA.newPage();
      await signIn(pageA, userA);
      await gotoRouteContent(pageA, '/(app)/partner-sync', 'Our Shared Board', 120000);
      await tapUntil(pageA, pageA.locator('button:has-text("View")'), () =>
        seesText(pageA, 'Shared Sync Board'),
      );
      await firstVisible(pageA, 'Shared Sync Board');
      // NOTE: /(app)/board/[id] renders StyleBoardScreen (not BoardDetailScreen),
      // whose empty state reads "This board is empty".
      await firstVisible(pageA, 'This board is empty');
      await expectNoCrash(pageA);
    } finally {
      await ctxB.close().catch(() => {});
      await ctxA.close().catch(() => {});
    }
  });

  test('stop restores solo with the ended notice', async ({ browser }: { browser: Browser }) => {
    test.setTimeout(300000);
    const { userA, userB } = runState;
    if (!userA || !userB) throw new Error('invite step did not run');

    const ctxA = await browser.newContext({ hasTouch: true });
    const ctxB = await browser.newContext({ hasTouch: true });
    try {
      // B stops while A watches: the ended notice only fires on a live
      // active -> gone transition, so A must stay mounted on Discover
      // (a fresh navigation after the stop would never see it).
      const pageA = await ctxA.newPage();
      await signIn(pageA, userA);
      await gotoRouteContent(pageA, '/(app)/(tabs)/discover', `Partner Syncing with ${userB.name.split(' ')[0]}`);
      const pageB = await ctxB.newPage();
      await signIn(pageB, userB);
      await gotoRouteContent(pageB, '/(app)/partner-sync', 'Active Sessions');
      await tapUntil(
        pageB,
        pageB.locator('button:has-text("Stop Sharing")'),
        async () => !(await seesText(pageB, 'Active Sessions')),
      );
      await firstVisible(pageA, 'Back to your own feed', 45000);
      await expectNoCrash(pageA);
      await gotoRoute(pageB, '/(app)/(tabs)/discover');
      await pageB.waitForTimeout(3000);
      await expectNoCrash(pageB);
    } finally {
      await ctxA.close().catch(() => {});
      await ctxB.close().catch(() => {});
    }
  });
});




