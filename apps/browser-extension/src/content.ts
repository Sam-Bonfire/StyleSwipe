/// <reference types="chrome" />

// Reusing logic from MyntraScraper.ts but adapted for Browser Extension

import { ScrapedProduct, TransformerProgress } from './types';

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
  price?:
    | {
        discounted?: number;
        mrp?: number;
        discount?: { label?: string };
        discountedPrice?: number;
      }
    | number;
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
    };
  };
}

// Helper to request data from Main World script
function getPdpDataFromMainWorld(): Promise<FullData> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener('message', listener);
      reject(new Error('Timeout waiting for Main World data'));
    }, 3000);

    const listener = (event: MessageEvent) => {
      if (event.source !== window || !event.data || event.data.type !== 'STYLESWIPE_Data_Response')
        return;

      clearTimeout(timeout);
      window.removeEventListener('message', listener);
      resolve(event.data.data);
    };

    window.addEventListener('message', listener);
    // Trigger the Main World script to send data
    window.postMessage({ type: 'STYLESWIPE_Data_Request' }, '*');
  });
}

function mapToScrapedProduct(data: MyntraRawData, embedding?: number[]): ScrapedProduct {
  const externalId = (data.id?.toString() || data.productId?.toString() || '').toString();
  const gender = data.gender || data.core?.gender || '';
  const title = data.name || data.productName || data.product || '';
  const brandRaw = data.brand;
  const brand = typeof brandRaw === 'object' ? brandRaw?.name || '' : brandRaw || '';

  const priceObj = typeof data.price === 'object' ? data.price : null;
  const priceNum = typeof data.price === 'number' ? data.price : 0;
  const price = priceObj?.discounted || priceObj?.discountedPrice || priceNum || 0;

  const mrp = priceObj?.mrp || data.mrp || priceNum || 0;
  const discount = priceObj?.discount?.label || data.discountDisplayLabel || data.discount || '';

  // Images: remove ($size_representation$)
  const cleanImageUrl = (url: string) =>
    url.replace(/\(\$size_representation\$\)/g, '').replace(/\$quality\$/g, '90');

  let images: string[] = [];
  if (data.media?.albums) {
    images = data.media.albums.flatMap(
      (album: MyntraAlbum) => album.images?.map((img: MyntraImage) => cleanImageUrl(img.src)) || [],
    );
  } else if (data.images && Array.isArray(data.images)) {
    images = data.images.map((img: string | MyntraImage) =>
      cleanImageUrl(typeof img === 'string' ? img : img.src || img.view || img.srcUrl || ''),
    );
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
      availableSizes = (data.sizes as MyntraAttribute[]).map((s: MyntraAttribute) =>
        (s.label || s).toString(),
      );
    } else if (typeof data.sizes === 'string') {
      availableSizes = (data.sizes as string).split(',');
    }
  }

  // Attributes
  const attributesRaw: Record<string, unknown> = {
    ...data.articleAttributes,
  };

  // Helper to merge attributes from various array or object formats
  const mergeAttrs = (
    source: MyntraAttribute[] | Record<string, string | number | boolean> | undefined,
  ) => {
    if (!source) return;
    if (Array.isArray(source)) {
      source.forEach((attr: MyntraAttribute) => {
        const key = attr.attribute || attr.name || attr.key || attr.title;
        const val = attr.value || attr.description || attr.label;
        if (key && val) {
          // Don't save Deal of the day attributes
          if (
            key.toLowerCase().includes('deal of the day') ||
            val.toString().toLowerCase().includes('deal of the day')
          )
            return;
          attributesRaw[key] = val;
        }
      });
    } else if (typeof source === 'object') {
      Object.entries(source).forEach(([key, val]) => {
        if (
          key.toLowerCase().includes('deal of the day') ||
          (val && val.toString().toLowerCase().includes('deal of the day'))
        )
          return;
        attributesRaw[key] = val;
      });
    }
  };

  mergeAttrs(data.productAttributes);
  mergeAttrs(data.attributes);

  // Description
  let description = '';
  if (Array.isArray(data.productDetails)) {
    description =
      (data.productDetails as MyntraDescriptor[]).find((s: MyntraDescriptor) =>
        s.title?.toLowerCase().includes('product details'),
      )?.description || '';
  } else if (data.productDetails && (data.productDetails as { description?: string }).description) {
    description = (data.productDetails as { description?: string }).description || '';
  } else if (data.description) {
    description = data.description;
  }

  // Check all descriptors
  if (!description && Array.isArray(data.productDescriptors)) {
    const descObj = (data.productDescriptors as MyntraDescriptor[]).find(
      (d: MyntraDescriptor) =>
        d.title?.toLowerCase().includes('description') ||
        d.title?.toLowerCase().includes('details'),
    );
    description = descObj?.description || '';
  }

  if (!description && data.productDescriptors && !Array.isArray(data.productDescriptors)) {
    description = (data.productDescriptors as { description?: string }).description || '';
  }

  // Final fallback to raw attributes summary if available
  if (!description && typeof attributesRaw['Style Note'] === 'string') {
    description = attributesRaw['Style Note'];
  }

  // Category
  const categoryRaw = data.analytics?.articleType || data.articleType || data.category || '';
  const category =
    typeof categoryRaw === 'string'
      ? categoryRaw
      : categoryRaw?.typeName || categoryRaw?.name || '';

  // Detailed Category Hierarchy
  const masterCategoryRaw = data.analytics?.masterCategory || data.masterCategory || '';
  const masterCategory =
    typeof masterCategoryRaw === 'string'
      ? masterCategoryRaw
      : masterCategoryRaw?.typeName || masterCategoryRaw?.name || '';

  const subCategoryRaw = data.analytics?.subCategory || data.subCategory || '';
  const subCategory =
    typeof subCategoryRaw === 'string'
      ? subCategoryRaw
      : subCategoryRaw?.typeName || subCategoryRaw?.name || '';

  return {
    externalId,
    url: window.location.href.includes(externalId)
      ? window.location.href
      : `https://www.myntra.com/${data.landingPageUrl || externalId}`,
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
      material:
        attributesRaw['Fabric'] || attributesRaw['Material'] || attributesRaw['Fabric 1'] || '',
      fit: attributesRaw['Fit'] || attributesRaw['Pattern'] || '',
      care: attributesRaw['Wash Care'] || attributesRaw['Care Instruction'] || '',
      color:
        data.primaryColor ||
        data.primaryColour ||
        data.baseColor ||
        data.baseColour ||
        attributesRaw['Color'] ||
        attributesRaw['Colour'] ||
        '',
      size: availableSizes,
      inventoryInfo: invInfo,
      masterCategory,
      subCategory,
      ...attributesRaw,
    },
    gender: gender.toLowerCase(),
    category,
    masterCategory,
    subCategory,
    embedding: embedding || [],
    raw: data,
  };
}

