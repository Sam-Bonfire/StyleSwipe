import { describe, expect, it } from 'vitest';

import { CategorySchema, type Category, type CategoryNode } from '../../../../src/catalog/domain/Category';

describe('CategorySchema', () => {
  const validCategory: Category = {
    id: 'cat-123',
    name: 'T-Shirts',
    slug: 't-shirts',
    level: 1,
  };

  it('should successfully parse a valid category', () => {
    const result = CategorySchema.safeParse(validCategory);
    expect(result.success).toBe(true);
  });

  it('should reject a category with missing name', () => {
    const invalidCategory = { ...validCategory };
    delete (invalidCategory as Record<string, unknown>).name;
    const result = CategorySchema.safeParse(invalidCategory);
    expect(result.success).toBe(false);
  });

  it('should reject a category with an invalid URL slug', () => {
    const invalidCategory = { ...validCategory, slug: 'Invalid Slug!' };
    const result = CategorySchema.safeParse(invalidCategory);
    expect(result.success).toBe(false);
  });

  it('should reject a category with a negative level', () => {
    const invalidCategory = { ...validCategory, level: -1 };
    const result = CategorySchema.safeParse(invalidCategory);
    expect(result.success).toBe(false);
  });

  it('should reject a category with an invalid image URL', () => {
    const invalidCategory = { ...validCategory, image: 'not-a-url' };
    const result = CategorySchema.safeParse(invalidCategory);
    expect(result.success).toBe(false);
  });

  it('should validate CategoryNode recursive structure correctly at type level', () => {
    const node: CategoryNode = {
      ...validCategory,
      children: [
        {
          id: 'cat-123-1',
          name: 'Graphic T-Shirts',
          slug: 'graphic-t-shirts',
          level: 2,
        }
      ]
    };
    expect(node.children).toBeDefined();
    expect(node.children?.[0]?.id).toBe('cat-123-1');
  });
});
