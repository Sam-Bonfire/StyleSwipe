import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Client-surface spec — what ships to browsers and what leaves the device.
 *
 * Criticality map:
 *   SEC-07 [Medium] Outbound retailer links are restricted to http(s):
 *     scraped merchant URLs flow into Linking.openURL, and a javascript:
 *     URL would execute in the app origin on web. Remediation: validate
 *     the scheme in MerchantButton/handleShop before opening.
 *     Acceptance: the live test below passes (fixme until implemented).
 *   SEC-08 [Medium] Hardened response headers on every Pages deployment
 *     (frame-ancestors against clickjacking; nosniff; minimal
 *     permissions; referrer policy). Deliberately no script/style CSP:
 *     expo web needs inline scripts and Tamagui injects styles, so a
 *     strict CSP would break the app. Remediation: apps/consumer-app/
 *     public/_headers (copied into dist by expo export). Acceptance: live
 *     test below passes once deployed.
 *   SEC-09 [Low] Client bundle contains no secrets (Convex URL is public
 *     by design; signing keys, tokens and private keys must never ship).
 *     Acceptance: live test below passes.
 */

async function responseHeaders(
  request: APIRequestContext,
  path: string,
): Promise<Record<string, string>> {
  const res = await request.get(path);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(res.headers())) out[k.toLowerCase()] = v;
  return out;
}

test.describe('Client surface', () => {
  test.fixme('[SEC-07 · Medium] merchant links reject non-http(s) schemes', async ({ page }) => {
    // Drives the real MerchantButton path: with a javascript: merchant URL
    // (as scraped third-party data could carry), tapping must NOT navigate
    // or execute script — an explanatory alert or silent no-op is correct.
    // Needs a fixture product carrying such a URL, so this stays fixme
    // until the scheme check plus fixture exist.
    await page.goto('/(app)/(tabs)/discover');
    expect(true).toBe(true);
  });

  test('[SEC-08 · Medium] hardened response headers are present', async ({ request }) => {
    const h = await responseHeaders(request, '/');
    expect(h['x-content-type-options'], 'nosniff').toBe('nosniff');
    const frame =
      h['content-security-policy'] ?? h['x-frame-options'] ?? '';
    expect(
      /frame-ancestors|SAMEORIGIN|DENY/i.test(frame),
      `clickjacking guard missing, got: ${frame.slice(0, 120)}`,
    ).toBe(true);
    expect(h['referrer-policy']?.length ?? 0).toBeGreaterThan(0);
  });

  test('[SEC-09 · Low] client bundle ships no secrets', async ({ request }) => {
    const html = await (await request.get('/')).text();
    const bundles = [...html.matchAll(/src="([^"]+\.js[^"]*)"/g)].map((m) => m[1]).slice(0, 4);
    expect(bundles.length).toBeGreaterThan(0);
    // Name references (better-auth reading C.env.X) and library code (jose
    // parsing PEM headers) mention these strings without containing secret
    // material; only assigned VALUES and real key blocks count as leaks.
    const valuePatterns = [
      /BETTER_AUTH_SECRET["']?\s*[:=]\s*["'][^"']{8,}/,
      /EXPO_ACCESS_TOKEN["']?\s*[:=]\s*["'][^"']{8,}/,
      /BEGIN (RSA )?PRIVATE KEY-----[\r\n]+[A-Za-z0-9+/=\r\n]{100,}/,
      /sk-live-[A-Za-z0-9]+/,
      /xoxb-[A-Za-z0-9-]+/,
    ];
    for (const src of bundles) {
      const js = await (await request.get(src)).text();
      for (const re of valuePatterns) {
        expect(re.test(js), `bundle leaks secret matching ${re}`).toBe(false);
      }
    }
  });
});
