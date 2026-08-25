import { z } from 'zod';

export const AddressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$|^[0-9]{10}$/, 'Invalid phone number format'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().regex(/^[0-9]{5,6}$|^[A-Z0-9]{3,10}$/i, 'Invalid postal code format'),
  country: z.string().min(1, 'Country is required'),
  isDefault: z.boolean().default(false),
});

export type Address = z.infer<typeof AddressSchema>;
