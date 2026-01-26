
import { useCallback } from 'react';

import { LocalDatabase } from '../infrastructure/LocalDatabase';

export function useSwipeActions() {
    const bufferSwipe = useCallback(async (
        productId: string,
        action: 'like' | 'dislike' | 'superlike',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        productPayload?: any // Should include text for vectorization if needed
    ) => {
        try {
            //Fire and forget logic - we don't await the DB write to block the UI, 
            // but we do want to catch errors? 
            // For true fire-and-forget, we don't await. 
            // However, usually await on SQLite is fast enough (<10ms). 
            // User said "Main thread ONLY buffers...".

            const db = await LocalDatabase.getInstance();

            // We assume productPayload contains title, description etc for the worker to vectorize later.
            const payload = {
                productId,
                action,
                ...productPayload
            };

            // We await here to ensure data safety, but it's fast. 
            // If we *really* want to unblock, we could wrap in a promise that resolves immediately 
            // while the work continues. But React 18 / RN architectures might suspend.
            // Standard practice: await is fine for SQLite inserts.
            await db.bufferEvent('swipe', payload);

            console.log(`[Swipe] Buffered ${action} on ${productId}`);
        } catch (error) {
            console.error('[Swipe] Failed to buffer event:', error);
            // Fallback strategies? LocalStorage?
        }
    }, []);

    return { bufferSwipe };
}
