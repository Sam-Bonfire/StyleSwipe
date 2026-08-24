import { z } from 'zod';

export const CategorySchema = z.object({
  id: z.string().min(1, 'Category ID is required'),
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Category slug is required'),
  parentId: z.string().optional(),
});

export type Category = z.infer<typeof CategorySchema>;