class ProgressUI {
  private element: HTMLDivElement | null = null;
  private progressInner: HTMLDivElement | null = null;
  private statusText: HTMLDivElement | null = null;

  show(status: string) {
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.id = 'styleswipe-progress-toast';
      this.element.innerHTML = `
                <div class="ss-toast-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                    <span>StyleSwipe Neural Engine</span>
                </div>
                <div class="ss-status-row">
                    <span id="ss-status-text">${status}</span>
                </div>
                <div class="ss-progress-bar">
                    <div id="ss-progress-inner" style="width: 0%"></div>
                </div>
            `;
      document.body.appendChild(this.element);
      this.progressInner = this.element.querySelector('#ss-progress-inner');
      this.statusText = this.element.querySelector('#ss-status-text');

      // Add styles dynamically
      const style = document.createElement('style');
      style.textContent = `
                #styleswipe-progress-toast {
                    position: fixed !important;
                    bottom: 24px !important;
                    right: 24px !important;
                    width: 280px !important;
                    background: rgba(10, 10, 10, 0.95) !important;
                    backdrop-filter: blur(12px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.15) !important;
                    border-radius: 12px !important;
                    padding: 16px !important;
                    color: white !important;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                    z-index: 2147483647 !important;
                    box-shadow: 0 12px 32px rgba(0,0,0,0.6) !important;
                    animation: ss-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
                .ss-toast-header {
                    display: flex !important;
                    align-items: center !important;
                    gap: 10px !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.1em !important;
                    color: #9CA3AF !important;
                    margin-bottom: 12px !important;
                }
                .ss-toast-header svg {
                    color: #3B82F6 !important;
                }
                .ss-status-row {
                    font-size: 14px !important;
                    font-weight: 600 !important;
                    margin-bottom: 12px !important;
                    color: #F3F4F6 !important;
                }
                .ss-progress-bar {
                    height: 6px !important;
                    background: rgba(255, 255, 255, 0.1) !important;
                    border-radius: 3px !important;
                    overflow: hidden !important;
                }
                #ss-progress-inner {
                    height: 100% !important;
                    background: linear-gradient(90deg, #3B82F6, #8B5CF6) !important;
                    transition: width 0.3s ease !important;
                    box-shadow: 0 0 8px rgba(59, 130, 246, 0.5) !important;
                }
                @keyframes ss-slide-in {
                    from { transform: translateY(30px) scale(0.95); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
            `;
      document.head.appendChild(style);
    }
    if (this.statusText) this.statusText.innerText = status;

