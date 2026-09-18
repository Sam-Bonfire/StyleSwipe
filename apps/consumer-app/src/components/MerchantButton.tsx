import { useProductSourceUrl, useTrackMerchantRedirect, useAnalytics, useCurrentUser } from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import { ExternalLink } from '@tamagui/lucide-icons';
import React from 'react';
import { Alert, Linking } from 'react-native';

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
      Alert.alert('Unavailable', 'The retailer link for this product is not available yet.');
      return;
    }
    try {
      if (userId) await trackMerchantRedirect(userId, productId);
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
