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
  embedding?: number[];
  embeddingVersions?: {
    v1: number[];
    v2?: number[];
  };
}

export interface Scraper {
  matches(url: string): boolean;
  scrape(url: string): Promise<ScrapedProduct>;
  close(): Promise<void>;
}
