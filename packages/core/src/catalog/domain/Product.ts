import { z } from 'zod';

export const ProductGenderSchema = z.enum(['men', 'women', 'unisex']);
export type ProductGender = z.infer<typeof ProductGenderSchema>;

export const ProductSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  title: z.string().min(1, 'Product title is required'),
  brand: z.string().min(1, 'Brand is required'),
  price: z.number().positive('Price must be a positive number'),
  originalMrp: z.number().positive('Original MRP must be a positive number'),
  discountPercentage: z.number().min(0, 'Discount percentage must be between 0 and 100').max(100, 'Discount percentage must be between 0 and 100'),
  category: z.string().min(1, 'Category is required'),
  gender: ProductGenderSchema,
  sizes: z.array(z.string()).min(1, 'At least one size must be specified'),
  colors: z.array(z.string()).min(1, 'At least one color must be specified'),
  images: z.array(z.string().url('Image must be a valid URL')).min(1, 'At least one image URL is required'),
  embedding: z.array(z.number()).length(384, 'Embedding must be a 384-dimensional vector'),
  affiliateUrl: z.string().url('Affiliate URL must be valid'),
  inStock: z.boolean(),
});

export type Product = z.infer<typeof ProductSchema>;
