import { describe, expect, it } from 'vitest';

import { ProductGenderSchema, ProductSchema, type Product, type ProductGender } from '../Product';

describe('Product Schema & Domain Model', () => {
  const createValidProduct = (): Product => ({
    id: 'prod_12345',
    title: 'Classic Denim Jacket',
    brand: 'StyleSwipe Originals',
    price: 2999,
    originalMrp: 3999,
    discountPercentage: 25,
    category: 'Outerwear',
    gender: 'unisex',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Blue', 'Black'],
    images: [
      'https://cdn.styleswipe.com/products/jacket-1.jpg',
      'https://cdn.styleswipe.com/products/jacket-2.jpg',
    ],
    embedding: new Array(384).fill(0.123),
    affiliateUrl: 'https://partner.store.com/item/12345?ref=styleswipe',
    inStock: true,
  });

  describe('Happy Path', () => {
    it('should parse a valid product object successfully', () => {
      const validPayload = createValidProduct();
      const result = ProductSchema.safeParse(validPayload);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPayload);
        expect(result.data.id).toBe('prod_12345');
        expect(result.data.gender).toBe('unisex');
        expect(result.data.embedding).toHaveLength(384);
      }
    });

    it('should parse valid products for all allowed gender enums', () => {
      const genders: ProductGender[] = ['men', 'women', 'unisex'];
      for (const gender of genders) {
        const payload = { ...createValidProduct(), gender };
        const result = ProductSchema.safeParse(payload);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.gender).toBe(gender);
        }
      }
    });

    it('should validate ProductGenderSchema standalone', () => {
      expect(ProductGenderSchema.safeParse('men').success).toBe(true);
      expect(ProductGenderSchema.safeParse('women').success).toBe(true);
      expect(ProductGenderSchema.safeParse('unisex').success).toBe(true);
    });

    it('should accept discountPercentage of boundary values 0 and 100', () => {
      const payloadMin = { ...createValidProduct(), discountPercentage: 0 };
      const payloadMax = { ...createValidProduct(), discountPercentage: 100 };

      expect(ProductSchema.safeParse(payloadMin).success).toBe(true);
      expect(ProductSchema.safeParse(payloadMax).success).toBe(true);
    });
  });

  describe('Price & Original MRP Validations', () => {
    it('should reject zero price', () => {
      const payload = { ...createValidProduct(), price: 0 };
      const result = ProductSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldError = result.error.format().price;
        expect(fieldError?._errors).toContain('Price must be a positive number');
      }
    });

    it('should reject negative price', () => {
      const payload = { ...createValidProduct(), price: -15.99 };
      const result = ProductSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject zero originalMrp', () => {
      const payload = { ...createValidProduct(), originalMrp: 0 };
      const result = ProductSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldError = result.error.format().originalMrp;
        expect(fieldError?._errors).toContain('Original MRP must be a positive number');
      }
    });

    it('should reject negative originalMrp', () => {
      const payload = { ...createValidProduct(), originalMrp: -100 };
      const result = ProductSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('Discount Percentage Validations', () => {
    it('should reject discountPercentage < 0', () => {
      const payload = { ...createValidProduct(), discountPercentage: -0.01 };
      const result = ProductSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldError = result.error.format().discountPercentage;
        expect(fieldError?._errors).toContain('Discount percentage must be between 0 and 100');
      }
    });

    it('should reject discountPercentage > 100', () => {
      const payload = { ...createValidProduct(), discountPercentage: 100.01 };
      const result = ProductSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldError = result.error.format().discountPercentage;
        expect(fieldError?._errors).toContain('Discount percentage must be between 0 and 100');
      }
    });
  });

  describe('Gender Enum Validations', () => {
    it('should reject invalid gender enum strings', () => {
      const invalidGenders = ['kids', 'boys', 'girls', 'other', 'MEN', 'WOMEN', ''];
      for (const invalidGender of invalidGenders) {
        const payload = { ...createValidProduct(), gender: invalidGender as unknown as ProductGender };
        const result = ProductSchema.safeParse(payload);
        expect(result.success).toBe(false);
      }
    });

    it('should reject invalid gender in ProductGenderSchema standalone', () => {
      expect(ProductGenderSchema.safeParse('kids').success).toBe(false);
      expect(ProductGenderSchema.safeParse(123).success).toBe(false);
    });
  });

  describe('Image & Affiliate URL Validations', () => {
    it('should reject invalid image URL string', () => {
      const payload = {
        ...createValidProduct(),
        images: ['not-a-valid-url'],
      };
      const result = ProductSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldError = result.error.format().images;
        expect(JSON.stringify(fieldError)).toContain('Image must be a valid URL');
      }
    });

    it('should reject empty images array', () => {
      const payload = { ...createValidProduct(), images: [] };
      const result = ProductSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldError = result.error.format().images;
        expect(fieldError?._errors).toContain('At least one image URL is required');
      }
    });

    it('should reject invalid affiliate URL', () => {
      const payload = { ...createValidProduct(), affiliateUrl: 'invalid-affiliate-url' };
      const result = ProductSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldError = result.error.format().affiliateUrl;
        expect(fieldError?._errors).toContain('Affiliate URL must be valid');
      }
    });
  });

  describe('Vector Embedding Array Validations', () => {
    it('should reject vector embedding array length < 384', () => {
      const payload = {
        ...createValidProduct(),
        embedding: new Array(383).fill(0.1),
      };
      const result = ProductSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldError = result.error.format().embedding;
        expect(fieldError?._errors).toContain('Embedding must be a 384-dimensional vector');
      }
    });

    it('should reject vector embedding array length > 384', () => {
      const payload = {
        ...createValidProduct(),
        embedding: new Array(385).fill(0.1),
      };
      const result = ProductSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldError = result.error.format().embedding;
        expect(fieldError?._errors).toContain('Embedding must be a 384-dimensional vector');
      }
    });

    it('should reject empty vector embedding array', () => {
      const payload = { ...createValidProduct(), embedding: [] };
      const result = ProductSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject non-number elements in vector embedding', () => {
      const embeddingWithStrings = new Array(384).fill(0.1);
      (embeddingWithStrings as unknown as (number | string)[])[0] = 'not-a-number';
      const payload = { ...createValidProduct(), embedding: embeddingWithStrings as unknown as number[] };
      const result = ProductSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('Missing Required Fields & Empty Collection Validations', () => {
    it('should reject payload missing required fields', () => {
      const requiredFields: (keyof Product)[] = [
        'id',
        'title',
        'brand',
        'price',
        'originalMrp',
        'discountPercentage',
        'category',
        'gender',
        'sizes',
        'colors',
        'images',
        'embedding',
        'affiliateUrl',
        'inStock',
      ];

      for (const field of requiredFields) {
        const payload = createValidProduct();
        delete (payload as Record<string, unknown>)[field];
        const result = ProductSchema.safeParse(payload);
        expect(result.success).toBe(false);
      }
    });

    it('should reject empty string for required string fields', () => {
      const stringFields: ('id' | 'title' | 'brand' | 'category')[] = [
        'id',
        'title',
        'brand',
        'category',
      ];

      for (const field of stringFields) {
        const payload = { ...createValidProduct(), [field]: '' };
        const result = ProductSchema.safeParse(payload);
        expect(result.success).toBe(false);
      }
    });

    it('should reject empty sizes array', () => {
      const payload = { ...createValidProduct(), sizes: [] };
      const result = ProductSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldError = result.error.format().sizes;
        expect(fieldError?._errors).toContain('At least one size must be specified');
      }
    });

    it('should reject empty colors array', () => {
      const payload = { ...createValidProduct(), colors: [] };
      const result = ProductSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldError = result.error.format().colors;
        expect(fieldError?._errors).toContain('At least one color must be specified');
      }
    });
  });
});
