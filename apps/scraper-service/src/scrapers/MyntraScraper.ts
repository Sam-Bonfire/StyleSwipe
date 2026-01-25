import { Page } from 'playwright';
import { BaseScraper } from '../BaseScraper.js';
import { ScrapedProduct } from '../types.js';

export class MyntraScraper extends BaseScraper {
    protected platformName = 'Myntra';

    matches(url: string): boolean {
        return url.includes('myntra.com');
    }

    protected async extractProduct(page: Page): Promise<ScrapedProduct> {
        // Myntra uses structured data in scripts often, but specific selectors work too.
        // Waiting for the main P element that holds product info
        await page.waitForSelector('.pdp-title');

        const title = await page.locator('.pdp-name').first().innerText();
        const brand = await page.locator('.pdp-title').first().innerText();

        // Price handling
        let price = 0;
        let mrp = 0;

        try {
            const priceText = await page.locator('.pdp-price strong').first().innerText();
            price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);

            const mrpText = await page.locator('.pdp-mrp s').first().innerText();
            mrp = parseInt(mrpText.replace(/[^0-9]/g, ''), 10);
        } catch (e) {
            // Fallback if no discount
            price = mrp; // Might need refine if only one price exists
        }

        // Images - Myntra usually has a row of images
        const images = await page.locator('.image-grid-image').allAttributes('style');
        const imageUrls = images.map(style => {
            const match = style.match(/url\("(.+?)"\)/);
            return match ? match[1] : '';
        }).filter(Boolean);

        const description = await page.locator('.pdp-productDescription-content').first().innerHTML();

        return {
            url: page.url(),
            title,
            brand,
            price,
            mrp: mrp || price,
            currency: 'INR',
            images: imageUrls,
            description,
            scrapedAt: new Date().toISOString()
        };
    }
}
