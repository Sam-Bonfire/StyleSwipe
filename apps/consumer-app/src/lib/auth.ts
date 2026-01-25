import { AuthAdapter } from "@app/infrastructure";

// TODO: Replace with actual Convex URL from env or configuration



export const authAdapter = new AuthAdapter(process.env.EXPO_PUBLIC_CONSUMER_APP_CONVEX_SITE_URL);
