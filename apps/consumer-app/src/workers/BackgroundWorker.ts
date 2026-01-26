import { applyDisplacement, Vector384 } from '@app/core';
import { ConvexHttpClient } from 'convex/browser';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Battery from 'expo-battery';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { generateEmbedding } from '../infrastructure/InferenceEngine';
import { LocalDatabase } from '../infrastructure/LocalDatabase';

const BACKGROUND_TASK_NAME = 'BACKGROUND_STYLE_ANALYSIS';
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || '';

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
        userVector = applyDisplacement(userVector, vItem, payload.action as any);
    }

    // Save updated vector locally
    await db.saveUserVector(userVector);

    // Sync to Convex
    const client = new ConvexHttpClient(CONVEX_URL);
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await client.mutation("sync:syncBatch", {
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
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await client.mutation("sync:syncBatch" as any, {
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
                // @ts-ignore
                if (navigator.getBattery) {
                    // @ts-ignore
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

        if (isCharging) {
            console.log(`[${BACKGROUND_TASK_NAME}] Running Analysis (Charging)...`);
            await performAnalysisAndSync(db);
        } else if (isFull) {
            console.log(`[${BACKGROUND_TASK_NAME}] Buffer Full. Syncing Raw Events...`);
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
    const INTERVAL = 15 * 60 * 1000; // 15 mins

    // Run immediately on boot
    executeTask();

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
