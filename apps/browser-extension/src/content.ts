/// <reference types="chrome" />

// Reusing logic from MyntraScraper.ts but adapted for Browser Extension

interface ScrapedProduct {
    myntraId: string;
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
    raw: unknown;
}

interface MyntraImage {
    src: string;
    view?: string;
    srcUrl?: string;
}

interface MyntraAlbum {
    images?: MyntraImage[];
}

interface MyntraInventory {
    label: string;
    available?: boolean;
    inventory?: number;
    brandSizeLabel?: string;
}

interface MyntraAttribute {
    attribute?: string;
    name?: string;
    key?: string;
    title?: string;
    value?: string | number | boolean;
    description?: string;
    label?: string;
}

interface MyntraDescriptor {
    title?: string;
    description?: string;
}

interface MyntraRawData {
    id?: string | number;
    productId?: string | number;
    gender?: string;
    core?: { gender?: string };
    name?: string;
    productName?: string;
    product?: string;
    brand?: { name?: string } | string;
    price?: {
        discounted?: number;
        mrp?: number;
        discount?: { label?: string };
        discountedPrice?: number;
    } | number;
    mrp?: number;
    discountDisplayLabel?: string;
    discount?: string;
    media?: { albums?: MyntraAlbum[] };
    images?: (string | MyntraImage)[];
    searchImage?: string;
    image?: string;
    inventoryInfo?: MyntraInventory[];
    style?: { inventoryInfo?: MyntraInventory[] };
    sizes?: string | MyntraAttribute[];
    articleAttributes?: Record<string, string | number | boolean>;
    productAttributes?: MyntraAttribute[] | Record<string, string | number | boolean>;
    attributes?: MyntraAttribute[] | Record<string, string | number | boolean>;
    productDetails?: MyntraDescriptor[] | { description?: string };
    description?: string;
    productDescriptors?: MyntraDescriptor[] | { description?: string };
    analytics?: {
        articleType?: string | { typeName?: string; name?: string };
        masterCategory?: string | { typeName?: string; name?: string };
        subCategory?: string | { typeName?: string; name?: string };
    };
    articleType?: string | { typeName?: string; name?: string };
    category?: string | { typeName?: string; name?: string };
    masterCategory?: string | { typeName?: string; name?: string };
    subCategory?: string | { typeName?: string; name?: string };
    ratings?: { averageRating?: number; totalCount?: number };
    rating?: number;
    reviews?: number;
    ratingCount?: number;
    pdpData?: MyntraRawData;
    landingPageUrl?: string;
    primaryColor?: string;
    primaryColour?: string;
    baseColor?: string;
    baseColour?: string;
}

interface FullData {
    pdpData?: MyntraRawData;
    plaproduct?: MyntraRawData;
    products?: MyntraRawData[];
    searchData?: {
        results?: {
            products?: MyntraRawData[];
        }
    };
}

// Helper to request data from Main World script
function getPdpDataFromMainWorld(): Promise<FullData> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            window.removeEventListener('message', listener);
            reject(new Error("Timeout waiting for Main World data"));
        }, 3000);

        const listener = (event: MessageEvent) => {
            if (event.source !== window || !event.data || event.data.type !== 'STYLESWIPE_Data_Response') return;

            clearTimeout(timeout);
            window.removeEventListener('message', listener);
            resolve(event.data.data);
        };

        window.addEventListener('message', listener);
        // Trigger the Main World script to send data
        window.postMessage({ type: 'STYLESWIPE_Data_Request' }, '*');
    });
}

