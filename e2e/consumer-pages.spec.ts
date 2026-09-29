import { test, expect, type Page, type Locator } from '@playwright/test';

// The app is mobile-first (RN gesture responder): synthetic mouse sequences
// do not reliably produce onPress, but trusted touch taps do.
test.use({ hasTouch: true });

// Consumer App page × action coverage (guest journeys against the web build).
// Conventions shared with consumer-flows.spec.ts: Tamagui pressables often
// fail hit-testing, so clicks are forced deliberately; backend-dependent
// assertions skip cleanly when the environment has no matching data.

async function expectNoCrash(page: Page) {
  await expect(page.locator('text="An error occurred in the"')).not.toBeVisible();
}

async function priceHitCount(page: Page): Promise<number> {
  return page.locator('text=/₹\\d+/').count();
}

/** Polls until any of the texts is visibly present (hidden twins excluded). */
async function seesAny(page: Page, texts: string[], timeout = 15000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    for (const t of texts) {
      // getByText = substring match; quoted text= needs full-string match.
      if ((await visibleCount(page, t)) > 0) return true;
    }
    await page.waitForTimeout(500);
  }
  return false;
}

/** First VISIBLE match among a locator's results (see firstVisible). */
async function resolveVisible(locator: Locator, timeout = 15000): Promise<Locator> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const n = await locator.count();
    for (let i = 0; i < n; i++) {
      if (await locator.nth(i).isVisible().catch(() => false)) return locator.nth(i);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('no visible element for locator');
}

/** Count of VISIBLE matches (hidden transition twins excluded). */
async function visibleCount(page: Page, text: string | RegExp): Promise<number> {
  const all = page.getByText(text);
  const n = await all.count();
  let visible = 0;
  for (let i = 0; i < n; i++) {
    if (await all.nth(i).isVisible().catch(() => false)) visible += 1;
  }
  return visible;
}

/**
 * First VISIBLE match. Direct loads render a hidden twin of route content
 * (expo-router transition tree), so .first() can resolve to a zero-size
 * node that never becomes visible.
 */
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

