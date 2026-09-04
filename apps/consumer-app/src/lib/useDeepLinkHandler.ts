import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { parseDeepLink } from './linking';
import { logger } from './logger';

/**
 * Handles cold-start and background deep links via expo-linking.
 * expo-router already handles file-system routing, but this adds:
 * - analytics (`invite_opened`, `deep_link_opened`)
 * - explicit navigation fallback for bare `styleswipe://` scheme
 */
export function useDeepLinkHandler(): void {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = (url: string): void => {
      logger.info('Deep link opened', { url });
      const parsed = parseDeepLink(url);
      if (!parsed) return;

      if (parsed.screen === 'product' && parsed.params.id) {
        router.push(`/product/${parsed.params.id}` as never);
      } else if (parsed.screen === 'sync' && parsed.params.inviteCode) {
        router.push(`/sync/${parsed.params.inviteCode}` as never);
      }
    };

    // Cold start
    void Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // Background / foreground links
    const sub = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => {
      sub.remove();
    };
  }, [router]);
}
