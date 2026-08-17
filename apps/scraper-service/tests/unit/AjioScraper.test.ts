import { describe, expect, it, test, vi as mock, beforeEach, afterEach, vi } from 'vitest';

import { AjioScraper } from '../../src/scrapers/AjioScraper';

// AjioScraper requires playwright for scraping, but `matches()` is pure logic
// We instantiate it but only test the matches method
describe('AjioScraper', () => {
    const scraper = new AjioScraper();

    describe('matches', () => {
        it('should match ajio.com URLs', () => {
            expect(scraper.matches('https://www.ajio.com/some-product/p/123')).toBe(true);
        });

        it('should match ajio.com without www', () => {
            expect(scraper.matches('https://ajio.com/product/p/456')).toBe(true);
        });

        it('should match ajio.com with path', () => {
            expect(scraper.matches('https://www.ajio.com/levis/shirt/p/789?s=m')).toBe(true);
        });

        it('should not match myntra.com URLs', () => {
            expect(scraper.matches('https://www.myntra.com/shirts')).toBe(false);
        });

        it('should not match other domains', () => {
            expect(scraper.matches('https://www.amazon.in/dp/B123')).toBe(false);
        });

        it('should not match empty string', () => {
            expect(scraper.matches('')).toBe(false);
        });
    });
});
