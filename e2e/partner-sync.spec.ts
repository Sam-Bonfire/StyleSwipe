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
    const ok = await target.evaluate((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      let p: Element | null = el;
      let inFixed = false;
      let movesWithPage = true;
      let canScroll = false;
      while (p && p !== document.body) {
        const cs = getComputedStyle(p);
        if (cs.opacity === '0') return false;
        if (cs.position === 'fixed') {
          inFixed = true;
          movesWithPage = false;
        }
        const pr = (p as HTMLElement).getBoundingClientRect();
        const axes = [
          {
            overflow: cs.overflowY,
            start: r.top,
            end: r.bottom,
            pStart: pr.top,
            pEnd: pr.bottom,
            scrollable:
              (p as HTMLElement).scrollHeight > (p as HTMLElement).clientHeight + 1 &&
              (p as HTMLElement).clientHeight >= 24,
          },
          {
            overflow: cs.overflowX,
            start: r.left,
            end: r.right,
            pStart: pr.left,
            pEnd: pr.right,
            scrollable:
              (p as HTMLElement).scrollWidth > (p as HTMLElement).clientWidth + 1 &&
              (p as HTMLElement).clientWidth >= 24,
          },
        ];
        for (const a of axes) {
          if (a.overflow === 'visible' || a.scrollable) continue;
          if (a.end <= a.pStart || a.start >= a.pEnd) {
            if (!(movesWithPage && canScroll)) return false;
          }
        }
        const elm = p as HTMLElement;
        if (elm.scrollHeight > elm.clientHeight + 1 && elm.clientHeight >= 24) canScroll = true;
        if (elm.scrollWidth > elm.clientWidth + 1 && elm.clientWidth >= 24) canScroll = true;
        p = p.parentElement;
      }
      if (!inFixed) return true;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      return r.left < vw && r.left + r.width > 0 && r.top < vh && r.top + r.height > 0;
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
  throw new Error(`no visible element with text: ${text}`);
}

async function tap(page: Page, locator: Locator, timeout = 15000): Promise<void> {
  await expect(page.getByTestId('app-loading-overlay')).toBeHidden({ timeout: 10000 }).catch(() => {});
  const target = await resolveVisible(locator, timeout);
  await target.scrollIntoViewIfNeeded().catch(() => {});
  const box = await target.boundingBox();
  if (!box) throw new Error('tap target has no bounding box');
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

/** Sign up via the email form (placeholders double as selectors). */
async function signUp(page: Page, name: string, email: string, password: string) {
  await page.goto('/(auth)/email');
  await tap(page, page.locator('button:has-text("Don\'t have an account?")'));
  await page.getByPlaceholder('Full Name').fill(name);
  await page.getByPlaceholder('Email Address').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await tap(page, page.locator('button:has-text("Sign Up")'));
  // AuthGuard routes fresh users (no style profile) to onboarding.
  await firstVisible(page, /Welcome|What.*style|Continue/i, 30000);
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
  await page.goto('/(app)/(tabs)/discover');
  await firstVisible(page, 'Discovery', 30000);
}

test.describe('Partner sync handshake', () => {
  test('invite, accept, blend, shared board, stop', async ({ browser }: { browser: Browser }) => {
    test.setTimeout(300000);
    const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const userA = { name: 'Aarav E2E', email: `e2e-a-${stamp}@example.com`, password: 'E2eTest!123' };
    const userB = { name: 'Bella E2E', email: `e2e-b-${stamp}@example.com`, password: 'E2eTest!123' };

    const ctxA = await browser.newContext({ hasTouch: true });
    const ctxB = await browser.newContext({ hasTouch: true });
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();
    try {
      // Both users sign up and skip onboarding via stubbed profiles.
      await signUp(pageA, userA.name, userA.email, userA.password);
      await stubStyleProfile(pageA);
      await signUp(pageB, userB.name, userB.email, userB.password);
      await stubStyleProfile(pageB);

      // A invites: pending invite appears with a reusable code.
      await pageA.goto('/(app)/partner-sync');
      await firstVisible(pageA, 'Collaborative Shopping');
      // Invite buttons stay disabled until auth resolves (taps while
      // loading would silently no-op).
      await expect(pageA.locator('button:has-text("Share Link")')).toBeEnabled({ timeout: 20000 });
      await tap(pageA, pageA.locator('button:has-text("Share Link")'));
      await firstVisible(pageA, 'Waiting for Partner', 45000);
      const codeEl = await resolveVisible(pageA.locator('text=/^[A-Z0-9]{6}$/'), 20000);
      const inviteCode = ((await codeEl.textContent()) ?? '').trim();
      expect(inviteCode).toMatch(/^[A-Z0-9]{6}$/);

      // B accepts on the web flow.
      await pageB.goto(`/sync/${inviteCode}`);
      await firstVisible(pageB, 'Style Sync Invite');
      await tap(pageB, pageB.locator('button:has-text("Accept Invite")'));
      await pageB.waitForURL('(app)/(tabs)', { timeout: 20000 }).catch(() => {});
      await pageB.goto('/(app)/(tabs)/discover');
      await firstVisible(pageB, `Partner Syncing with ${userA.name.split(' ')[0]}`, 30000);
      await expectNoCrash(pageB);

      // A sees the join: banner names B, shared board card links out.
      await pageA.goto('/(app)/(tabs)/discover');
      await firstVisible(pageA, `Partner Syncing with ${userB.name.split(' ')[0]}`, 30000);
      await pageA.goto('/(app)/partner-sync');
      // Cold preview databases answer session queries slowly on first hit.
      await firstVisible(pageA, 'Our Shared Board', 45000);
      await tap(pageA, pageA.locator('button:has-text("View")'));
      await firstVisible(pageA, 'Shared Sync Board');
      // NOTE: /(app)/board/[id] renders StyleBoardScreen (not BoardDetailScreen),
      // whose empty state reads "This board is empty".
      await firstVisible(pageA, 'This board is empty');
      await expectNoCrash(pageA);

      // Blend persists: B dials to partner-led, reloads, still partner-led.
      // Coordinates come from the track container itself (fixed 48px tall),
      // not fractions of the whole slider frame whose proportions shift
      // with fonts/loading states. Re-resolved every attempt (stale boxes
      // miss; pinned .first() hits expo-router's hidden twin).
      await pageB.goto('/(app)/(tabs)/discover');
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

      // B stops: A is back to solo with the ended notice, B is solo too.
      // Tap-until-gone: single taps can land mid re-render and silently
      // miss, leaving the session alive (stop is idempotent, so retrying
      // is safe).
      await pageB.goto('/(app)/partner-sync');
      await firstVisible(pageB, 'Active Sessions', 45000);
      const stopStart = Date.now();
      let stopped = false;
      while (!stopped && Date.now() - stopStart < 45000) {
        await tap(pageB, pageB.locator('button:has-text("Stop Sharing")')).catch(() => {});
        await pageB.waitForTimeout(2500);
        stopped = await resolveVisible(pageB.getByText('Active Sessions'), 1000)
          .then(() => false)
          .catch(() => true);
      }
      expect(stopped).toBe(true);
      await pageA.goto('/(app)/(tabs)/discover');
      await firstVisible(pageA, 'Back to your own feed', 30000);
      await expectNoCrash(pageA);
      await pageB.goto('/(app)/(tabs)/discover');
      await pageB.waitForTimeout(3000);
      await expectNoCrash(pageB);
    } finally {
      await ctxA.close().catch(() => {});
      await ctxB.close().catch(() => {});
    }
  });
});
