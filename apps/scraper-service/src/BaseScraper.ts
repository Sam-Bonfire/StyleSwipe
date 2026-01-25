import { chromium } from 'playwright-extra';
// @ts-ignore - plugin has no types
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'playwright';
import { Scraper, ScrapedProduct } from './types.js';
import { UserAgentService } from './utils/UserAgentService.js';

chromium.use(stealthPlugin());

export abstract class BaseScraper implements Scraper {
    protected browser: Browser | null = null;
    protected abstract platformName: string;

    abstract matches(url: string): boolean;
    protected abstract extractProduct(page: Page): Promise<ScrapedProduct>;

    protected async randomDelay(min = 1000, max = 3000) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    async scrape(url: string): Promise<ScrapedProduct> {
        console.log(`[${this.platformName}] Starting scrape for: ${url}`);

        try {
            this.browser = await chromium.launch({
                headless: true, // Keep true, stealth plugin handles the rest
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-http2', // Keep this to avoid protocol errors
                    '--hide-scrollbars',
                    '--mute-audio',
                    '--window-size=1920,1080',
                ]
            });

            const context = await this.browser.newContext({
                userAgent: UserAgentService.getRandom(),
                viewport: {
                    width: 1920 + Math.floor(Math.random() * 100),
                    height: 1080 + Math.floor(Math.random() * 100)
                },
                deviceScaleFactor: 1,
                hasTouch: false,
                isMobile: false,
                locale: 'en-US',
                timezoneId: 'Asia/Kolkata',
            });

            // Add extra evasion scripts
            await context.addInitScript(() => {
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
            });

            const page = await context.newPage();

            // Block heavy resources
            await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,css,woff,woff2}', route => route.abort());

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await this.randomDelay(2000, 5000); // Wait for potential extensive loading

            // Simulate mouse movement
            await page.mouse.move(100, 100);
            await this.randomDelay(500, 1000);
            await page.mouse.move(200, 200);

            const product = await this.extractProduct(page);
            product.url = url;
            product.scrapedAt = new Date().toISOString();

            return product;
        } catch (error) {
            console.error(`[${this.platformName}] Error scraping ${url}:`, error);
            if (this.browser) {
                const pages = this.browser.contexts()[0]?.pages();
                if (pages && pages.length > 0) {
                    await pages[0].screenshot({ path: 'debug_failure.png', fullPage: true });
                    console.log('Saved debug_failure.png');
                }
            }
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