function mapToScrapedProduct(data: MyntraRawData): ScrapedProduct {
    const myntraId = (data.id?.toString() || data.productId?.toString() || "").toString();
    const gender = data.gender || data.core?.gender || "";
    const title = data.name || data.productName || data.product || "";
    const brandRaw = data.brand;
    const brand = typeof brandRaw === 'object' ? (brandRaw?.name || "") : (brandRaw || "");

    const priceObj = typeof data.price === 'object' ? data.price : null;
    const priceNum = typeof data.price === 'number' ? data.price : 0;
    const price = priceObj?.discounted || priceObj?.discountedPrice || priceNum || 0;

    const mrp = priceObj?.mrp || data.mrp || priceNum || 0;
    const discount = priceObj?.discount?.label || data.discountDisplayLabel || data.discount || "";

    // Images: remove ($size_representation$)
    const cleanImageUrl = (url: string) => url.replace(/\(\$size_representation\$\)/g, "").replace(/\$quality\$/g, "90");

    let images: string[] = [];
    if (data.media?.albums) {
        images = data.media.albums.flatMap((album: MyntraAlbum) => album.images?.map((img: MyntraImage) => cleanImageUrl(img.src)) || []);
    } else if (data.images && Array.isArray(data.images)) {
        images = data.images.map((img: string | MyntraImage) => cleanImageUrl(typeof img === 'string' ? img : (img.src || img.view || img.srcUrl || "")));
    } else if (data.searchImage) {
        images = [cleanImageUrl(data.searchImage)];
    } else if (data.image) {
        images = [cleanImageUrl(data.image)];
    }

    // Sizes: Priority to inventoryInfo
    let availableSizes: string[] = [];
    const invInfo = data.inventoryInfo || data.style?.inventoryInfo;
    if (invInfo && Array.isArray(invInfo)) {
        availableSizes = invInfo
            .filter((i: MyntraInventory) => i.available || (i.inventory && i.inventory > 0))
            .map((i: MyntraInventory) => i.brandSizeLabel || i.label);
    } else if (data.sizes) {
        if (Array.isArray(data.sizes)) {
            availableSizes = (data.sizes as MyntraAttribute[]).map((s: MyntraAttribute) => (s.label || s).toString());
        } else if (typeof data.sizes === 'string') {
            availableSizes = (data.sizes as string).split(',');
        }
    }

    // Attributes
    const attributesRaw: Record<string, unknown> = {
        ...data.articleAttributes,
    };

    // Helper to merge attributes from various array or object formats
    const mergeAttrs = (source: MyntraAttribute[] | Record<string, string | number | boolean> | undefined) => {
        if (!source) return;
        if (Array.isArray(source)) {
            source.forEach((attr: MyntraAttribute) => {
                const key = attr.attribute || attr.name || attr.key || attr.title;
                const val = attr.value || attr.description || attr.label;
                if (key && val) {
                    // Don't save Deal of the day attributes
                    if (key.toLowerCase().includes("deal of the day") || val.toString().toLowerCase().includes("deal of the day")) return;
                    attributesRaw[key] = val;
                }
            });
        } else if (typeof source === 'object') {
            Object.entries(source).forEach(([key, val]) => {
                if (key.toLowerCase().includes("deal of the day") || (val && val.toString().toLowerCase().includes("deal of the day"))) return;
                attributesRaw[key] = val;
            });
        }
    };

    mergeAttrs(data.productAttributes);
    mergeAttrs(data.attributes);

    // Description
    let description = "";
    if (Array.isArray(data.productDetails)) {
        description = (data.productDetails as MyntraDescriptor[]).find((s: MyntraDescriptor) => s.title?.toLowerCase().includes("product details"))?.description || "";
    } else if (data.productDetails && (data.productDetails as { description?: string }).description) {
        description = (data.productDetails as { description?: string }).description || "";
    } else if (data.description) {
        description = data.description;
    }

    // Check all descriptors
    if (!description && Array.isArray(data.productDescriptors)) {
        const descObj = (data.productDescriptors as MyntraDescriptor[]).find((d: MyntraDescriptor) =>
            d.title?.toLowerCase().includes("description") || d.title?.toLowerCase().includes("details")
        );
        description = descObj?.description || "";
    }

    if (!description && data.productDescriptors && !Array.isArray(data.productDescriptors)) {
        description = (data.productDescriptors as { description?: string }).description || "";
    }

    // Final fallback to raw attributes summary if available
    if (!description && typeof attributesRaw['Style Note'] === 'string') {
        description = attributesRaw['Style Note'];
    }

    // Category
    const categoryRaw = data.analytics?.articleType || data.articleType || data.category || "";
    const category = typeof categoryRaw === 'string' ? categoryRaw : (categoryRaw?.typeName || categoryRaw?.name || "");

    // Detailed Category Hierarchy
    const masterCategoryRaw = data.analytics?.masterCategory || data.masterCategory || "";
    const masterCategory = typeof masterCategoryRaw === 'string' ? masterCategoryRaw : (masterCategoryRaw?.typeName || masterCategoryRaw?.name || "");

    const subCategoryRaw = data.analytics?.subCategory || data.subCategory || "";
    const subCategory = typeof subCategoryRaw === 'string' ? subCategoryRaw : (subCategoryRaw?.typeName || subCategoryRaw?.name || "");

    return {
        myntraId,
        url: window.location.href.includes(myntraId) ? window.location.href : `https://www.myntra.com/${data.landingPageUrl || myntraId}`,
        brand,
        title,
        price,
        mrp,
        discount,
        images,
        availableSizes,
        description,
        rating: data.ratings?.averageRating || data.rating || 0,
        reviewCount: data.ratings?.totalCount || data.reviews || data.ratingCount || 0,
        platform: 'Myntra' as const,
        attributes: {
            material: attributesRaw['Fabric'] || attributesRaw['Material'] || attributesRaw['Fabric 1'] || '',
            fit: attributesRaw['Fit'] || attributesRaw['Pattern'] || '',
            care: attributesRaw['Wash Care'] || attributesRaw['Care Instruction'] || '',
            color: data.primaryColor || data.primaryColour || data.baseColor || data.baseColour || attributesRaw['Color'] || attributesRaw['Colour'] || '',
            size: availableSizes,
            inventoryInfo: invInfo,
            masterCategory,
            subCategory,
            ...attributesRaw
        },
        gender: gender.toLowerCase(),
        category,
        masterCategory,
        subCategory,
        raw: data
    };
}

