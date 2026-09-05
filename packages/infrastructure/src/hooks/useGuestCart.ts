import { api } from '@app/convex';
import { useConvex } from 'convex/react';
import { useCallback, useEffect, useState } from 'react';

export type GuestCartItem = {
  productId: string;
  quantity: number;
  price: number;
  attributes?: Record<string, string>;
};

const STORAGE_KEY = 'guest_cart_v1';

function readGuestCart(): GuestCartItem[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw: string | null = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GuestCartItem[]) : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items: GuestCartItem[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

export function useGuestCart() {
  const [items, setItems] = useState<GuestCartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    setItems(readGuestCart());
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (item: GuestCartItem) => {
      const existing: GuestCartItem[] = readGuestCart();
      const idx: number = existing.findIndex((g: GuestCartItem) => g.productId === item.productId);
      if (idx >= 0) {
        existing[idx] = { ...existing[idx], quantity: existing[idx].quantity + item.quantity };
      } else {
        existing.push(item);
      }
      writeGuestCart(existing);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (productId: string) => {
      writeGuestCart(readGuestCart().filter((g: GuestCartItem) => g.productId !== productId));
      await refresh();
    },
    [refresh],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      writeGuestCart(
        readGuestCart().map((g: GuestCartItem) => (g.productId === productId ? { ...g, quantity } : g)),
      );
      await refresh();
    },
    [refresh],
  );

  const clear = useCallback(async () => {
    writeGuestCart([]);
    await refresh();
  }, [refresh]);

  return { items, loading, refresh, add, remove, updateQuantity, clear };
}

export function useGuestCartMerge() {
  const convex = useConvex();
  return useCallback(
    async (userId: string) => {
      const guestItems: GuestCartItem[] = readGuestCart();
      if (guestItems.length === 0) return;
      const mapped = guestItems.map((g: GuestCartItem) => ({
        productId: g.productId as never,
        quantity: g.quantity,
        price: g.price,
        attributes: g.attributes,
      }));
      await convex.mutation(api.cart.mergeGuestCart, { userId, guestItems: mapped });
      writeGuestCart([]);
    },
    [convex],
  );
}
