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

// Helper to request data from Main World script
function getPdpDataFromMainWorld(): Promise<any> {
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

function mapToScrapedProduct(data: any): ScrapedProduct {
    const myntraId = (data.id || data.productId).toString();
    const gender = data.gender || data.core?.gender || "";
    const title = data.name || data.productName || data.product || "";
    const brand = data.brand?.name || data.brand || "";

    const price = data.price?.discounted || (typeof data.price === 'number' ? data.price : (data.price?.discountedPrice || 0));
    const mrp = data.price?.mrp || data.mrp || (typeof data.price === 'number' ? data.price : (data.price?.mrp || 0));
    const discount = data.price?.discount?.label || data.discountDisplayLabel || data.discount || "";

    // Images: remove ($size_representation$)
    const cleanImageUrl = (url: string) => url.replace(/\(\$size_representation\$\)/g, "").replace(/\$quality\$/g, "90");

    let images: string[] = [];
    if (data.media?.albums) {
        images = data.media.albums.flatMap((album: any) => album.images?.map((img: any) => cleanImageUrl(img.src)));
    } else if (data.images && Array.isArray(data.images)) {
        images = data.images.map((img: any) => cleanImageUrl(typeof img === 'string' ? img : (img.src || img.view || img.srcUrl || "")));
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
            .filter((i: any) => i.available || (i.inventory && i.inventory > 0))
            .map((i: any) => i.brandSizeLabel || i.label);
    } else if (data.sizes) {
        if (Array.isArray(data.sizes)) {
            availableSizes = data.sizes.map((s: any) => s.label || s);
        } else if (typeof data.sizes === 'string') {
            availableSizes = (data.sizes as string).split(',');
        }
    }

    // Attributes
    const attributesRaw: Record<string, any> = {
        ...data.articleAttributes,
    };

    // Helper to merge attributes from various array or object formats
    const mergeAttrs = (source: any) => {
        if (!source) return;
        if (Array.isArray(source)) {
            source.forEach((attr: any) => {
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
        description = data.productDetails.find((s: any) => s.title?.toLowerCase().includes("product details"))?.description || "";
    } else if (data.productDetails?.description) {
        description = data.productDetails.description;
    } else if (data.description) {
        description = data.description;
    }

    // Check all descriptors
    if (!description && Array.isArray(data.productDescriptors)) {
        const descObj = data.productDescriptors.find((d: any) =>
            d.title?.toLowerCase().includes("description") || d.title?.toLowerCase().includes("details")
        );
        description = descObj?.description || "";
    }

    if (!description && data.productDescriptors?.description) {
        description = data.productDescriptors.description;
    }

    // Final fallback to raw attributes summary if available
    if (!description && attributesRaw['Style Note']) {
        description = attributesRaw['Style Note'];
    }

    // Category
    const categoryRaw = data.analytics?.articleType || data.articleType || data.category || "";
    const category = typeof categoryRaw === 'string' ? categoryRaw : (categoryRaw.typeName || categoryRaw.name || "");

    // Detailed Category Hierarchy
    const masterCategoryRaw = data.analytics?.masterCategory || data.masterCategory || "";
    const masterCategory = typeof masterCategoryRaw === 'string' ? masterCategoryRaw : (masterCategoryRaw.typeName || masterCategoryRaw.name || "");

    const subCategoryRaw = data.analytics?.subCategory || data.subCategory || "";
    const subCategory = typeof subCategoryRaw === 'string' ? subCategoryRaw : (subCategoryRaw.typeName || subCategoryRaw.name || "");

    return {
        myntraId,
        url: window.location.href.includes(myntraId) ? window.location.href : `https://www.myntra.com/${data.landingPageUrl || myntraId}`,
        brand,
        title,
        price: typeof price === 'object' ? (price.discounted || 0) : price,
        mrp: typeof mrp === 'object' ? (mrp.mrp || 0) : mrp,
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
        let data: any = fullData.pdpData;
        if (!data || !data.id) {
            if (fullData.plaproduct && fullData.plaproduct.id) data = fullData.plaproduct;
            else if (fullData.searchData?.results?.products?.[0]) data = fullData.searchData.results.products[0];
            else if (Array.isArray(fullData.products) && fullData.products.length > 0) data = fullData.products[0];
        }

        if (!data || (!data.id && !data.productId)) {
            if (fullData.pdpData?.pdpData) data = fullData.pdpData.pdpData;
            else return null;
        }

        return mapToScrapedProduct(data);
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
