import { createCart, type Cart, type CartItem } from '@app/core';

export const CartMapper = {
    toDomain(data: {
        userId: string;
        items: {
            productId: string;
            quantity: number;
            price: number;
            variantId?: string;
            selectedAttributes?: Record<string, string>;
            attributes?: Record<string, string>;
        }[];
    }): Cart {
        const items: CartItem[] = data.items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            price: i.price,
            selectedAttributes: i.selectedAttributes || i.attributes || {},
        }));

        return createCart({
            userId: data.userId,
            items,
        });
    },
};
