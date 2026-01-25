import { ShoppingBag } from '@tamagui/lucide-icons';
import { styled, XStack, YStack, Text, Button, GetProps } from 'tamagui';

const FooterFrame = styled(XStack, {
    name: 'TransactionalFooter',
    backgroundColor: '$surface',
    padding: '$3',
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
});

const TotalLabel = styled(Text, {
    name: 'FooterTotalLabel',
    fontSize: '$2',
    color: '$textSecondary',
    fontWeight: '500',
});

const PriceText = styled(Text, {
    name: 'FooterPriceText',
    fontSize: '$6',
    color: '$textPrimary',
    fontWeight: '700',
});

const ActionButton = styled(Button, {
    name: 'FooterActionButton',
    backgroundColor: '$primary',
    borderRadius: '$4',
    paddingHorizontal: '$4',
    elevation: 2,

    hoverStyle: {
        backgroundColor: '$primaryDark',
    },
    pressStyle: {
        backgroundColor: '$primaryDark',
    },
});

export type TransactionalFooterProps = GetProps<typeof FooterFrame> & {
    price: number;
    currency?: string;
    onAddToCart: () => void;
    isAdded?: boolean;
    isLoading?: boolean;
};

export const TransactionalFooter = ({
    price,
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

    return (
        <FooterFrame {...props}>
            <PriceContainer>
                <TotalLabel>Total Price</TotalLabel>
                <PriceText>{formatPrice(price)}</PriceText>
            </PriceContainer>

            <ActionButton
                size="$4"
                onPress={onAddToCart}
                disabled={isLoading}
                icon={isAdded ? <ShoppingBag size={20} color="white" /> : undefined}
            >
                <Text color="white" fontWeight="600" fontSize="$4">
                    {isLoading ? 'Adding...' : isAdded ? 'Go to Bag' : 'Add to Bag'}
                </Text>
            </ActionButton>
        </FooterFrame>
    );
};

export default TransactionalFooter;
