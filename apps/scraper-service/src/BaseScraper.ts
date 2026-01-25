import { chromium, Browser, Page } from 'playwright';
import { Scraper, ScrapedProduct } from './types.js';

export abstract class BaseScraper implements Scraper {
    protected browser: Browser | null = null;
    protected abstract platformName: string;

    abstract matches(url: string): boolean;
    protected abstract extractProduct(page: Page): Promise<ScrapedProduct>;

    async scrape(url: string): Promise<ScrapedProduct> {
        console.log(`[${this.platformName}] Starting scrape for: ${url}`);

        try {
            this.browser = await chromium.launch({
                headless: true, // Try setting to false if headless is detected
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-http2',
                    '--hide-scrollbars',
                    '--mute-audio'
                ]
            });

            const context = await this.browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport: { width: 1280, height: 720 },
                deviceScaleFactor: 1,
            });

            const page = await context.newPage();

            // Block heavy resources
            await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,css,woff,woff2}', route => route.abort());

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            const product = await this.extractProduct(page);
            product.url = url;
            product.scrapedAt = new Date().toISOString();

            return product;
        } catch (error) {
            console.error(`[${this.platformName}] Error scraping ${url}:`, error);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
        }
    }
}
