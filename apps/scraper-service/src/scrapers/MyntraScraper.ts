/**
 * Myntra Scraper - Scrapes product data from Myntra
 * Ports logic from browser extension's mapToScrapedProduct
 * Supports single products and paginated category scraping
 */

import type { ScrapedProduct } from '@app/core';

import { chromium, Browser, Page } from 'playwright';

// =============================================================================
// ANTI-DETECTION CONFIGURATION
// =============================================================================

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
];

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1536, height: 864 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
];

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function randomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function randomViewport(): { width: number; height: number } {
  return VIEWPORTS[Math.floor(Math.random() * VIEWPORTS.length)];
}

// =============================================================================
// MYNTRA RAW DATA TYPES (from extension)
// =============================================================================

export interface MyntraImage {
  src: string;
  view?: string;
  srcUrl?: string;
}

interface MyntraAlbum {
  images?: MyntraImage[];
}

interface MyntraInventory {
  label: string;
  available?: boolean;
  inventory?: number;
  brandSizeLabel?: string;
}

interface MyntraAttribute {
  attribute?: string;
  name?: string;
  key?: string;
  title?: string;
  value?: string | number | boolean;
  description?: string;
  label?: string;
}

interface MyntraDescriptor {
  title?: string;
  description?: string;
}

export interface MyntraRawData {
  id?: string | number;
  productId?: string | number;
  gender?: string;
  core?: { gender?: string };
  name?: string;
  productName?: string;
  product?: string;
  brand?: { name?: string } | string;
  price?:
    | {
        discounted?: number;
        mrp?: number;
        discount?: { label?: string };
        discountedPrice?: number;
      }
    | number;
  mrp?: number;
  discountDisplayLabel?: string;
  discount?: string;
  media?: { albums?: MyntraAlbum[] };
  images?: (string | MyntraImage)[];
  searchImage?: string;
  image?: string;
  inventoryInfo?: MyntraInventory[];
  style?: { inventoryInfo?: MyntraInventory[] };
  sizes?: string | MyntraAttribute[];
  articleAttributes?: Record<string, string | number | boolean>;
  productAttributes?: MyntraAttribute[] | Record<string, string | number | boolean>;
  attributes?: MyntraAttribute[] | Record<string, string | number | boolean>;
  productDetails?: MyntraDescriptor[] | { description?: string };
  description?: string;
  productDescriptors?: MyntraDescriptor[] | { description?: string };
  analytics?: {
    articleType?: string | { typeName?: string; name?: string };
    masterCategory?: string | { typeName?: string; name?: string };
    subCategory?: string | { typeName?: string; name?: string };
  };
  articleType?: string | { typeName?: string; name?: string };
  category?: string | { typeName?: string; name?: string };
  masterCategory?: string | { typeName?: string; name?: string };
  subCategory?: string | { typeName?: string; name?: string };
  ratings?: { averageRating?: number; totalCount?: number };
  rating?: number;
  reviews?: number;
  ratingCount?: number;
  pdpData?: MyntraRawData;
  landingPageUrl?: string;
  primaryColor?: string;
  primaryColour?: string;
  baseColor?: string;
  baseColour?: string;
}

export interface MyntraFullData {
  pdpData?: MyntraRawData;
  plaproduct?: MyntraRawData;
  products?: MyntraRawData[];
  searchData?: {
    results?: {
      products?: MyntraRawData[];
    };
  };
}

// =============================================================================
// MAPPING FUNCTIONS (ported from extension)
// =============================================================================

export function cleanImageUrl(url: string): string {
  return url.replace(/\(\$size_representation\$\)/g, '').replace(/\$quality\$/g, '90');
}