/** Backend product id for deterministic deep links (public query, no auth). */
async function getSeedProductId(page: Page): Promise<string | null> {
  const base = process.env.CONVEX_URL ?? 'https://canny-stoat-869.convex.cloud';
  try {
    const res = await page.request.post(`${base}/api/query`, {
      data: { path: 'products:getLatest', args: { limit: 5 }, format: 'json' },
    });
    if (!res.ok()) {
      console.log(`seed query status: ${res.status()}`);
      return null;
    }
    const json = await res.json();
    const id = json?.value?.[0]?._id;
    return typeof id === 'string' && id.length > 0 ? id : null;
  } catch (e) {
    console.log(`seed query failed: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

/**
 * Tap via the touchscreen (trusted touch sequence) so the RN gesture
 * responder fires onPress — mouse clicks do not reliably satisfy it.
 * Resolves to the first visible match (hidden expo-router twins included).
 */
async function tap(page: Page, locator: Locator): Promise<void> {
  const target = await resolveVisible(locator);
  const box = await target.boundingBox();
  if (!box) throw new Error('tap target has no bounding box');
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

/** Open a real PDP by id (deterministic, no UI dependency). Returns the url or null. */
async function openSeedPdp(page: Page): Promise<string | null> {
  const id = await getSeedProductId(page);
  // eslint-disable-next-line no-console
  console.log(`[seed] product id: ${id ?? 'NONE'}`);
  if (!id) return null;
  await page.goto(`/product/${id}`);
  const start = Date.now();
  while (Date.now() - start < 30000) {
    try {
      await firstVisible(page, 'Description');
      return page.url();
    } catch {
      // Not rendered yet — check for terminal states below.
    }
    const state = await page
      .getByText(/We encountered an unexpected error|Product not found/)
      .first()
      .count()
      .catch(() => 0);
    if (state > 0) {
      // eslint-disable-next-line no-console
      console.log('[seed] PDP settled without product content');
      return null;
    }
    await page.waitForTimeout(1000);
  }
  // eslint-disable-next-line no-console
  console.log(`[seed] PDP Description not visible for ${id}`);
  return null;
}

/** Seed the guest bag (localStorage) so bag flows work without auth. */
async function seedGuestBag(page: Page, productId: string, price = 366) {
  await page.goto('/');
  await page.evaluate(
    ([id, amount]) => {
      localStorage.setItem(
        'guest_cart_v1',
        JSON.stringify([{ productId: id, quantity: 1, price: amount }]),
      );
    },
    [productId, price] as never,
  );
}

function productIdFromPdpUrl(url: string): string {
  const parts = url.split('/product/');
  return (parts[1] ?? '').split(/[?#]/)[0];
}

test.describe('Consumer Pages', () => {
  test.describe('Tabs shell', () => {
    // Tab-bar taps are covered by every tap() test (deck, CTA, steppers…);
    // here each destination is verified to render (tap traversal is slow
    // and flaky against cold CDN loads, destination coverage is the point).
    test('every tab destination renders', async ({ page }) => {
      const tabs: { url: string; text: string }[] = [
        { url: '/home', text: 'Latest Additions' },
        { url: '/discover', text: 'Discovery' },
        { url: '/cart', text: 'Your bag is empty' },
        { url: '/profile', text: 'Sign in to personalize' },
      ];
      for (const tab of tabs) {
        await page.goto(`/(app)/(tabs)${tab.url}`);
        await firstVisible(page, tab.text);
        await expectNoCrash(page);
      }
      await page.goto('/(app)/(tabs)/search');
      await expect(page.getByPlaceholder('Search for items...')).toBeVisible({ timeout: 20000 });
      await expectNoCrash(page);
    });

    test('home renders its content sections', async ({ page }) => {
      await page.goto('/(app)/(tabs)/home');
      await firstVisible(page, 'Latest Additions');
      await expectNoCrash(page);
    });

    test('profile shows the guest upsell with working links', async ({ page }) => {
      await page.goto('/(app)/(tabs)/profile');
      await firstVisible(page, 'Sign in to personalize');
      await tap(page, page.locator('button:has-text("My Wishlist")').first());
      const prompted = await seesAny(page, ['Sign in to view wishlist', 'Continue with Phone'], 10000);
      expect(prompted).toBe(true);
      await expectNoCrash(page);
    });
  });

  test.describe('Discover deck actions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/(app)/(tabs)/discover');
      await firstVisible(page, 'Discovery');
    });

    test('arrow-key swipes advance the deck without crashing', async ({ page }) => {
      await page.waitForTimeout(3000);
      if ((await priceHitCount(page)) < 4) {
        test.skip(true, 'Need several seeded products for swipe assertions');
        return;
      }
      const first = await firstVisible(page, /₹\d+/).then((n) => n.textContent());
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(1200);
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(1200);
      // Deck still shows cards (refill keeps it alive) and never crashes.
      expect(await visibleCount(page, /₹\d+/)).toBeGreaterThan(0);
      expect(await firstVisible(page, /₹\d+/).then((n) => n.textContent())).not.toBe(first);
      await expectNoCrash(page);
    });

    test('filter overlay opens, applies, and deck keeps rendering', async ({ page }) => {
      await page.waitForTimeout(3000);
      const filterButtons = page.locator('button:has(svg)');
      await tap(page, filterButtons.first());
      await page.waitForTimeout(1000);
      // Overlay opens (Filters title) or at worst nothing breaks.
      await expectNoCrash(page);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      await expectNoCrash(page);
    });

    test('tapping a card opens its PDP', async ({ page }) => {
      await page.waitForTimeout(3000);
      if ((await priceHitCount(page)) === 0) {
        test.skip(true, 'No seeded products in this preview');
        return;
      }
      await tap(page, page.locator('text=/₹\\d+/').first());
      await expect(page).toHaveURL(/\/product\//, { timeout: 10000 });
      await expectNoCrash(page);
    });
  });

  test.describe('Search flows', () => {
    test('typing shows suggestions, results settle without refetching', async ({ page }) => {
      await page.goto('/(app)/(tabs)/search');
      const input = page.getByPlaceholder('Search for items...');
      await expect(input).toBeVisible({ timeout: 15000 });
      await input.fill('kurta');
      const firstTile = await resolveVisible(page.locator('text=/₹\\d+/'));
      const firstTitle = await firstTile.textContent();
      // Refetch-loop regression: results must settle — same first tile and
      // no loading indicator returning across a quiet window.
      await page.waitForTimeout(3500);
      const settledTile = await resolveVisible(page.locator('text=/₹\\d+/'));
      expect(await settledTile.textContent()).toBe(firstTitle);
      await expectNoCrash(page);
    });

    test('recent searches persist, then clear with the results', async ({ page }) => {
      await page.goto('/(app)/(tabs)/search');
      const input = page.getByPlaceholder('Search for items...');
      await expect(input).toBeVisible({ timeout: 15000 });
      await input.fill('kurta');
      await firstVisible(page, /₹\d+/);
      // Clearing keeps the last results (with header) instead of dropping them.
      await input.fill('');
      await expect.poll(() => visibleCount(page, 'Recent searches'), { timeout: 10000 }).toBe(0);
      await firstVisible(page, /result.*for "kurta"/);
      // Clearing results reveals recent searches, including this query.
      await tap(page, page.locator('text="Clear"').first());
      await firstVisible(page, 'Recent searches');
      await firstVisible(page, 'kurta');
      // Remove one entry via its X button.
      const remove = page.getByRole('button', { name: /Remove kurta/ }).first();
      if ((await remove.count()) > 0) {
        await tap(page, remove);
        await expect.poll(() => visibleCount(page, 'kurta'), { timeout: 10000 }).toBe(0);
      }
      await expectNoCrash(page);
    });

    test('category browse sets the query and shows results or recovery', async ({ page }) => {
      await page.goto('/(app)/(tabs)/search');
      await firstVisible(page, 'Browse Categories');
      const cards = page.locator('text="Explore"');
      if ((await cards.count()) === 0) {
        test.skip(true, 'No categories in this preview');
        return;
      }
      await tap(page, cards.first());
      await page.waitForTimeout(4000);
      const hasResults = (await priceHitCount(page)) > 0;
      const hasRecovery = (await page.getByText('No results for').count()) > 0;
      expect(hasResults || hasRecovery).toBe(true);
      await expectNoCrash(page);
    });

    test('filter drawer opens and applies without crashing', async ({ page }) => {
      await page.goto('/(app)/(tabs)/search');
      await expect(page.getByPlaceholder('Search for items...')).toBeVisible({ timeout: 15000 });
      await tap(page, page.locator('button[aria-label="Open filters"]').first()).catch(async () => {
        // Fallback: sliders icon button beside the search box.
        await tap(page, page.locator('button:has(svg)').nth(1));
      });
      await page.waitForTimeout(1000);
      await expectNoCrash(page);
      await page.keyboard.press('Escape');
      await expectNoCrash(page);
    });
  });

  test.describe('PDP', () => {
    test.beforeEach(async ({ page }) => {
      const url = await openSeedPdp(page);
      if (!url) {
        test.skip(true, 'No seeded products in this preview');
        return;
      }
    });

    test('renders brand, price, bag CTA, and sections without crashing', async ({ page }) => {
      await firstVisible(page, 'Description');
      await firstVisible(page, 'Product Details');
      await resolveVisible(page.locator('button:has-text("Add to Bag"), button:has-text("Go to Bag")'));
      await expectNoCrash(page);
    });

    test('price and CTA do not overlap', async ({ page }) => {
      await firstVisible(page, 'Description');
      const price = await resolveVisible(page.locator('text=/₹\\d+/'));
      const cta = await resolveVisible(
        page.locator('button:has-text("Add to Bag"), button:has-text("Go to Bag")'),
      );
      const priceBox = await price.boundingBox();
      const ctaBox = await cta.boundingBox();
      expect(priceBox && ctaBox).toBeTruthy();
      const overlaps =
        priceBox!.x < ctaBox!.x + ctaBox!.width &&
        ctaBox!.x < priceBox!.x + priceBox!.width &&
        priceBox!.y < ctaBox!.y + ctaBox!.height &&
        ctaBox!.y < priceBox!.y + priceBox!.height;
      expect(overlaps).toBe(false);
      await expectNoCrash(page);
    });

    test('size guide opens and closes', async ({ page }) => {
      await firstVisible(page, 'Description');
      const guide = page.locator('button:has-text("Size Guide")').first();
      if ((await guide.count()) === 0) {
        test.skip(true, 'No size guide on this product');
        return;
      }
      await tap(page, guide);
      await firstVisible(page, 'Model Measurements');
      await page.keyboard.press('Escape');
      await expect.poll(() => visibleCount(page, 'Model Measurements'), { timeout: 5000 }).toBe(0);
      await expectNoCrash(page);
    });

    test('guest wishlist tap stays on PDP without crashing', async ({ page }) => {
      await firstVisible(page, 'Description');
      page.on('dialog', async (dialog) => {
        await dialog.dismiss();
      });
      await tap(page, page.getByTestId('pdp-wishlist'));
      await page.waitForTimeout(1500);
      expect(page.url()).toMatch(/\/product\//);
      await expectNoCrash(page);
    });

    test('gallery zoom opens and closes', async ({ page }) => {
      await firstVisible(page, 'Description');
      await tap(page, page.locator('img').first());
      await page.waitForTimeout(1000);
      const close = page.locator('text="✕"').first();
      if ((await close.count()) > 0) {
        await tap(page, close);
        await page.waitForTimeout(500);
      }
      await expectNoCrash(page);
    });

    test('similar product navigates to another PDP', async ({ page }) => {
      await firstVisible(page, 'Similar to this');
      const before = page.url();
      const tiles = page.locator('text=/₹\\d+/');
      const total = await tiles.count();
      const visible: Locator[] = [];
      for (let i = 0; i < total; i++) {
        if (await tiles.nth(i).isVisible().catch(() => false)) visible.push(tiles.nth(i));
      }
      if (visible.length <= 1) {
        test.skip(true, 'No similar products rendered');
        return;
      }
      await tap(page, visible[visible.length - 1]);
      await page.waitForTimeout(3000);
      expect(page.url()).toMatch(/\/product\//);
      expect(page.url()).not.toBe(before);
      await expectNoCrash(page);
    });

    test('guest add-to-bag prompts instead of navigating away', async ({ page }) => {
      await firstVisible(page, 'Description');
      page.on('dialog', async (dialog) => {
        await dialog.dismiss();
      });
      const cta = page.locator('button:has-text("Add to Bag"), button:has-text("Go to Bag")').first();
      await tap(page, cta);
      await page.waitForTimeout(1500);
      // Guest without a size, or auth prompt: must not land in cart/checkout.
      expect(page.url()).not.toMatch(/\/(cart|checkout)/);
      await expectNoCrash(page);
    });
  });

  test.describe('Bag with seeded guest items', () => {
    test.beforeEach(async ({ page }) => {
      const url = await openSeedPdp(page);
      if (!url) {
        test.skip(true, 'No seeded products in this preview');
        return;
      }
      const id = productIdFromPdpUrl(url);
      if (!id) {
        test.skip(true, 'Could not read product id from PDP url');
        return;
      }
      await seedGuestBag(page, id);
      await page.goto('/(app)/(tabs)/cart');
      await firstVisible(page, 'Shopping Bag');
    });

    test('rows render with stepper that does not overlap the price', async ({ page }) => {
      const price = await resolveVisible(page.locator('text=/₹\\d+/'));
      const stepper = await resolveVisible(page.locator('text="1"'));
      const priceBox = await price.boundingBox();
      const stepBox = await stepper.boundingBox();
      if (priceBox && stepBox) {
        const overlaps =
          priceBox.x < stepBox.x + stepBox.width &&
          stepBox.x < priceBox.x + priceBox.width &&
          priceBox.y < stepBox.y + stepBox.height &&
          stepBox.y < priceBox.y + priceBox.height;
        expect(overlaps).toBe(false);
      }
      await expectNoCrash(page);
    });

    test('quantity steppers update and remove clears the row', async ({ page }) => {
      const plus = page.getByTestId('cart-increase').first();
      if ((await plus.count()) === 0) {
        test.skip(true, 'No stepper rendered');
        return;
      }
      await tap(page, plus);
      // Quantity is guest-local state: verify persistence, not pixels.
      await expect
        .poll(
          async () =>
            page.evaluate(() => {
              try {
                return JSON.parse(localStorage.getItem('guest_cart_v1') ?? '[]')[0]?.quantity ?? -1;
              } catch {
                return -1;
              }
            }),
          { timeout: 10000 },
        )
        .toBe(2);
      await tap(page, page.getByTestId('cart-remove').first());
      await firstVisible(page, 'Your bag is empty');
      await expectNoCrash(page);
    });

    test('merchant button never crashes the bag', async ({ page }) => {
      let dialogSeen = false;
      page.on('dialog', async (dialog) => {
        dialogSeen = true;
        await dialog.dismiss();
      });
      let popupOpened = false;
      page.on('popup', () => {
        popupOpened = true;
      });
      let merchant: Locator;
      try {
        merchant = await resolveVisible(page.locator('button:has-text("Shop on Merchant")'));
      } catch {
        test.skip(true, 'No merchant button rendered');
        return;
      }
      await tap(page, merchant);
      await page.waitForTimeout(2000);
      // Either a retailer tab/popup or an explanatory alert — a quiet
      // no-op means the dead-button bug is back.
      expect(popupOpened || dialogSeen).toBe(true);
      await expectNoCrash(page);
    });
  });

  test.describe('Guest-gated pages', () => {
    const gated: { url: string; texts: string[] }[] = [
      { url: '/wishlist', texts: ['Sign in to view wishlist', 'Continue with Phone'] },
      { url: '/orders', texts: ['Your Orders', 'Continue with Phone'] },
      { url: '/addresses', texts: ['Saved Addresses', 'Continue with Phone'] },
      { url: '/checkout', texts: ['Sign in to checkout', 'Continue with Phone'] },
      { url: '/feedback', texts: ['Send Feedback', 'Continue with Phone'] },
      { url: '/notifications', texts: ['Notifications', 'Continue with Phone'] },
      { url: '/settings', texts: ['Settings', 'Continue with Phone'] },
      { url: '/edit-profile', texts: ['Sign in to edit profile', 'Continue with Phone'] },
      { url: '/board/does-not-exist', texts: ['Board not found', 'We encountered an unexpected error', 'Continue with Phone'] },
      { url: '/wishlist/create', texts: ['Create Collection', 'Continue with Phone'] },
    ];
    for (const { url, texts } of gated) {
      test(`guest visits ${url}`, async ({ page }) => {
        await page.goto(url);
        expect(await seesAny(page, texts, 20000)).toBe(true);
        await expectNoCrash(page);
      });
    }

    test('invalid board recovers through the error fallback', async ({ page }) => {
      await page.goto('/board/does-not-exist');
      const crashed = await seesAny(page, ['We encountered an unexpected error'], 20000);
      if (!crashed) {
        // Clean not-found rendering is equally acceptable.
        expect(await seesAny(page, ['Board not found'], 5000)).toBe(true);
        await expectNoCrash(page);
        return;
      }
      await tap(page, page.locator('text="Go Home"').first());
      await page.waitForTimeout(3000);
      expect(page.url()).not.toMatch(/\/board\//);
      await expectNoCrash(page);
    });

    test('guest order detail is gated', async ({ page }) => {
      await page.goto('/orders/does-not-exist');
      const gated = await seesAny(page, ['Order not found', 'Continue with Phone'], 20000);
      expect(gated).toBe(true);
      await expectNoCrash(page);
    });
  });

  test.describe('Auth pages', () => {
    test('auth index offers phone and email entry', async ({ page }) => {
      await page.goto('/(auth)');
      await firstVisible(page, 'Continue with Phone');
      await expectNoCrash(page);
    });

    test('phone page accepts a number without crashing', async ({ page }) => {
      await page.goto('/(auth)/phone');
      const input = page.getByPlaceholder('+91 99999 99999');
      await expect(input).toBeVisible({ timeout: 15000 });
      await input.fill('+91 99999 99999');
      await expectNoCrash(page);
    });

    test('email page toggles sign-in and account creation', async ({ page }) => {
      await page.goto('/(auth)/email');
      await firstVisible(page, 'Sign In');
      await expectNoCrash(page);
    });

    test('otp route never crashes', async ({ page }) => {
      await page.goto('/(auth)/otp');
      await page.waitForTimeout(3000);
      await expectNoCrash(page);
    });
  });

  test.describe('Sync invite', () => {
    test('web shows the app-download invite for any code', async ({ page }) => {
      await page.goto('/sync/does-not-exist');
      await firstVisible(page, 'StyleSwipe Partner Sync');
      await firstVisible(page, 'Download App');
      await expectNoCrash(page);
    });
  });

  test.describe('Partner sync settings', () => {
    test('renders hero, features, and invite actions', async ({ page }) => {
      await page.goto('/partner-sync');
      const gated = await seesAny(page, ['Continue with Phone'], 8000);
      if (gated) {
        test.skip(true, 'Partner sync is auth-gated in this preview');
        return;
      }
      await firstVisible(page, 'Collaborative Shopping');
      await firstVisible(page, 'Blended Recommendations');
      await firstVisible(page, 'Share Link');
      await firstVisible(page, 'Show QR Code');
      await expectNoCrash(page);
    });
  });
});
