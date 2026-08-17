import { describe, expect, it, test, vi as mock, beforeEach, afterEach, vi } from 'vitest';

import { mapToScrapedProduct, type MyntraRawData } from '../../src/scrapers/MyntraScraper';

describe('MyntraScraper', () => {
  describe('mapToScrapedProduct', () => {
    test('should correctly map a standard product', () => {
      const rawData: MyntraRawData = {
        id: 12345,
        productName: 'Blue Shirt',
        brand: { name: 'Roadster' },
        price: {
          discounted: 500,
          mrp: 1000,
          discount: { label: '50% OFF' },
        },
        images: [
          { src: 'http://example.com/image1.jpg' },
          { src: 'http://example.com/image2.jpg' },
        ],
        sizes: 'S,M,L,XL',
        gender: 'Men',
        articleType: { typeName: 'Tshirts' },
        masterCategory: { typeName: 'Apparel' },
        subCategory: { typeName: 'Topwear' },
      };

      const url = 'https://www.myntra.com/12345';
      const result = mapToScrapedProduct(rawData, url);

      expect(result.externalId).toBe('12345');
      expect(result.title).toBe('Blue Shirt');
      expect(result.brand).toBe('Roadster');
      expect(result.price).toBe(500);
      expect(result.mrp).toBe(1000);
      expect(result.discount).toBe('50% OFF');
      expect(result.images).toHaveLength(2);
      expect(result.images[0]).toBe('http://example.com/image1.jpg');
      expect(result.availableSizes).toEqual(['S', 'M', 'L', 'XL']);
      expect(result.gender).toBe('men');
      expect(result.category).toBe('Tshirts');
    });

    test('should handle missing price information gracefully', () => {
      const rawData: MyntraRawData = {
        id: 67890,
        productName: 'Unknown Item',
        brand: 'Unknown Brand',
        mrp: 999,
      };

      const result = mapToScrapedProduct(rawData, 'https://url.com');
      expect(result.price).toBe(0);
      expect(result.mrp).toBe(999);
    });

    test('should clean image URLs', () => {
      const rawData: MyntraRawData = {
        id: 111,
        images: [
          { src: 'http://test.com/img1.jpg($size_representation$)' },
          { src: 'http://test.com/img2.jpg$quality$' },
        ],
      };

      const result = mapToScrapedProduct(rawData, 'https://url.com');
      expect(result.images[0]).toBe('http://test.com/img1.jpg');
      expect(result.images[1]).toBe('http://test.com/img2.jpg90');
    });
  });
});