export function mapToScrapedProduct(data: MyntraRawData, url: string): ScrapedProduct {
  const externalId = (data.id?.toString() || data.productId?.toString() || '').toString();
  const gender = data.gender || data.core?.gender || '';
  const title = data.name || data.productName || data.product || '';
  const brandRaw = data.brand;
  const brand = typeof brandRaw === 'object' ? brandRaw?.name || '' : brandRaw || '';

  const priceObj = typeof data.price === 'object' ? data.price : null;
  const priceNum = typeof data.price === 'number' ? data.price : 0;
  const price = priceObj?.discounted || priceObj?.discountedPrice || priceNum || 0;

  const mrp = priceObj?.mrp || data.mrp || priceNum || 0;
  const discount = priceObj?.discount?.label || data.discountDisplayLabel || data.discount || '';

  // Images
  let images: string[] = [];
  if (data.media?.albums) {
    images = data.media.albums.flatMap(
      (album: MyntraAlbum) => album.images?.map((img: MyntraImage) => cleanImageUrl(img.src)) || [],
    );
  } else if (data.images && Array.isArray(data.images)) {
    images = data.images.map((img: string | MyntraImage) =>
      cleanImageUrl(typeof img === 'string' ? img : img.src || img.view || img.srcUrl || ''),
    );
  } else if (data.searchImage) {
    images = [cleanImageUrl(data.searchImage)];
  } else if (data.image) {
    images = [cleanImageUrl(data.image)];
  }

  // Sizes
  let availableSizes: string[] = [];
  const invInfo = data.inventoryInfo || data.style?.inventoryInfo;
  if (invInfo && Array.isArray(invInfo)) {
    availableSizes = invInfo
      .filter((i: MyntraInventory) => i.available || (i.inventory && i.inventory > 0))
      .map((i: MyntraInventory) => i.brandSizeLabel || i.label);
  } else if (data.sizes) {
    if (Array.isArray(data.sizes)) {
      availableSizes = (data.sizes as MyntraAttribute[]).map((s: MyntraAttribute) =>
        (s.label || s).toString(),
      );
    } else if (typeof data.sizes === 'string') {
      availableSizes = (data.sizes as string).split(',');
    }
  }

  // Attributes
  const attributesRaw: Record<string, unknown> = {
    ...data.articleAttributes,
  };

  const mergeAttrs = (
    source: MyntraAttribute[] | Record<string, string | number | boolean> | undefined,
  ) => {
    if (!source) return;
    if (Array.isArray(source)) {
      source.forEach((attr: MyntraAttribute) => {
        const key = attr.attribute || attr.name || attr.key || attr.title;
        const val = attr.value || attr.description || attr.label;
        if (key && val) {
          if (
            key.toLowerCase().includes('deal of the day') ||
            val.toString().toLowerCase().includes('deal of the day')
          )
            return;
          attributesRaw[key] = val;
        }
      });
    } else if (typeof source === 'object') {
      Object.entries(source).forEach(([key, val]) => {
        if (
          key.toLowerCase().includes('deal of the day') ||
          (val && val.toString().toLowerCase().includes('deal of the day'))
        )
          return;
        attributesRaw[key] = val;
      });
    }
  };

  mergeAttrs(data.productAttributes);
  mergeAttrs(data.attributes);

  // Description
  let description = '';
  if (Array.isArray(data.productDetails)) {
    description =
      (data.productDetails as MyntraDescriptor[]).find((s: MyntraDescriptor) =>
        s.title?.toLowerCase().includes('product details'),
      )?.description || '';
  } else if (data.productDetails && (data.productDetails as { description?: string }).description) {
    description = (data.productDetails as { description?: string }).description || '';
  } else if (data.description) {
    description = data.description;
  }

  if (!description && Array.isArray(data.productDescriptors)) {
    const descObj = (data.productDescriptors as MyntraDescriptor[]).find(
      (d: MyntraDescriptor) =>
        d.title?.toLowerCase().includes('description') ||
        d.title?.toLowerCase().includes('details'),
    );
    description = descObj?.description || '';
  }

  if (!description && data.productDescriptors && !Array.isArray(data.productDescriptors)) {
    description = (data.productDescriptors as { description?: string }).description || '';
  }

  if (!description && typeof attributesRaw['Style Note'] === 'string') {
    description = attributesRaw['Style Note'];
  }

  // Category
  const categoryRaw = data.analytics?.articleType || data.articleType || data.category || '';
  const category =
    typeof categoryRaw === 'string'
      ? categoryRaw
      : categoryRaw?.typeName || categoryRaw?.name || '';

  const masterCategoryRaw = data.analytics?.masterCategory || data.masterCategory || '';
  const masterCategory =
    typeof masterCategoryRaw === 'string'
      ? masterCategoryRaw
      : masterCategoryRaw?.typeName || masterCategoryRaw?.name || '';

  const subCategoryRaw = data.analytics?.subCategory || data.subCategory || '';
  const subCategory =
    typeof subCategoryRaw === 'string'
      ? subCategoryRaw
      : subCategoryRaw?.typeName || subCategoryRaw?.name || '';

  const productUrl = url.includes(externalId)
    ? url
    : `https://www.myntra.com/${data.landingPageUrl || externalId}`;

  return {
    externalId,
    url: productUrl,
    brand,
    title,
    price,
    mrp,
    discount,
    images,
    availableSizes,
    description,
    rating: data.ratings?.averageRating || data.rating || 0,
    reviewCount: data.ratings?.totalCount || data.reviews || data.ratingCount || 0,
    platform: 'Myntra',
    attributes: {
      material:
        attributesRaw['Fabric'] || attributesRaw['Material'] || attributesRaw['Fabric 1'] || '',
      fit: attributesRaw['Fit'] || attributesRaw['Pattern'] || '',
      care: attributesRaw['Wash Care'] || attributesRaw['Care Instruction'] || '',
      color:
        data.primaryColor ||
        data.primaryColour ||
        data.baseColor ||
        data.baseColour ||
        attributesRaw['Color'] ||
        attributesRaw['Colour'] ||
        '',
      size: availableSizes,
      inventoryInfo: invInfo,
      masterCategory,
      subCategory,
      ...attributesRaw,
    },
    gender: gender.toLowerCase(),
    category,
    masterCategory,
    subCategory,
    raw: data,
  };
}

