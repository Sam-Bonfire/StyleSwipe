export interface ScrapedProduct {
    url: string;
    title: string;
    brand: string;
    price: number;
    mrp: number;
    discountDisplay?: string;
    currency: string;
    images: string[];
    description?: string;
    attributes?: Record<string, string>;
    category?: string;
    availableSizes?: string[];
    rawJson?: any;
    scrapedAt: string;
}

export interface Scraper {
    matches(url: string): boolean;
    scrape(url: string): Promise<ScrapedProduct>;
    close(): Promise<void>;
}
