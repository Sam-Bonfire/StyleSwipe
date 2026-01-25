export class CartItem {
    constructor(
        public productId: string,
        public quantity: number,
        public price: number,
        public attributes: Record<string, string>
    ) { }

    get total(): number {
        return this.price * this.quantity;
    }
}

export class Cart {
    constructor(
        public userId: string,
        public items: CartItem[] = []
    ) { }

    addItem(item: CartItem): void {
        const existing = this.items.find(i => i.productId === item.productId);
        if (existing) {
            existing.quantity += item.quantity;
        } else {
            this.items.push(item);
        }
    }

    updateItemQuantity(productId: string, quantity: number): void {
        const existing = this.items.find(i => i.productId === productId);
        if (existing) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                existing.quantity = quantity;
            }
        }
    }

    removeItem(productId: string): void {
        this.items = this.items.filter(i => i.productId !== productId);
    }

    get total(): number {
        return this.items.reduce((sum, item) => sum + item.total, 0);
    }
}