// =============================================================================
// MYNTRA SCRAPER CLASS
// =============================================================================

export interface ScrapeProgress {
  currentPage: number;
  totalPages: number;
  productsScraped: number;
  productsFoundOnPage: number;
  status: string;
}

export class MyntraScraper {
  private browser: Browser | null = null;

  async init(): Promise<void> {
    const chromePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    // Default to headed mode (headless: false) unless explicitly set to "true"
    const headless = process.env.HEADLESS === 'true';

    console.log(`[MyntraScraper] Launching browser (headless: ${headless})...`);

    this.browser = await chromium.launch({
      headless,
      executablePath: chromePath || undefined,
      ignoreDefaultArgs: ['--enable-automation'],
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-http2',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
      ],
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async takeDebugScreenshot(page: Page, name: string) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `debug_${name}_${timestamp}.png`;
      await page.screenshot({ path: filename, fullPage: true });
      console.log(`[MyntraScraper] Saved debug screenshot to: ${filename}`);
    } catch (e) {
      console.error('[MyntraScraper] Failed to take debug screenshot:', e);
    }
  }

  private async getPage(): Promise<Page> {
    if (!this.browser) await this.init();

    const context = await this.browser!.newContext({
      userAgent: randomUserAgent(),
      viewport: randomViewport(),
      deviceScaleFactor: 2,
      hasTouch: false,
      locale: 'en-US',
      timezoneId: 'Asia/Kolkata',
    });

    const page = await context.newPage();

    // 1. Pass webdriver check
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    // 2. Mock Chrome object
    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).chrome = {
        runtime: {},
        loadTimes: function () {},
        csi: function () {},
        app: {},
      };
    });

    // 3. Mock Plugins
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          {
            name: 'Chrome PDF Plugin',
            filename: 'internal-pdf-viewer',
            description: 'Portable Document Format',
          },
          {
            name: 'Chrome PDF Viewer',
            filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjmm',
            description: '',
          },
          { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
        ],
      });
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    });

    // Block unnecessary resources for speed (but allow styles)
    await page.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (['image', 'media', 'font'].includes(type)) {
        return route.abort();
      }
      return route.continue();
    });

    return page;
  }

  private async extractMyntraData(page: Page): Promise<MyntraFullData | null> {
    // Wait for the __myx script or other data sources
    try {
      await page.waitForFunction(
        () => {
          return (
            // @ts-expect-error - __myx is injected by the retailer's page script
            !!window.__myx ||
            Array.from(document.querySelectorAll('script')).some((s) =>
              s.innerText.includes('window.__myx ='),
            )
          );
        },
        { timeout: 15000 },
      );
    } catch {
      console.warn('[MyntraScraper] Could not find __myx script via waitForFunction');
      // Don't return null yet, try to read whatever is there
    }

    // Extract the data
    const data = await page.evaluate(() => {
      // Try direct access first
      // @ts-expect-error - __myx is injected by the retailer's page script
      if (window.__myx) {
        // @ts-expect-error - __myx is injected by the retailer's page script
        return window.__myx;
      }

      const scripts = Array.from(document.querySelectorAll('script'));
      const myxScript = scripts.find((s) => s.innerText.includes('window.__myx ='));

      if (myxScript) {
        const jsonStr = myxScript.innerText.split('window.__myx =')[1]?.split(';')[0];
        try {
          return JSON.parse(jsonStr || '{}');
        } catch {
          // ignore
        }
      }

      return null;
    });

    if (!data) {
      console.log('[MyntraScraper] Debug: No data found. Dumping page snippets...');
      const title = await page.title();
      console.log('[MyntraScraper] Page Title:', title);
      // Check if we hit a captcha or block
      const bodyText = await page.innerText('body');
      if (bodyText.includes('Access Denied') || bodyText.includes('Security Check')) {
        console.error('[MyntraScraper] BLOCKED: Access Denied or Security Check detected');
      }
    }

    return data;
  }

  /**
   * Scrape a single product page
   */
  async scrapeProduct(url: string): Promise<ScrapedProduct | null> {
    const page = await this.getPage();

    try {
      console.log(`[MyntraScraper] Scraping product: ${url}`);
      await randomDelay(1000, 2000); // Anti-detection delay

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      const fullData = await this.extractMyntraData(page);
      if (!fullData) {
        console.error(`[MyntraScraper] No data found for ${url}`);
        return null;
      }

      // Prioritize data sources
      let data: MyntraRawData | undefined = fullData.pdpData;
      if (!data || !data.id) {
        if (fullData.plaproduct?.id) data = fullData.plaproduct;
        else if (fullData.searchData?.results?.products?.[0]) {
          data = fullData.searchData.results.products[0];
        } else if (fullData.products?.[0]) {
          data = fullData.products[0];
        }
      }

      // Handle nested pdpData
      if ((!data || !data.id) && fullData.pdpData?.pdpData) {
        data = fullData.pdpData.pdpData;
      }

      if (!data || (!data.id && !data.productId)) {
        console.error(`[MyntraScraper] Invalid data structure for ${url}`);
        return null;
      }

      if (process.env.HEADLESS === 'false') {
        console.log('[MyntraScraper] Success!');
      }

      return mapToScrapedProduct(data, url);
    } catch (error) {
      console.error(`[MyntraScraper] Failed to scrape ${url}:`, error);
      await this.takeDebugScreenshot(page, 'error_product');
      return null;
    } finally {
      if (!page.isClosed()) {
        await page.close();
      }
    }
  }

  /**
   * Scrape a category page with pagination
   */
  async scrapeCategory(
    url: string,
    maxPages: number = 1,
    startPage: number = 1,
    onProgress?: (progress: ScrapeProgress) => void,
  ): Promise<ScrapedProduct[]> {
    const allProducts: ScrapedProduct[] = [];
    const seenIds = new Set<string>();

    const page = await this.getPage();
    try {
      const endPage = startPage + maxPages - 1;
      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        try {
          // Construct paginated URL
          const separator = url.includes('?') ? '&' : '?';
          const pageUrl = pageNum === 1 ? url : `${url}${separator}p=${pageNum}`;
          console.log(`[MyntraScraper] Scraping category page ${pageNum}/${maxPages}: ${pageUrl}`);

          onProgress?.({
            currentPage: pageNum,
            totalPages: maxPages,
            productsScraped: allProducts.length,
            productsFoundOnPage: 0,
            status: `Scraping page ${pageNum}`,
          });

          await randomDelay(2000, 4000); // Longer delay for categories to avoid rate limiting

          await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

          // Wait a bit for the page to stabilize
          await randomDelay(3000, 5000);

          const fullData = await this.extractMyntraData(page);
          let productsRaw: MyntraRawData[] = [];
          // let useDomExample = false;

          if (fullData) {
            productsRaw = fullData.searchData?.results?.products || fullData.products || [];
          }

          if (productsRaw.length === 0) {
            console.warn(
              `[MyntraScraper] No JSON data on page ${pageNum}. Attempting DOM fallback...`,
            );
            const domProducts = await this.scrapeCategoryFromDOM(page);

            if (domProducts.length > 0) {
              console.log(
                `[MyntraScraper] Found ${domProducts.length} products via DOM scraping on page ${pageNum}`,
              );
              for (const p of domProducts) {
                if (p.externalId && !seenIds.has(p.externalId)) {
                  seenIds.add(p.externalId);
                  allProducts.push(p);
                }
              }
              // Continue to next page loop, skipping the standard mapping below
              onProgress?.({
                currentPage: pageNum,
                totalPages: maxPages,
                productsScraped: allProducts.length,
                productsFoundOnPage: domProducts.length,
                status: `Completed page ${pageNum} (DOM)`,
              });
              continue;
            } else {
              console.log(
                `[MyntraScraper] No products found on page ${pageNum} via DOM fallback. Continuing to next page...`,
              );
              continue;
            }
          }

          console.log(
            `[MyntraScraper] Found ${productsRaw.length} products via JSON on page ${pageNum}`,
          );

          for (const productData of productsRaw) {
            const product = mapToScrapedProduct(productData, pageUrl);
            if (product.externalId && !seenIds.has(product.externalId)) {
              seenIds.add(product.externalId);
              allProducts.push(product);
            }
          }

          onProgress?.({
            currentPage: pageNum,
            totalPages: maxPages,
            productsScraped: allProducts.length,
            productsFoundOnPage: productsRaw.length, // Only correct for JSON path? No, dom path handles its own continuing.
            status: `Completed page ${pageNum}`,
          });
        } catch (error) {
          console.error(`[MyntraScraper] Error on page ${pageNum}:`, error);
          await this.takeDebugScreenshot(page, `error_page_${pageNum}`);
        }
      }
    } finally {
      if (!page.isClosed()) {
        await page.close();
      }
    }

    console.log(`[MyntraScraper] Category scrape complete: ${allProducts.length} products`);
    return allProducts;
  }

  /**
   * Fallback method to scrape products directly from DOM if JSON is missing
   */
  private async scrapeCategoryFromDOM(page: Page): Promise<ScrapedProduct[]> {
    return page.evaluate(() => {
      const items = document.querySelectorAll('li.product-base');
      const results: ScrapedProduct[] = [];

      items.forEach((item) => {
        try {
          const anchor = item.querySelector('a');
          if (!anchor) return;

          const href = anchor.getAttribute('href');
          if (!href) return;

          const fullUrl = href.startsWith('http') ? href : `https://www.myntra.com/${href}`;

          // Extract ID from URL (e.g., .../123456/buy)
          const matches = fullUrl.match(/\/(\d+)\/buy/);
          const id = matches ? matches[1] : null;
          if (!id) return;

          const brand = item.querySelector('.product-brand')?.textContent || '';
          const title = item.querySelector('.product-product')?.textContent || '';

          const priceEl =
            item.querySelector('.product-discountedPrice') || item.querySelector('.product-price');
          const priceText = priceEl?.textContent?.replace(/[^\d]/g, '') || '0';
          const price = parseInt(priceText, 10);

          const img = item.querySelector('img');
          const imgUrl = img?.getAttribute('src') || img?.getAttribute('data-src') || '';

          results.push({
            externalId: id,
            url: fullUrl,
            title: title,
            brand: brand,
            price: price,
            mrp: price, // Approximate
            discount: '0',
            images: [imgUrl],
            availableSizes: [],
            attributes: {},
            description: '',
            rating: 0,
            reviewCount: 0,
            platform: 'Myntra',
          });
        } catch {
          // Ignore item error
        }
      });
      return results;
    });
  }

  /**
   * Check if a URL is a Myntra URL
   */
  static matches(url: string): boolean {
    return url.includes('myntra.com');
  }
}
