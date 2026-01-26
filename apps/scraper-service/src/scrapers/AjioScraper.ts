import { Page } from 'playwright';

import { BaseScraper } from '../BaseScraper.js';
import { ScrapedProduct } from '../types.js';

export class AjioScraper extends BaseScraper {
    protected platformName = 'Ajio';

    matches(url: string): boolean {
        return url.includes('ajio.com');
    }

    protected async extractProduct(page: Page): Promise<ScrapedProduct> {
        await page.waitForSelector('h1.prod-name');

        const title = await page.locator('h1.prod-name').first().innerText();
        const brand = await page.locator('h2.brand-name').first().innerText();

        const priceText = await page.locator('.prod-sp').first().innerText();
        const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);

        let mrp = price;
        try {
            const mrpText = await page.locator('.prod-cp').first().innerText();
            mrp = parseInt(mrpText.replace(/[^0-9]/g, ''), 10);
        } catch (e) {
            // No MRP override
        }

        // Images
        const imageElements = await page.locator('.img-container img').all();
        const imageUrls = await Promise.all(imageElements.map(img => img.getAttribute('src')));

        const cleanImages = imageUrls.filter((src): src is string => !!src);

        return {
            url: page.url(),
            title,
            brand,
            price,
            mrp,
            currency: 'INR',
            images: cleanImages,
            scrapedAt: new Date().toISOString()
        };
    }
}
