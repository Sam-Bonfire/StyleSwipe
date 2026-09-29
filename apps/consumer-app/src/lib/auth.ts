import { AuthAdapter } from '@app/infrastructure';

const siteUrl = process.env.EXPO_PUBLIC_CONSUMER_APP_CONVEX_SITE_URL;
if (!siteUrl) {
  throw new Error('Missing EXPO_PUBLIC_CONSUMER_APP_CONVEX_SITE_URL');
}

export const authAdapter = new AuthAdapter(siteUrl);