    // Ensure popup knows we are initializing
    this.update(0, status);
  }

  update(progress: number, status?: string) {
    if (!this.element) this.show(status || 'Loading...');
    if (this.progressInner) this.progressInner.style.width = `${progress}%`;
    if (status && this.statusText) this.statusText.innerText = status;

    // Notify popup if listeners exist
    chrome.runtime
      .sendMessage({
        type: 'MODEL_PROGRESS',
        data: { progress, status: status || 'Downloading...' },
      })
      .catch(() => {
        // Popup might be closed, ignore
      });
  }

  hide() {
    if (this.element) {
      this.element.style.opacity = '0';
      this.element.style.transform = 'translateY(10px)';
      this.element.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        this.element?.remove();
        this.element = null;
      }, 300);
    }
  }
}

const progressUI = new ProgressUI();

async function extractProductData(): Promise<ScrapedProduct | null> {
  try {
    console.log('[StyleSwipe] Extracting raw data from main world...');

    const fullData = await getPdpDataFromMainWorld();

    // Prioritize data sources
    let data: MyntraRawData | undefined = fullData.pdpData;
    if (!data || !data.id) {
      if (fullData.plaproduct && fullData.plaproduct.id) data = fullData.plaproduct;
      else if (fullData.searchData?.results?.products?.[0])
        data = fullData.searchData.results.products[0];
      else if (Array.isArray(fullData.products) && fullData.products.length > 0)
        data = fullData.products[0];
    }

    if (!data || (!data.id && !data.productId)) {
      if (fullData.pdpData?.pdpData) {
        data = fullData.pdpData.pdpData;
      } else {
        throw new Error('Could not find product data. Are you on a Myntra product page?');
      }
    }

    // Generate Embedding
    let embedding: number[] | undefined;
    try {
      const { VectorizationService } = await import('./VectorizationService');

      progressUI.show('Initializing Neural Engine...');

      const vectorizer = await VectorizationService.getInstance((progress: TransformerProgress) => {
        if (progress.status === 'progress' || progress.status === 'download') {
          if (progress.total && !isNaN(progress.total)) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            progressUI.update(percent, `Downloading Model (${percent}%)`);
          } else {
            // Fallback for missing Content-Length: show MBs
            const mb = (progress.loaded / (1024 * 1024)).toFixed(1);
            progressUI.update(0, `Downloading Model (${mb}MB)...`);
          }
        } else if (progress.status === 'ready' || progress.status === 'done') {
          progressUI.update(100, 'Neural Model Ready');
        } else if (progress.status === 'initiate') {
          progressUI.update(0, `Downloading ${progress.file || 'model'}...`);
        }
      });

      // Format: "Title Brand Description Attributes"
      const textToEmbed =
        `${data.name || data.productName} ${typeof data.brand === 'object' ? data.brand?.name : data.brand} ${data.description || ''} ${JSON.stringify(data.articleAttributes || {})}`.trim();

      progressUI.update(100, 'Generating Embedding...');
      embedding = await vectorizer.generateEmbedding(textToEmbed);
      console.log('[StyleSwipe] Client-side embedding generated (dim: ' + embedding.length + ')');

      progressUI.update(100, 'Optimization Complete');
      setTimeout(() => progressUI.hide(), 1500);
    } catch (err: unknown) {
      console.error('[StyleSwipe] Vectorization failed:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      const errorMsg = `Neural Engine Error: ${msg}`;
      progressUI.update(0, errorMsg);
      chrome.runtime.sendMessage({ type: 'SCRAPE_ERROR', error: errorMsg });
      setTimeout(() => progressUI.hide(), 3000);
      throw err;
    }

    return mapToScrapedProduct(data as MyntraRawData, embedding);
  } catch (e: unknown) {
    console.error('[StyleSwipe] Extraction Logic Error:', e);
    throw e;
  }
}

