export interface ScrapedProduct {
    externalId: string;
    url: string;
    brand: string;
    title: string;
    price: number;
    mrp: number;
    discount: string;
    images: string[];
    availableSizes: string[];
    description: string;
    rating: number;
    reviewCount: number;
    platform: 'Myntra';
    attributes: Record<string, unknown>;
    gender?: string;
    category?: string;
    masterCategory?: string;
    subCategory?: string;
    embedding?: number[];
    raw: unknown;
    count?: number; // Used for progress/summary
}

export interface TransformerProgress {
    status: string;
    file?: string;
    loaded: number;
    total: number;
}

export interface ModelProgressMessage {
    type: 'MODEL_PROGRESS';
    data: {
        progress: number;
        status: string;
    };
}

export interface ScrapeSuccessMessage {
    type: 'SCRAPE_SUCCESS';
    data: ScrapedProduct;
}

export interface ScrapeErrorMessage {
    type: 'SCRAPE_ERROR';
    error: string;
}

export type ExtensionMessage = ModelProgressMessage | ScrapeSuccessMessage | ScrapeErrorMessage;
