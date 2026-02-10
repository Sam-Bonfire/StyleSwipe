/* global process */
import 'react-native-gesture-handler';
import { ConvexReactClient } from 'convex/react';
import { registerRootComponent } from 'expo';

import App from './src/App';
import { initLogger } from './src/lib/logger';

// Initialize Convex Client and Logger as early as possible
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONSUMER_APP_CONVEX_URL);
initLogger(convex);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

