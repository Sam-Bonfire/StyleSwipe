import { describe, expect, test } from "bun:test";

import { applyDisplacement, Vector384 } from "./StyleDNA";

describe("StyleDNA - applyDisplacement", () => {
    // Create dummy vectors (size 384)
    // For simplicity, we can use smaller ones if the logic doesn't strictly check length, 
    // but the type says Vector384. The function loops VECTOR_DIMENSIONS (384) times.
    // So we must satisfy that.
    const createVector = (val: number): Vector384 => Array(384).fill(val);

    test("Right Swipe (Like) moves vector towards item", () => {
        const userVec = createVector(0.5);
        const itemVec = createVector(1.0);

        // Vnew = Vold + 0.1 * (1.0 - 0.5) = 0.5 + 0.05 = 0.55
        const result = applyDisplacement(userVec, itemVec, 'like');

        expect(result[0]).toBeCloseTo(0.55, 4);
    });

    test("Left Swipe (Pass) pushes vector away from item", () => {
        const userVec = createVector(0.5);
        const itemVec = createVector(1.0);

        // Vnew = Vold - 0.05 * (1.0 - 0.5) = 0.5 - 0.025 = 0.475
        const result = applyDisplacement(userVec, itemVec, 'pass');

        expect(result[0]).toBeCloseTo(0.475, 4);
    });

    test("Super Like moves vector significantly towards item", () => {
        const userVec = createVector(0.5);
        const itemVec = createVector(1.0);

        // Alpha = 0.1 * 3 = 0.3
        // Vnew = Vold + 0.3 * (1.0 - 0.5) = 0.5 + 0.15 = 0.65
        const result = applyDisplacement(userVec, itemVec, 'super');

        expect(result[0]).toBeCloseTo(0.65, 4);
    });

    test("Handles arrays correctly", () => {
        const userVec = createVector(0);
        const itemVec = createVector(1);

        const result = applyDisplacement(userVec, itemVec, 'like');
        // 0 + 0.1 * (1 - 0) = 0.1
        expect(result[0]).toBe(0.1);
        expect(result[383]).toBe(0.1);
    });
});
