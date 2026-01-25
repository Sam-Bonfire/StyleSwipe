import { AuthAdapter } from "@app/infrastructure";

// TODO: Replace with actual Convex URL from env or configuration
const CONVEX_URL = "https://example-convex-url.convex.cloud";

export const authAdapter = new AuthAdapter(CONVEX_URL);
