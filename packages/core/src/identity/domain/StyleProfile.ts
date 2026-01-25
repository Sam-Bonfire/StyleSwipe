/**
 * Domain entity representing a User's style profile/DNA.
 */
export interface StyleProfile {
    gender: "men" | "women" | "both";
    age?: string;
    sizes: {
        top?: string;
        bottom?: string;
        shoe?: string;
    };
    vibes: string[];
    budget: {
        min: number;
        max: number;
    };
    preferenceVector?: number[]; // 512-dim embedding
}
