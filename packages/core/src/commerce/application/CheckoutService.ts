import { Cart } from "../domain/Cart";
import { Order, OrderItem, Address, OrderStatus } from "../domain/Order";
import { PriceEstimator } from "../domain/PriceEstimator";

export interface OrderRepository {
    save(order: Order): Promise<void>;
    findById(id: string): Promise<Order | null>;
}

export class CheckoutService {
    constructor(private orderRepo: OrderRepository) { }

    async createOrderFromCart(
        cart: Cart,
        shippingAddress: Address,
        orderIdGenerator: () => string
    ): Promise<Order> {
        if (cart.items.length === 0) {
            throw new Error("Cannot checkout empty cart");
        }

        const priceBreakdown = PriceEstimator.estimate(cart);

        const orderItems = cart.items.map(item => new OrderItem(
            item.productId,
            item.quantity,
            item.price,
            item.attributes['brand'] || 'Unknown',
            `Product ${item.productId}`, // Placeholder: In real app, we'd fetch full details or store title in cart
            'https://placehold.co/100x100' // Placeholder
        ));

        const order = new Order(
            orderIdGenerator(),
            cart.userId,
            orderItems,
            shippingAddress,
            OrderStatus.PENDING,
            Date.now(),
            priceBreakdown.total,
            priceBreakdown.shipping,
            priceBreakdown.tax
        );

        await this.orderRepo.save(order);

        // Note: Cart clearing should be handled by the caller or a separate "clearCart" operation 
        // after successful order creation/payment.

        return order;
    }
}
