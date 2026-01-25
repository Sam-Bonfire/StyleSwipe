import { StyleProfile } from "../domain/StyleProfile";

/**
 * Maps onboarding answers to a StyleProfile entity.
 * Generates a deterministic preference vector (placeholder for real ML embedding).
 */
export function initializeStyleProfile(answers: Record<string, string>): StyleProfile {
    const gender = (answers.gender?.toLowerCase() || "both") as "men" | "women" | "both";

    // Create a deterministic vector based on answers
    // In a real app, this would be a call to an embedding service
    const vector = new Array(512).fill(0);

    // Seed with answer hashes for some variability
    Object.values(answers).forEach((value, index) => {
        const charSum = value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const pos = (charSum + index) % 512;
        vector[pos] = 1.0;

        // Add some neighbors
        if (pos > 0) vector[pos - 1] = 0.5;
        if (pos < 511) vector[pos + 1] = 0.5;
    });

    return {
        gender,
        vibes: answers.vibe ? [answers.vibe.toLowerCase()] : [],
        sizes: {
            top: answers.fit,
        },
        budget: {
            min: 0,
            max: 10000,
        },
        preferenceVector: vector,
    };
}
