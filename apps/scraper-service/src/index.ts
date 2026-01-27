import { AjioScraper } from './scrapers/AjioScraper.js';
import { MyntraScraper } from './scrapers/MyntraScraper.js';

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Usage: bun run src/index.ts <url>');
        process.exit(1);
    }

    const url = args[0];
    const scrapers = [new MyntraScraper(), new AjioScraper()];

    const scraper = scrapers.find(s => s.matches(url));

    if (!scraper) {
        console.error('No matching scraper found for URL:', url);
        process.exit(1);
    }

    try {
        const product = await scraper.scrape(url);
        console.log(JSON.stringify(product, null, 2));
    } catch (error) {
        console.error('Scrape failed:', error);
        process.exit(1);
    }
}

main();
