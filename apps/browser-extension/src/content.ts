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
    raw: unknown;
}

function extractProductData(): ScrapedProduct | null {
    console.log("[StyleSwipe] Attempting to extract product data...");

    // 1. Find the script tag containing window.__myx assignment
    const scripts = Array.from(document.querySelectorAll('script'));
    const myxScript = scripts.find(s => s.innerText.includes('window.__myx =') || s.innerText.includes('window.__myx='));

    if (!myxScript) {
        console.error("[StyleSwipe] Could not find window.__myx script in current DOM");
        return null;
    }

    // 2. Parse JSON using a more robust approach
    const content = myxScript.innerText;

    // Regex explanation:
    // window\.__myx\s*=\s* matches the start
    // (\{.*\}) matches the largest possible JSON object (greedy)
    // /s flag allows dot to match newlines
    const match = content.match(/window\.__myx\s*=\s*(\{.*\})/s);

    if (!match || !match[1]) {
        console.error("[StyleSwipe] Regex failed to extract JSON from script content");
        return null;
    }

    try {
        const rawJson = match[1].trim();
        // Remove trailing semicolon if present
        const cleanJson = rawJson.endsWith(';') ? rawJson.slice(0, -1) : rawJson;

        const data = JSON.parse(cleanJson);
        const pdpData = data.pdpData || data;

        if (!pdpData || !pdpData.id) {
            console.error("[StyleSwipe] Parsed JSON lacks pdpData or ID", data);
            return null;
        }

        console.log("[StyleSwipe] Successfully parsed PDP data for ID:", pdpData.id);

        // 3. Map to Entity (Copied logic)
        const gender = pdpData.gender || "unisex";
        const category = pdpData.analytics?.articleType || pdpData.productDetails?.title || "Default";

        return {
            myntraId: pdpData.id.toString(),
            url: window.location.href,
            brand: pdpData.brand?.name || "Unknown",
            title: pdpData.name || "Unknown Product",
            price: pdpData.price?.discounted || 0,
            mrp: pdpData.price?.mrp || 0,
            discount: pdpData.price?.discount?.label || "",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            images: pdpData.media?.albums?.[0]?.images?.map((img: any) => img.src) || [],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            availableSizes: pdpData.sizes?.map((s: any) => s.label) || [],
            description: pdpData.productDetails?.description || "",
            rating: pdpData.ratings?.averageRating || 0,
            reviewCount: pdpData.ratings?.totalCount || 0,
            platform: 'Myntra',
            attributes: {
                material: pdpData.articleAttributes?.['Fabric'] || 'N/A',
                fit: pdpData.articleAttributes?.['Fit'] || 'Regular',
                care: pdpData.articleAttributes?.['Wash Care'] || '',
                origin: pdpData.articleAttributes?.['Country of Origin'] || '',
                style: pdpData.articleAttributes?.['Style Note'] || '',
                sleeve: pdpData.articleAttributes?.['Sleeve Length'] || '',
                neck: pdpData.articleAttributes?.['Neck'] || '',
                season: pdpData.articleAttributes?.['Season'] || '',
                collection: pdpData.articleAttributes?.['Collection Name'] || '',
                occasion: pdpData.articleAttributes?.['Occasion'] || '',
                color: pdpData.baseColor || pdpData.articleAttributes?.['Color'] || '',
                ...pdpData.articleAttributes
            },
            gender: gender,
            category: category,
            raw: pdpData
        };

    } catch (e) {
        console.error("[StyleSwipe] JSON Parse or Mapping Error:", e);
        return null;
    }
}

interface ScrapedCategory {
    products: {
        myntraId: string;
        url: string;
        brand: string;
        title: string;
        price: number;
        mrp: number;
        platform: 'Myntra';
    }[];
}

function extractCategoryData(): ScrapedCategory | null {
    console.log("[StyleSwipe] Attempting to extract category data...");

    const scripts = Array.from(document.querySelectorAll('script'));
    const myxScript = scripts.find(s => s.innerText.includes('window.__myx =') || s.innerText.includes('window.__myx='));

    if (!myxScript) {
        console.error("[StyleSwipe] Could not find window.__myx script");
        return null;
    }

    const content = myxScript.innerText;
    const match = content.match(/window\.__myx\s*=\s*(\{.*\})/s);

    if (!match || !match[1]) return null;

    try {
        const rawJson = match[1].trim();
        const cleanJson = rawJson.endsWith(';') ? rawJson.slice(0, -1) : rawJson;
        const data = JSON.parse(cleanJson);

        const productsRaw = data.searchData?.results?.products;

        if (!productsRaw || !Array.isArray(productsRaw)) {
            console.error("[StyleSwipe] No products found in searchData");
            return null;
        }

        console.log(`[StyleSwipe] Found ${productsRaw.length} products on category page`);

        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            products: productsRaw.map((p: any) => ({
                myntraId: p.productId.toString(),
                url: `https://www.myntra.com/${p.landingPageUrl}`,
                brand: p.brand,
                title: p.productName,
                price: p.price,
                mrp: p.mrp,
                images: p.searchImage ? [p.searchImage] : [],
                platform: 'Myntra'
            }))
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

        sendResponse({
            type: hasPdpData ? 'pdp' : (hasSearchData ? 'category' : 'unknown'),
            url: window.location.href
        });
        return true;
    }

    if (request.type === "SCRAPE_CURRENT_PAGE") {
        const product = extractProductData();
        if (product) {
            console.log("[StyleSwipe] Product extracted, sending to background...");
            chrome.runtime.sendMessage({
                type: "SAVE_PRODUCT",
                data: product
            }, (response) => {
                const err = chrome.runtime.lastError;
                if (err) {
                    sendResponse({ success: false, error: "Background sync failed: " + err.message });
                } else {
                    sendResponse(response);
                }
            });
            return true;
        } else {
            sendResponse({ success: false, error: "Extraction failed." });
        }
    }

    if (request.type === "SCRAPE_CATEGORY_PAGE") {
        const categoryData = extractCategoryData();
        if (categoryData && categoryData.products.length > 0) {
            console.log(`[StyleSwipe] Sending ${categoryData.products.length} products to background...`);
            chrome.runtime.sendMessage({
                type: "SAVE_BATCH",
                data: categoryData.products
            }, (response) => {
                sendResponse(response);
            });
            return true;
        } else {
            sendResponse({ success: false, error: "No products found to scrape." });
        }
    }
});
