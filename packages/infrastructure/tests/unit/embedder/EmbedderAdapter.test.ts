import { describe, expect, it } from 'vitest';

import { formatProductForEmbedding } from '../../../src/embedder/EmbedderAdapter';

describe('formatProductForEmbedding', () => {
    it('should combine title, brand, and description', () => {
        const result = formatProductForEmbedding({
            title: 'Blue Shirt',
            brand: 'Nike',
            description: 'A casual blue shirt',
        });
        expect(result).toBe('Blue Shirt Nike A casual blue shirt');
    });

    it('should handle missing fields gracefully', () => {
        const result = formatProductForEmbedding({ title: 'Blue Shirt' });
        expect(result).toBe('Blue Shirt');
    });

    it('should handle all fields missing', () => {
        const result = formatProductForEmbedding({});
        expect(result).toBe('');
    });

    it('should include relevant attributes', () => {
        const result = formatProductForEmbedding({
            title: 'Shirt',
            attributes: {
                material: 'Cotton',
                color: 'Blue',
                fit: 'Regular',
            },
        });
        expect(result).toContain('Cotton');
        expect(result).toContain('Blue');
        expect(result).toContain('Regular');
    });

    it('should only include known attribute keys', () => {
        const result = formatProductForEmbedding({
            title: 'Shirt',
            attributes: {
                sku: 'SKU-123',
                color: 'Red',
                unknownField: 'should be ignored',
            },
        });
        expect(result).toContain('Red');
        expect(result).not.toContain('SKU-123');
        expect(result).not.toContain('should be ignored');
    });

    it('should skip non-string attribute values', () => {
        const result = formatProductForEmbedding({
            title: 'Shirt',
            attributes: {
                color: 'Blue',
                material: 42, // number, not string
            } as Record<string, unknown>,
        });
        expect(result).toContain('Blue');
        expect(result).not.toContain('42');
    });

    it('should trim whitespace from result', () => {
        const result = formatProductForEmbedding({ title: '  Shirt  ' });
        expect(result).toBe('Shirt');
    });

    it('should handle all relevant attributes', () => {
        const result = formatProductForEmbedding({
            attributes: {
                material: 'Silk',
                fabric: 'Satin',
                color: 'Black',
                fit: 'Slim',
                occasion: 'Formal',
                pattern: 'Solid',
            },
        });
        expect(result).toBe('Silk Satin Black Slim Formal Solid');
    });
});
