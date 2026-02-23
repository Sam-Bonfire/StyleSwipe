import { Cart, CartItem } from '@app/core';

export const CartMapper = {
    toDomain(data: {
        userId: string;
        items: {
            productId: string;
            quantity: number;
            price: number;
            attributes?: Record<string, string>;
        }[];
    }): Cart {
        const items = data.items.map(
            (i) => new CartItem(i.productId, i.quantity, i.price, i.attributes || {}),
        );

        return new Cart(data.userId, items);
    },
};
