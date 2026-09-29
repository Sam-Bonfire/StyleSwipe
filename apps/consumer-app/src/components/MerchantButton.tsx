import { useProductSourceUrl, useTrackMerchantRedirect, useAnalytics, useCurrentUser } from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import { ExternalLink } from '@tamagui/lucide-icons';
import React from 'react';
import { Alert, Linking, Platform } from 'react-native';

/**
 * MerchantButton — opens the retailer's page for a product and logs
 * the outbound redirect. Used wherever the aggregator hands off purchase.
 */
export const MerchantButton = ({ productId }: { productId: string }) => {
  const merchantUrl = useProductSourceUrl(productId);
  const trackMerchantRedirect = useTrackMerchantRedirect();
  const { trackEvent } = useAnalytics();
  const user = useCurrentUser();
  const userId = user?._id ?? undefined;

  const handlePress = async (): Promise<void> => {
    if (!merchantUrl) {
      // RN's Alert is a no-op on web: fall back to window.alert so the
      // shopper still gets the explanatory prompt instead of a dead button.
      const message = 'The retailer link for this product is not available yet.';
      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(`Unavailable: ${message}`);
      } else {
        Alert.alert('Unavailable', message);
      }
      return;
    }
    // Analytics must never block the redirect: track best-effort first,
    // then open even if tracking throws.
    if (userId) {
      try {
        await trackMerchantRedirect(userId, productId);
      } catch (e) {
        console.error('Failed to track merchant redirect', e);
      }
    }
    try {
      trackEvent('affiliate_redirect', undefined, { variant: 'macro_v1', productId });
      await Linking.openURL(merchantUrl);
    } catch (e) {
      console.error('Failed to open merchant link', e);
      Alert.alert('Error', 'Could not open the retailer page.');
    }
  };

  return (
    <Button variant="outlined" size="small" icon={ExternalLink} onPress={handlePress} marginTop="$2">
      Shop on Merchant
    </Button>
  );
};
