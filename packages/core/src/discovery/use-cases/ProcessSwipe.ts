import { v } from "convex/values";

/**
 * Value Object validating the Swipe Action
 */
export type SwipeAction = "like" | "pass" | "super";

export const SwipeActionSchema = v.union(
    v.literal("like"),
    v.literal("pass"),
    v.literal("super")
);

/**
 * Input for the ProcessSwipe use case
 */
export interface ProcessSwipeInput {
    userId: string;
    productId: string;
    action: SwipeAction;
    timestamp: number;
}

/**
 * Pure Domain Logic for processing a swipe
 * (In a real DDD setup, this might perform complex weight calculations here)
 */
export class ProcessSwipe {
    execute(input: ProcessSwipeInput): ProcessSwipeInput {
        // Basic validation
        if (!input.userId) throw new Error("UserId is required");
        if (!input.productId) throw new Error("ProductId is required");

        // Using a 'super' like could potentially trigger more complex logic (e.g. notifications)
        // For now, we just pass through.
        return input;
    }
}
