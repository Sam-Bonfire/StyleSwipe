import { Cart, CartItem, CartRepository } from "@app/core";
import { ConvexClient } from "convex/browser";
// import { api } from "../../../../convex/_generated/api";
// PROVISIONAL: Mock API object until `convex codegen` is run (requires auth)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api: any = { cart: { saveCart: "cart:saveCart", getCart: "cart:getCart" } };

export class ConvexCartRepository implements CartRepository {
    constructor(private client: ConvexClient) { }

    async save(cart: Cart): Promise<void> {
        await this.client.mutation(api.cart.saveCart, {
            userId: cart.userId,
            items: cart.items.map(item => ({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                productId: item.productId as any, // ID casting
                quantity: item.quantity,
                price: item.price,
                attributes: item.attributes,
            })),
        });
    }

    async findByUserId(userId: string): Promise<Cart | null> {
        const cartData = await this.client.query(api.cart.getCart, { userId });
        if (!cartData) return null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = cartData.items.map((i: any) => new CartItem(
            i.productId,
            i.quantity,
            i.price,
            i.attributes || {}
        ));

        return new Cart(cartData.userId, items);
    }
}
