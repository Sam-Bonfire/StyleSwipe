import { z } from 'zod';

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

export const AddressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$|^[0-9]{10}$/, 'Invalid phone number format'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.enum(INDIAN_STATES as unknown as [string, ...string[]]).or(z.string().min(1)),
  postalCode: z.string().regex(PINCODE_REGEX, 'Invalid pincode: must be 6 digits'),
  country: z.string().min(1, 'Country is required').default('India'),
  isDefault: z.boolean().default(false),
});

export type Address = z.infer<typeof AddressSchema>;

export const validatePincode = (pincode: string): boolean => PINCODE_REGEX.test(pincode);

export const isServiceablePincode = (pincode: string): boolean => validatePincode(pincode);
