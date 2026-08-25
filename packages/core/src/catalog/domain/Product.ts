import { z } from 'zod';

export const ProductGenderSchema = z.enum(['men', 'women', 'unisex']);
export type ProductGender = z.infer<typeof ProductGenderSchema>;

export const ProductAttributesSchema = z.object({
  color: z.string().optional(),
  size: z.array(z.string()).optional(),
  material: z.string().optional(),
  fit: z.string().optional(),
  occasion: z.array(z.string()).optional(),
}).catchall(z.unknown());
export type ProductAttributes = z.infer<typeof ProductAttributesSchema>;

export const ProductSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  title: z.string().min(1, 'Product title is required'),
  description: z.string().optional(),
  brand: z.string().min(1, 'Brand is required'),
  categoryId: z.string().min(1, 'Category ID is required').optional(),
  category: z.string().min(1, 'Category is required'),
  price: z.number().positive('Price must be a positive number'),
  mrp: z.number().positive('MRP must be a positive number').optional(),
  originalMrp: z.number().positive('Original MRP must be a positive number'),
  originalPrice: z.number().positive('Original Price must be a positive number').optional(),
  discountPercentage: z.number().min(0, 'Discount percentage must be between 0 and 100').max(100, 'Discount percentage must be between 0 and 100'),
  currency: z.enum(['INR', 'USD']).optional(),
  stockQuantity: z.number().int().nonnegative('Stock quantity must be a non-negative integer').optional(),
  gender: ProductGenderSchema,
  sizes: z.array(z.string()).min(1, 'At least one size must be specified'),
  colors: z.array(z.string()).min(1, 'At least one color must be specified'),
  images: z.array(z.string().url('Image must be a valid URL')).min(1, 'At least one image URL is required'),
  attributes: ProductAttributesSchema.optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional(),
  fit: z.string().optional(),
  style: z.string().optional(),
  embedding: z.array(z.number()).length(384, 'Embedding must be a 384-dimensional vector'),
  affiliateUrl: z.string().url('Affiliate URL must be valid'),
  inStock: z.boolean(),
  meta: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export type Product = z.infer<typeof ProductSchema>;
