import { ShoppingBag } from '@tamagui/lucide-icons';
import { styled, XStack, YStack, Text, GetProps } from 'tamagui';

import Button from './Button';

const FooterFrame = styled(XStack, {
  name: 'TransactionalFooter',
  backgroundColor: '$surface',
  padding: '$2',
  borderTopWidth: 1,
  borderColor: '$borderColor',
  justifyContent: 'space-between',
  alignItems: 'center',
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  elevation: 4, // Android shadow
  shadowColor: '$shadowColor',
  shadowOpacity: 0.1,
  shadowRadius: 10,
});

const PriceContainer = styled(YStack, {
  name: 'FooterPriceContainer',
  flex: 1,
});

const TotalLabel = styled(Text, {
  name: 'FooterTotalLabel',
  fontSize: '$2',
  color: '$textSecondary',
  fontWeight: '500',
  marginBottom: 2,
});

const PriceText = styled(Text, {
  name: 'FooterPriceText',
  fontSize: '$5',
  color: '$textPrimary',
  fontWeight: '700',
});

export type TransactionalFooterProps = GetProps<typeof FooterFrame> & {
  price: number;
  originalPrice?: number;
  currency?: string;
  onAddToCart: () => void;
  isAdded?: boolean;
  isLoading?: boolean;
};

export const TransactionalFooter = ({
  price,
  originalPrice,
  currency = 'INR',
  onAddToCart,
  isAdded = false,
  isLoading = false,
  ...props
}: TransactionalFooterProps) => {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const discountPercentage = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <FooterFrame {...props}>
      <PriceContainer>
        <TotalLabel>Total Price</TotalLabel>
        <XStack alignItems="center" gap="$2">
          <PriceText>{formatPrice(price)}</PriceText>
          {originalPrice && originalPrice > price && (
            <>
              <Text fontSize="$3" color="$textSecondary" textDecorationLine="line-through">
                {formatPrice(originalPrice)}
              </Text>
              <Text fontSize="$3" color="$success" fontWeight="700">
                {discountPercentage}% OFF
              </Text>
            </>
          )}
        </XStack>
      </PriceContainer>

      <Button
        size="large"
        variant="primary"
        onPress={onAddToCart}
        disabled={isLoading}
        loading={isLoading}
        icon={isAdded ? <ShoppingBag size={20} color="white" /> : undefined}
      >
        {isAdded ? 'Go to Bag' : 'Add to Bag'}
      </Button>
    </FooterFrame>
  );
};

export default TransactionalFooter;
