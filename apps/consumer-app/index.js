/* global process */
import 'react-native-gesture-handler';
import { ConvexReactClient } from 'convex/react';

import { initLogger } from './src/lib/logger';

// Initialize Convex Client and Logger as early as possible
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONSUMER_APP_CONVEX_URL);
initLogger(convex);

// Register app entry through Expo Router — MUST be last
import 'expo-router/entry';
