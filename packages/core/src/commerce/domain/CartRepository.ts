import { Cart } from "./Cart";

export interface CartRepository {
    save(cart: Cart): Promise<void>;
    findByUserId(userId: string): Promise<Cart | null>;
}
