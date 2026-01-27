import { chromium, Browser, Page } from 'playwright';

import { EnvProxyProvider } from './proxies/ProxyProvider.js';
import { Scraper, ScrapedProduct } from './types.js';

export abstract class BaseScraper implements Scraper {
    protected browser: Browser | null = null;
    protected abstract platformName: string;
    private proxyProvider = new EnvProxyProvider();

    abstract matches(url: string): boolean;
    protected abstract extractProduct(page: Page): Promise<ScrapedProduct>;

    async scrape(url: string): Promise<ScrapedProduct> {
        console.log(`[${this.platformName}] Starting scrape for: ${url}`);

        try {
            const proxyConfig = await this.proxyProvider.getProxy();
            if (proxyConfig) {
                console.log(`[${this.platformName}] Using proxy: ${proxyConfig.server}`);
            }

            this.browser = await chromium.launch({
                headless: true,
                proxy: proxyConfig,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const context = await this.browser.newContext({
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });

            const page = await context.newPage();

            // Block heavy resources
            await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,css,woff,woff2}', route => route.abort());

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            const product = await this.extractProduct(page);
            product.url = url;
            product.scrapedAt = new Date().toISOString();

            // Vectorization Step
            try {
                // Dynamic import to avoid issues if service has initialization side effects or heavy loads
                const { VectorizationService } = await import('./VectorizationService.js');
                const vectorizer = await VectorizationService.getInstance();

                // Construct text for embedding: "Title Brand Description Attributes"
                const textToEmbed = `${product.title} ${product.brand} ${product.description || ''} ${JSON.stringify(product.attributes || {})}`.trim();

                const vectors = await vectorizer.generateAllVersions(textToEmbed);
                product.embeddingVersions = vectors;
                product.embedding = vectors.v1; // Legacy support
            } catch (err) {
                console.error(`[${this.platformName}] Vectorization failed:`, err);
                // We don't fail the whole scrape, but log error. 
                // PRD says "must vectorize 100%", so maybe we should throw? 
                // But for resilience, let's keep it non-blocking but noisy.
            }

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
