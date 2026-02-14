import { describe, it, expect } from 'bun:test';

import { MyntraAPIScraper } from '../../src/scrapers/MyntraAPIScraper';

describe('MyntraAPIScraper', () => {
    const scraper: MyntraAPIScraper = new MyntraAPIScraper();

    describe('init / close', () => {
        it('should initialize without error', async () => {
            await expect(scraper.init()).resolves.toBeUndefined();
        });

        it('should close without error', async () => {
            await expect(scraper.close()).resolves.toBeUndefined();
        });
    });

    describe('scrapeProduct', () => {
        it('should return null for non-matching URLs', async () => {
            const result = await scraper.scrapeProduct('https://www.myntra.com/shirts');
            expect(result).toBeNull();
        });

        it('should return null for URLs without /buy pattern', async () => {
            const result = await scraper.scrapeProduct('https://www.myntra.com/shirts/brand/model/12345');
            expect(result).toBeNull();
        });
    });
});
