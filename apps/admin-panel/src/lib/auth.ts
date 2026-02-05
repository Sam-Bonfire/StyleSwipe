import { AuthAdapter } from "@app/infrastructure";

export const authAdapter = new AuthAdapter(process.env.EXPO_PUBLIC_CONSUMER_APP_CONVEX_SITE_URL);