interface ScrapedCategory {
  products: ScrapedProduct[];
}

async function extractCategoryData(): Promise<ScrapedCategory | null> {
  console.log('[StyleSwipe] Attempting to extract category data from Main World...');

  try {
    const fullData = await getPdpDataFromMainWorld();
    const productsRaw = fullData.searchData?.results?.products || fullData.products;

    if (!productsRaw || !Array.isArray(productsRaw)) {
      throw new Error('No products found on this page.');
    }

    console.log(`[StyleSwipe] Found ${productsRaw.length} products on category page`);

    const total = productsRaw.length;
    progressUI.show(`Initializing Batch Processor for ${total} products...`);

    const { VectorizationService } = await import('./VectorizationService');
    const vectorizer = await VectorizationService.getInstance((progress: TransformerProgress) => {
      if (progress.status === 'progress' || progress.status === 'download') {
        if (progress.total && !isNaN(progress.total)) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          progressUI.update(percent, `Downloading Model (${percent}%)`);
        } else {
          const mb = (progress.loaded / (1024 * 1024)).toFixed(1);
          progressUI.update(0, `Downloading Model (${mb}MB)...`);
        }
      }
    });

    const productsMap = new Map<string, ScrapedProduct>();

    for (let i = 0; i < productsRaw.length; i++) {
      const data = productsRaw[i];
      const currentNum = i + 1;
      const overallPercent = Math.round((currentNum / total) * 100);

      progressUI.update(overallPercent, `Processing Neural Metadata ${currentNum}/${total}...`);

      // Generate Embedding for this item
      let embedding: number[] | undefined;
      try {
        // Simplified text for batch embedding to speed up
        const textToEmbed = `${data.name || data.productName || ''} ${data.brand || ''}`.trim();
        embedding = await vectorizer.generateEmbedding(textToEmbed);
      } catch (err) {
        console.error(`[StyleSwipe] Batch embedding failed for item ${i}:`, err);
      }

      const product = mapToScrapedProduct(data as MyntraRawData, embedding);
      if (product.externalId) {
        productsMap.set(product.externalId, product);
      } else {
        console.warn(`[StyleSwipe] Skipping item at index ${i} due to missing ID`);
      }
    }

    const products = Array.from(productsMap.values());
    console.log(
      `[StyleSwipe] Final batch size: ${products.length} (deduplicated from ${productsRaw.length})`,
    );

    progressUI.update(100, `Complete: ${products.length} Products Processed`);
    setTimeout(() => progressUI.hide(), 1500);

    return { products };
  } catch (e: unknown) {
    console.error('[StyleSwipe] Category extraction failed:', e);
    const msg = e instanceof Error ? e.message : 'Category extraction failed.';
    const error = msg;
    progressUI.update(0, error);
    chrome.runtime.sendMessage({ type: 'SCRAPE_ERROR', error });
    setTimeout(() => progressUI.hide(), 3000);
    throw e;
  }
}

