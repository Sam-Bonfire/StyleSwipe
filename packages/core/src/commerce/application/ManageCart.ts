import { Cart, CartItem } from "../domain/Cart";
import { CartRepository } from "../domain/CartRepository";

export class ManageCart {
    constructor(private repo: CartRepository) { }

    async addToCart(userId: string, item: CartItem): Promise<Cart> {
        let cart = await this.repo.findByUserId(userId);
        if (!cart) {
            cart = new Cart(userId);
        }
        cart.addItem(item);
        await this.repo.save(cart);
        return cart;
    }

    async removeFromCart(userId: string, productId: string): Promise<Cart> {
        const cart = await this.repo.findByUserId(userId);
        if (!cart) {
            throw new Error("Cart not found");
        }
        cart.removeItem(productId);
        await this.repo.save(cart);
        return cart;
    }

    async updateQuantity(userId: string, productId: string, quantity: number): Promise<Cart> {
        const cart = await this.repo.findByUserId(userId);
        if (!cart) {
            throw new Error("Cart not found");
        }
        cart.updateItemQuantity(productId, quantity);
        await this.repo.save(cart);
        return cart;
    }

    async getCart(userId: string): Promise<Cart | null> {
        return this.repo.findByUserId(userId);
    }
}
