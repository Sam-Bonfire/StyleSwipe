import { Redirect } from 'expo-router';

// Discover is the default landing tab; Home lives at /home.
export default function TabsIndexRoute() {
  return <Redirect href="/(app)/(tabs)/discover" />;
}