// Listen for messages from Popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('[StyleSwipe] Message received in content script:', request.type);

  if (request.type === 'GET_PAGE_INFO') {
    const scriptTags = Array.from(document.querySelectorAll('script'));
    const hasPdpData = scriptTags.some((s) => s.innerText.includes('"pdpData"'));
    const hasSearchData = scriptTags.some((s) => s.innerText.includes('"searchData"'));
    sendResponse({
      type: hasPdpData ? 'pdp' : hasSearchData ? 'category' : 'unknown',
      url: window.location.href,
    });
    return true;
  }

  if (request.type === 'SCRAPE_CURRENT_PAGE') {
    extractProductData()
      .then((product) => {
        chrome.runtime.sendMessage({ type: 'SAVE_PRODUCT', data: product }, (response) => {
          if (response?.success) {
            chrome.runtime.sendMessage({ type: 'SCRAPE_SUCCESS', data: product });
          } else {
            const error = response?.error || 'Failed to save product to database.';
            chrome.runtime.sendMessage({ type: 'SCRAPE_ERROR', error });
          }
          sendResponse(response);
        });
      })
      .catch((err) => {
        const error = err.message || 'Unknown extraction error.';
        chrome.runtime.sendMessage({ type: 'SCRAPE_ERROR', error });
        sendResponse({ success: false, error });
      });
    return true;
  }

  if (request.type === 'SCRAPE_CATEGORY_PAGE') {
    extractCategoryData()
      .then((categoryData) => {
        const count = categoryData?.products.length || 0;
        if (count > 0) {
          chrome.runtime.sendMessage(
            { type: 'SAVE_BATCH', data: categoryData!.products },
            (response) => {
              if (response?.success) {
                chrome.runtime.sendMessage({
                  type: 'SCRAPE_SUCCESS',
                  data: { ...categoryData!.products[0], count }, // Send first product as preview + count
                });
              } else {
                const error = response?.error || 'Failed to save batch to database.';
                chrome.runtime.sendMessage({ type: 'SCRAPE_ERROR', error });
              }
              sendResponse(response);
            },
          );
        } else {
          throw new Error('No products were successfully extracted.');
        }
      })
      .catch((err) => {
        const error = err.message || 'Category processing error.';
        chrome.runtime.sendMessage({ type: 'SCRAPE_ERROR', error });
        sendResponse({ success: false, error });
      });
    return true;
  }
});

// Keyboard Shortcut for quick scraping: Ctrl + Shift + Alt + \
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.altKey && e.key === '\\') {
    console.log('[StyleSwipe] Shortcut triggered: SCRAPE_CURRENT_PAGE');

    // extractProductData already checks for auth inside
    extractProductData().then((product) => {
      if (product) {
        chrome.runtime.sendMessage({ type: 'SAVE_PRODUCT', data: product }, (response) => {
          if (response?.success) {
            console.log('[StyleSwipe] Product saved via shortcut');
            chrome.runtime.sendMessage({ type: 'SCRAPE_SUCCESS', data: product });
          } else {
            console.error('[StyleSwipe] Shortcut save failed:', response?.error);
          }
        });
      }
    });
  }
});
