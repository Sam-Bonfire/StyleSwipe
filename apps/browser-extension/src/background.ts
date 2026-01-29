/// <reference types="chrome" />

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
// Note: Background workers might not have access to .env in some setups, 
// usually we need to bake this in or load from elsewhere. 
// For Vite + CRXJS, import.meta.env usually works if defined in .env

// Fallback if needed, but assuming user provides env
if (!CONVEX_URL) {
    console.error("Convex URL not found");
}

const client = new ConvexHttpClient(CONVEX_URL!);

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    console.log("[StyleSwipe] Background received message:", request.type);

    if (request.type === "SAVE_PRODUCT") {
        console.log("[StyleSwipe] Saving product to Convex:", request.data.title);

        if (!CONVEX_URL) {
            console.error("[StyleSwipe] Cannot save: VITE_CONVEX_URL is missing in build.");
            sendResponse({ success: false, error: "Convex URL not configured in extension build." });
            return false;
        }

        // Save to Convex
        client.mutation(api.scraper.saveProduct, {
            myntraId: request.data.myntraId,
            url: request.data.url,
            data: request.data
        }).then(() => {
            console.log("[StyleSwipe] Successfully saved to Convex!");
            sendResponse({ success: true });
        }).catch((e) => {
            console.error("[StyleSwipe] Convex Save Failed:", e);
            sendResponse({ success: false, error: "Convex Error: " + e.message });
        });

        return true; // Keep channel open
    }

    if (request.type === "SAVE_BATCH") {
        console.log(`[StyleSwipe] Background saving batch of ${request.data.length} products`);

        if (!CONVEX_URL) {
            sendResponse({ success: false, error: "Convex URL missing" });
            return false;
        }

        // Chunking the batch to avoid Convex timeout on extremely large pages
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const products = request.data.map((item: any) => ({
            myntraId: item.myntraId,
            url: item.url,
            data: item
        }));

        const chunkSize = 20;
        const chunks = [];
        for (let i = 0; i < products.length; i += chunkSize) {
            chunks.push(products.slice(i, i + chunkSize));
        }

        const promises = chunks.map(chunk =>

            client.mutation(api.scraper.saveBatch, { products: chunk })
        );

        Promise.all(promises)
            .then(() => {
                console.log("[StyleSwipe] Batch save completed!");
                sendResponse({ success: true, count: request.data.length });
            })
            .catch((e) => {
                console.error("[StyleSwipe] Batch Save Failed:", e);
                sendResponse({ success: false, error: "Batch Error: " + e.message });
            });

        return true;
    }
});
