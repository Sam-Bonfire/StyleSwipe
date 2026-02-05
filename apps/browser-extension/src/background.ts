/// <reference types="chrome" />

import { ConvexHttpClient } from 'convex/browser';

import { api } from '@app/convex';

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

if (!CONVEX_URL) {
  console.error('Convex configuration missing. URL:', CONVEX_URL);
}

const client = new ConvexHttpClient(CONVEX_URL!);

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('[StyleSwipe] Background received message:', request.type);

  if (request.type === 'SAVE_PRODUCT') {
    console.log('[StyleSwipe] Saving product to Convex:', request.data.title);

    client
      .mutation(api.scraper.saveProduct, {
        externalId: request.data.externalId,
        url: request.data.url,
        data: request.data,
      })
      .then(() => {
        console.log('[StyleSwipe] Successfully saved to Convex!');
        sendResponse({ success: true });
      })
      .catch((e) => {
        console.error('[StyleSwipe] Convex Save Failed:', e);
        sendResponse({ success: false, error: 'Convex Error: ' + e.message });
      });

    return true; // Keep channel open
  }

  if (request.type === 'SAVE_BATCH') {
    console.log(`[StyleSwipe] Background saving batch of ${request.data.length} products`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const products = request.data.map((item: any) => ({
      externalId: item.externalId,
      url: item.url,
      data: item,
    }));

    const chunkSize = 20;
    const chunks: any[] = [];
    for (let i = 0; i < products.length; i += chunkSize) {
      chunks.push(products.slice(i, i + chunkSize));
    }

    const promises = chunks.map((chunk) =>
      client.mutation(api.scraper.saveBatch, {
        products: chunk,
      }),
    );

    Promise.all(promises)
      .then(() => {
        console.log('[StyleSwipe] Batch save completed!');
        sendResponse({ success: true, count: request.data.length });
      })
      .catch((e) => {
        console.error('[StyleSwipe] Batch Save Failed:', e);
        sendResponse({ success: false, error: 'Batch Error: ' + e.message });
      });

    return true;
  }
});
