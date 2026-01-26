import { applyDisplacement, Vector384 } from '@app/core';
import { ConvexHttpClient } from 'convex/browser';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Battery from 'expo-battery';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { generateEmbedding } from '../infrastructure/InferenceEngine';
import { LocalDatabase } from '../infrastructure/LocalDatabase';

const BACKGROUND_TASK_NAME = 'BACKGROUND_STYLE_ANALYSIS';
const CONVEX_URL = process.env.EXPO_PUBLIC_CONSUMER_APP_CONVEX_URL || '';
const LEARNING_RATE = parseFloat(process.env.EXPO_PUBLIC_LEARNING_RATE_ALPHA || '0.1');
const PENALTY_RATE = parseFloat(process.env.EXPO_PUBLIC_PENALTY_RATE_BETA || '0.05');

import { authAdapter } from '../lib/auth';

/**
 * Helper to get the current Auth Token for Convex.
 * Background tasks run in an isolated environment (native) or separate loop (web).
 * We need to explicitly retrieve the token to authenticate the ConvexHttpClient.
 */
async function getAuthToken(): Promise<string | null> {
    try {
        // 1. Try getting session from better-auth client (Works if persistence is set up)
        const sessionData = await authAdapter.client.getSession();
        if (sessionData?.data?.session?.token) {
            // Check if token is directly available in the session object
            return sessionData.data.session.token;
        }

        // 2. Fallback: Web LocalStorage (If client above didn't find it but it's there)
        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
            return localStorage.getItem('better-auth.session_token');
        }
    } catch (e) {
        console.warn("[BackgroundWorker] Failed to retrieve auth token:", e);
    }
    return null;
}

// --------------------------------------------------------
// Core Logic (Platform Agnostic)
// --------------------------------------------------------

async function performAnalysisAndSync(db: LocalDatabase) {
    const events = await db.getEvents(50); // Process in chunks
    if (events.length === 0) return;

    // Load User Vector from persistence
    let userVector: Vector384 = await db.getUserVector();

    // Processing Loop
    for (const event of events) {
        const payload = JSON.parse(event.payload);
        const text = payload.text || payload.description || "product";
        const vItem = await generateEmbedding(text);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userVector = applyDisplacement(userVector, vItem, payload.action as any, {
            alpha: LEARNING_RATE,
            beta: PENALTY_RATE
        });

        // Yield to main thread to prevent blocking UI interactions during heavy batch processing
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Save updated vector locally
    await db.saveUserVector(userVector);

    // Sync to Convex
    const client = new ConvexHttpClient(CONVEX_URL);
    const token = await getAuthToken();

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await client.mutation("sync:syncBatch" as any, {
            authToken: token || undefined,
            swipes: events.map(e => {
                const p = JSON.parse(e.payload);
                return {
                    productId: p.productId,
                    action: p.action,
                    timestamp: e.timestamp
                };
            }),
            vectorUpdate: {
                v1: userVector,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                activeDNA: "v1" as any
            }
        });
        console.log(`[${BACKGROUND_TASK_NAME}] Synced ${events.length} swipes and updated vector.`);
        // Ack logic
        await db.deleteEvents(events.map(e => e.id));
    } catch (err) {
        console.error(`[${BACKGROUND_TASK_NAME}] Sync failed:`, err);
    }
}

async function syncRawEventsOnly(db: LocalDatabase) {
    const events = await db.getEvents(100);
    if (events.length === 0) return;

    const client = new ConvexHttpClient(CONVEX_URL);
    const token = await getAuthToken();

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await client.mutation("sync:syncBatch" as any, {
            authToken: token || undefined,
            swipes: events.map(e => {
                const p = JSON.parse(e.payload);
                return {
                    productId: p.productId,
                    action: p.action,
                    timestamp: e.timestamp
                };
            })
        });
        console.log(`[${BACKGROUND_TASK_NAME}] Synced ${events.length} raw events.`);
        await db.deleteEvents(events.map(e => e.id));
    } catch (err) {
        console.error(`[${BACKGROUND_TASK_NAME}] Raw sync failed:`, err);
    }
}

async function executeTask() {
    try {
        let isCharging = true; // Default for Web

        // Battery Check
        try {
            if (Platform.OS === 'web') {
                // @ts-expect-error - navigator.getBattery is not in standard lib
                if (navigator.getBattery) {
                    // @ts-expect-error - navigator.getBattery is not in standard lib
                    const battery = await navigator.getBattery();
                    isCharging = battery.charging;
                }
            } else {
                const batteryState = await Battery.getBatteryStateAsync();
                isCharging = batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL;
            }
        } catch (e) {
            console.warn("[BackgroundWorker] Battery check failed, assuming charging.", e);
        }

        const db = await LocalDatabase.getInstance();
        const isFull = await db.isBufferFull();
        const hasEvents = (await db.getDatabaseSize()) > 0; // Check if any events exist

        if (isCharging) {
            console.log(`[${BACKGROUND_TASK_NAME}] Running Analysis (Charging)...`);
            await performAnalysisAndSync(db);
        } else if (isFull || hasEvents) {
            // Relaxed constraint: Sync raw events if buffer full OR simply if we have events pending (Periodic Sync)
            // The original requirement was "Buffer hits 20MB... sync". 
            // But user feedback says "swipe should also periodically occur otherwise".
            // Since this task runs periodically (every 15m), syncing raw events here satisfies that.
            console.log(`[${BACKGROUND_TASK_NAME}] Periodic Sync (Raw Events)...`);
            await syncRawEventsOnly(db);
        }

    } catch (error) {
        console.error(`[${BACKGROUND_TASK_NAME}] Execution Failed:`, error);
    }
}

// --------------------------------------------------------
// Platform Specific Registration
// --------------------------------------------------------

if (Platform.OS !== 'web') {
    TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
        await executeTask();
        return BackgroundFetch.BackgroundFetchResult.NewData;
    });
}

function runWebBackgroundLoop() {
    console.log(`[${BACKGROUND_TASK_NAME}] Initializing Web Background Loop...`);
    const INTERVAL = 5 * 60 * 1000; // 5 mins

    // Run after a delay to avoid blocking startup (e.g. 5 seconds)
    setTimeout(() => {
        executeTask();
    }, 5000);

    // Loop
    setInterval(() => {
        executeTask();
    }, INTERVAL);
}

export async function registerBackgroundWorker() {
    if (Platform.OS === 'web') {
        runWebBackgroundLoop();
        return;
    }

    return BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
        minimumInterval: 15 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
    });
}
