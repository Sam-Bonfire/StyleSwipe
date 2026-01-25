import { AuthAdapter } from "@app/infrastructure";

// TODO: Replace with actual Convex URL from env or configuration
import { Platform } from 'react-native';

const DEFAULT_CONVEX_URL = Platform.OS === 'web'
    ? "http://127.0.0.1:3210"
    : "http://172.29.36.5:3210";

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || DEFAULT_CONVEX_URL;

export const authAdapter = new AuthAdapter(CONVEX_URL);