async function extractProductData(): Promise<ScrapedProduct | null> {
    console.log("[StyleSwipe] Requesting product data from Main World...");

    try {
        const fullData = await getPdpDataFromMainWorld();

        // Prioritize data sources
        let data: MyntraRawData | undefined = fullData.pdpData;
        if (!data || !data.id) {
            if (fullData.plaproduct && fullData.plaproduct.id) data = fullData.plaproduct;
            else if (fullData.searchData?.results?.products?.[0]) data = fullData.searchData.results.products[0];
            else if (Array.isArray(fullData.products) && fullData.products.length > 0) data = fullData.products[0];
        }

        if (!data || (!data.id && !data.productId)) {
            if (fullData.pdpData?.pdpData) {
                data = fullData.pdpData.pdpData;
            } else {
                return null;
            }
        }

        return mapToScrapedProduct(data as MyntraRawData);
    } catch (e) {
        console.error("[StyleSwipe] Extraction Logic Error:", e);
        return null;
    }
}

interface ScrapedCategory {
    products: ScrapedProduct[];
}

async function extractCategoryData(): Promise<ScrapedCategory | null> {
    console.log("[StyleSwipe] Attempting to extract category data from Main World...");

    try {
        const fullData = await getPdpDataFromMainWorld();
        const productsRaw = fullData.searchData?.results?.products || fullData.products;

        if (!productsRaw || !Array.isArray(productsRaw)) return null;

        console.log(`[StyleSwipe] Found ${productsRaw.length} products on category page`);

        return {
            products: productsRaw.map(p => mapToScrapedProduct(p))
        };
    } catch (e) {
        console.error("[StyleSwipe] Category extraction failed:", e);
        return null;
    }
}

// Listen for messages from Popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    console.log("[StyleSwipe] Message received in content script:", request.type);

    if (request.type === "GET_PAGE_INFO") {
        const scriptTags = Array.from(document.querySelectorAll('script'));
        const hasPdpData = scriptTags.some(s => s.innerText.includes('"pdpData"'));
        const hasSearchData = scriptTags.some(s => s.innerText.includes('"searchData"'));
        sendResponse({ type: hasPdpData ? 'pdp' : (hasSearchData ? 'category' : 'unknown'), url: window.location.href });
        return true;
    }

    if (request.type === "SCRAPE_CURRENT_PAGE") {
        extractProductData().then(product => {
            if (product) chrome.runtime.sendMessage({ type: "SAVE_PRODUCT", data: product }, (response) => sendResponse(response));
            else sendResponse({ success: false, error: "Extraction failed." });
        });
        return true;
    }

    if (request.type === "SCRAPE_CATEGORY_PAGE") {
        extractCategoryData().then(categoryData => {
            if (categoryData && categoryData.products.length > 0) chrome.runtime.sendMessage({ type: "SAVE_BATCH", data: categoryData.products }, (response) => sendResponse(response));
            else sendResponse({ success: false, error: "No products found." });
        });
        return true;
    }
});
