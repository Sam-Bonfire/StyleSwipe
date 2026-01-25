export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED'
}

export interface Address {
    fullName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
}

export class OrderItem {
    constructor(
        public productId: string,
        public quantity: number,
        public price: number,
        public brand: string,
        public title: string,
        public image: string
    ) { }

    get total(): number {
        return this.price * this.quantity;
    }
}

export class Order {
    constructor(
        public id: string,
        public userId: string,
        public items: OrderItem[],
        public shippingAddress: Address,
        public status: OrderStatus = OrderStatus.PENDING,
        public createdAt: number = Date.now(),
        public totalAmount: number,
        public shippingCost: number,
        public tax: number
    ) { }
}
