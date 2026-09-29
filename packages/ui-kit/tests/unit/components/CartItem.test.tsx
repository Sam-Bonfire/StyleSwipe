import { Minus, Plus, Trash2 } from '@tamagui/lucide-icons';
import { describe, expect, it, vi } from 'vitest';

import { CartItem } from '../../../components/CartItem';
import { getByText, press, renderThemed } from '../../utils';

function renderItem(overrides = {}) {
  const handlers = { onQuantityChange: vi.fn(), onRemove: vi.fn() };
  const renderer = renderThemed(
    <CartItem
      imageUrl="https://example.com/a.jpg"
      brand="Anouk"
      title="Kurta"
      price={366}
      originalPrice={2099}
      quantity={1}
      onQuantityChange={handlers.onQuantityChange}
      onRemove={handlers.onRemove}
      {...overrides}
    />,
  );
  return { renderer, handlers };
}

describe('CartItem', () => {
  it('renders brand, title, quantity, and scaled prices', () => {
    const { renderer } = renderItem();
    getByText(renderer.root, 'Anouk');
    getByText(renderer.root, 'Kurta');
    getByText(renderer.root, '₹366');
  });

  it('increases quantity through the plus control', () => {
    const { renderer, handlers } = renderItem({ quantity: 2 });
    press(renderer.root.findByType(Plus));
    expect(handlers.onQuantityChange).toHaveBeenCalledWith(3);
  });

  it('does not decrease below one', () => {
    const { renderer, handlers } = renderItem({ quantity: 1 });
    expect(() => press(renderer.root.findByType(Minus))).toThrow(/blocked/);
    expect(handlers.onQuantityChange).not.toHaveBeenCalled();
  });

  it('removes through the trash control', () => {
    const { renderer, handlers } = renderItem();
    press(renderer.root.findByType(Trash2));
    expect(handlers.onRemove).toHaveBeenCalledTimes(1);
  });

  it('does not increase past the maximum quantity', () => {
    const { renderer, handlers } = renderItem({ quantity: 10, maxQuantity: 10 });
    expect(() => press(renderer.root.findByType(Plus))).toThrow(/blocked/);
    expect(handlers.onQuantityChange).not.toHaveBeenCalled();
  });
});
