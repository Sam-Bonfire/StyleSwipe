
export type Vector384 = number[];

export const TOPIC_DIMENSIONS = 384;

// Default Learning Rates
export const DEFAULT_LEARNING_RATE_ALPHA = 0.1;
export const DEFAULT_PENALTY_RATE_BETA = 0.05;
export const SUPER_LIKE_MULTIPLIER = 3;

// Interface for configuration to allow overrides
export interface DisplacementConfig {
    alpha?: number;
    beta?: number;
    superLikeMultiplier?: number; // Added this one too just in case
}


export interface SwipeEvent {
    id: string;
    timestamp: number;
    userId: string;
    newItemId: string;
    newItemVector: Vector384;
    action: 'like' | 'pass' | 'super';
    previousEventHash?: string;
}

// ... (WeekySummary interface can stay as is or be updated if it uses these keys)

/**
 * Calculates the mean vector of multiple style clusters.
 * Used for Cold Start initialization.
 */
export function calculateCentroid(vectors: Vector384[]): Vector384 {
    if (vectors.length === 0) {
        return new Array(TOPIC_DIMENSIONS).fill(0);
    }

    const sum = new Array(TOPIC_DIMENSIONS).fill(0);
    for (const vec of vectors) {
        for (let i = 0; i < TOPIC_DIMENSIONS; i++) {
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
    action: 'like' | 'pass' | 'super',
    config: { alpha?: number; beta?: number } = {}
): Vector384 {
    const alpha = config.alpha ?? DEFAULT_LEARNING_RATE_ALPHA;
    const beta = config.beta ?? DEFAULT_PENALTY_RATE_BETA;

    const result = [...currentProfile];

    if (action === 'like' || action === 'super') {
        const learningRate = action === 'super' ? alpha * SUPER_LIKE_MULTIPLIER : alpha;
        for (let i = 0; i < TOPIC_DIMENSIONS; i++) {
            result[i] = currentProfile[i] + learningRate * (itemVector[i] - currentProfile[i]);
        }
    } else if (action === 'pass') {
        for (let i = 0; i < TOPIC_DIMENSIONS; i++) {
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
