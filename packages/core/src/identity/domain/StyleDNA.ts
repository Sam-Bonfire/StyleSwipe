
export type Vector384 = number[];

export const VECTOR_DIMENSIONS = 384;
// Configuration defaults - should be overridden by env if needed, but constants here for logic
export const DEFAULT_LEARNING_RATE_ALPHA = 0.1;
export const DEFAULT_PENALTY_RATE_BETA = 0.05;
export const SUPER_LIKE_MULTIPLIER = 3;

export interface StyleCluster {
    id: string;
    name: string;
    centroid: Vector384;
}

export interface SwipeEvent {
    id: string;
    timestamp: number;
    userId: string;
    newItemId: string;
    newItemVector: Vector384;
    action: 'like' | 'dislike' | 'superlike';
    previousEventHash?: string;
}

export interface WeeklySummary {
    period: string; // e.g., "2026-W04"
    granularity: '8bit' | 'float32'; // We use number[] (float) in runtime, but might store 8bit
    summary: Record<string, {
        right_swipes: number;
        dislikes: number;
        avg_price?: number;
    }>;
    centroid_shift: Vector384;
    hash: string;
}

export interface StyleDNA {
    version: string;
    vector: Vector384;
    lastUpdated: number;
}

/**
 * Calculates the mean vector of multiple style clusters.
 * Used for Cold Start initialization.
 */
export function calculateCentroid(vectors: Vector384[]): Vector384 {
    if (vectors.length === 0) {
        return new Array(VECTOR_DIMENSIONS).fill(0);
    }

    const sum = new Array(VECTOR_DIMENSIONS).fill(0);
    for (const vec of vectors) {
        for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
            sum[i] += vec[i];
        }
    }

    return sum.map(val => val / vectors.length);
}

/**
 * Applies vector displacement based on user action.
 * 
 * Right Swipe (Affinity): Vnew = Vold + alpha * (Vitem - Vold)
 * Left Swipe (Aversion): Vnew = Vold - beta * (Vitem - Vold)
 * Super Like: alpha = alpha * 3
 */
export function applyDisplacement(
    currentProfile: Vector384,
    itemVector: Vector384,
    action: 'like' | 'dislike' | 'superlike',
    config: { alpha?: number; beta?: number } = {}
): Vector384 {
    const alpha = config.alpha ?? DEFAULT_LEARNING_RATE_ALPHA;
    const beta = config.beta ?? DEFAULT_PENALTY_RATE_BETA;

    const result = [...currentProfile];

    if (action === 'like' || action === 'superlike') {
        const learningRate = action === 'superlike' ? alpha * SUPER_LIKE_MULTIPLIER : alpha;
        for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
            result[i] = currentProfile[i] + learningRate * (itemVector[i] - currentProfile[i]);
        }
    } else if (action === 'dislike') {
        for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
            result[i] = currentProfile[i] - beta * (itemVector[i] - currentProfile[i]);
        }
    }

    return result;
}

/**
 * Helper to ensure vector is normalized if needed,
 * though the product requirement doesn't explicitly ask for normalization after every step,
 * only displacement.
 */
// export function normalize(v: Vector384): Vector384 { ... }
