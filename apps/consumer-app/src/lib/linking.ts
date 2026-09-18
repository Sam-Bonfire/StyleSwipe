import * as Linking from 'expo-linking';

export interface LinkingConfig {
  prefixes: string[];
  config: {
    screens: Record<string, string>;
  };
}

/**
 * Req 9.2: Deep linking config
 * prefixes: [Linking.createURL('/'), 'styleswipe://']
 * screens: product/:id, sync/:inviteCode  + universal links
 */
export const linkingConfig: LinkingConfig = {
  prefixes: [Linking.createURL('/'), 'styleswipe://', 'https://styleswipe.app', 'https://www.styleswipe.app'],
  config: {
    screens: {
      // Matches file-system routes: app/(app)/product/[id].tsx → product/:id
      product: 'product/:id',
      sync: 'sync/:inviteCode',
      // Additional explicit routes for universal links coverage
      '(app)/product/[id]': 'product/:id',
      '(app)/sync/[inviteCode]': 'sync/:inviteCode',
      onboarding: 'onboarding',
      '(auth)': 'auth',
    },
  },
};

/**
 * Helper: parse product / sync deep link without NavigationContainer (expo-router handles it,
 * but this is used for analytics + logging parity)
 */
export function parseDeepLink(url: string): { screen: string; params: Record<string, string> } | null {
  const parsed = Linking.parse(url);
  const path = parsed.path ?? '';
  if (path.startsWith('product/')) {
    return { screen: 'product', params: { id: path.replace('product/', '') } };
  }
  if (path.startsWith('sync/')) {
    return { screen: 'sync', params: { inviteCode: path.replace('sync/', '') } };
  }
  return null;
}
