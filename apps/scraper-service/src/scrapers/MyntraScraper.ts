import { chromium, Browser, Page } from 'playwright';
import { ScrapedProduct, MyntraInitialData } from '../domain/types';

export class MyntraScraper {
    private browser: Browser | null = null;
    // private baseUrl = 'https://www.myntra.com'; // TODO: Use for category crawling

    async init() {
        this.browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-http2', // Force HTTP/1.1 if HTTP/2 fails
                '--ignore-certificate-errors',
            ]
        });
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    private async getPage(): Promise<Page> {
        if (!this.browser) await this.init();
        const context = await this.browser!.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 720 },
        });
        const page = await context.newPage();

        // Block unnecessary resources
        await page.route('**/*', (route) => {
            const type = route.request().resourceType();
            if (['image', 'font', 'stylesheet', 'media'].includes(type)) {
                return route.abort();
            }
            return route.continue();
        });

        return page;
    }

    async scrapeProduct(url: string): Promise<ScrapedProduct | null> {
        const page = await this.getPage();
        try {
            console.log(`Navigating to ${url}...`);
            await page.goto(url, { waitUntil: 'commit', timeout: 60000 }); // Wait for connection only

            console.log('Page connected, waiting for data script...');
            // Wait specifically for the data script
            await page.waitForFunction(() => {
                return Array.from(document.querySelectorAll('script')).some(s => s.innerText.includes('window.__myx ='));
            }, null, { timeout: 30000 });

            console.log('Script found, extracting...');
            const scriptContent = await page.evaluate(() => {
                const scripts = Array.from(document.querySelectorAll('script'));
                const myxScript = scripts.find(s => s.innerText.includes('window.__myx ='));
                return myxScript ? myxScript.innerText : null;
            });

            if (!scriptContent) {
                console.error(`No data found for ${url}`);
                return null;
            }

            // Parse JSON
            const jsonStr = scriptContent.split('window.__myx =')[1]?.split(';')[0];
            const data = JSON.parse(jsonStr || '{}');
            const pdpData = data.pdpData || data; // Adjust based on actual structure

            if (!pdpData || !pdpData.id) {
                console.error(`Invalid data structure for ${url}`);
                return null;
            }

            return this.mapToEntity(pdpData, url);

        } catch (error) {
            console.error(`Failed to scrape ${url}:`, error);
            return null;
        } finally {
            await page.close();
        }
    }

    private mapToEntity(raw: MyntraInitialData['pdpData'], url: string): ScrapedProduct {
        const brand = raw.brand?.name || 'Unknown';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const title = raw.name || (raw as any).title || 'Unknown Product';
        const mrp = raw.price?.mrp || 0;
        const price = raw.price?.discounted || mrp;
        const discount = mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const images = raw.media?.albums?.[0]?.images?.map((img: any) => img.src) || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sizes = raw.sizes?.filter((s: any) => s.available).map((s: any) => s.label) || [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const description = raw.descriptors?.find((d: any) => d.title === 'description')?.description || '';

        // Materials extraction (simplified)
        const materials: Record<string, string> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (raw as any).articleAttributes?.forEach((attr: any) => {
            materials[attr.key] = attr.value;
        });

        return {
            myntraId: String(raw.id),
            title,
            brand,
            price,
            mrp,
            discount,
            images,
            sizes,
            description,
            materials,
            rating: raw.ratings?.averageRating || 0,
            reviewCount: raw.ratings?.totalCount || 0,
            url,
            status: 'active' // Logic for out of stock checks can be added here
        };
    }
}
