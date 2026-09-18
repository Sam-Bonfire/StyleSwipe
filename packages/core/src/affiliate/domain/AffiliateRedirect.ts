import { z } from 'zod';

const HttpsUrlSchema = z.string().url().refine((url) => {
  // Using simple string matching to avoid try/catch rule in eslint
  return url.startsWith('https://');
}, { message: 'URL must use HTTPS protocol' });

export const AffiliateNetworkSchema = z.enum([
  'DIRECT',
  'IMPACT',
  'CJ',
  'RAKUTEN',
  'CUSTOM',
]);

export const AffiliateLinkSchema = z.object({
  productId: z.string(),
  merchantName: z.string(),
  rawProductUrl: HttpsUrlSchema,
  affiliateNetwork: AffiliateNetworkSchema,
  trackingParams: z.record(z.string(), z.string()),
  resolvedUrl: HttpsUrlSchema,
});

export const DeviceContextSchema = z.object({
  platform: z.string(),
  appVersion: z.string(),
});

export const OutboundClickEventSchema = z.object({
  clickId: z.string(),
  userId: z.string().optional(), // optional for guests
  productId: z.string(),
  merchantId: z.string(),
  destinationUrl: HttpsUrlSchema,
  timestamp: z.number(),
  deviceContext: DeviceContextSchema,
  utmSource: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmMedium: z.string().optional(),
});

export type AffiliateNetwork = z.infer<typeof AffiliateNetworkSchema>;
export type AffiliateLink = z.infer<typeof AffiliateLinkSchema>;
export type DeviceContext = z.infer<typeof DeviceContextSchema>;
export type OutboundClickEvent = z.infer<typeof OutboundClickEventSchema>;
