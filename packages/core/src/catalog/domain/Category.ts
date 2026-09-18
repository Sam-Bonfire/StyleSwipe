import { z } from 'zod';

export const CategorySchema = z.object({
  id: z.string().min(1, 'Category ID is required'),
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be a URL-safe string'),
  parentId: z.string().optional(),
  level: z.number().int().nonnegative('Level must be a non-negative integer').optional(),
  image: z.string().url('Image must be a valid URL').optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  displayOrder: z.number().int().optional(),
});

export type Category = z.infer<typeof CategorySchema>;

export type CategoryNode = Category & {
  children?: CategoryNode[];
};
