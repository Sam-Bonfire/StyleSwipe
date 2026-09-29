import { describe, expect, it, vi } from 'vitest';

import { TransactionalFooter } from '../../../components/TransactionalFooter';
import { getByText, press, renderThemed } from '../../utils';

describe('TransactionalFooter', () => {
  it('renders the formatted price and discount, and calls back on press', () => {
    const onAddToCart = vi.fn();
    const renderer = renderThemed(
      <TransactionalFooter price={366} originalPrice={2099} onAddToCart={onAddToCart} />,
    );
    getByText(renderer.root, '₹366');
    getByText(renderer.root, '83% OFF');
    press(getByText(renderer.root, 'Add to Bag'));
    expect(onAddToCart).toHaveBeenCalledTimes(1);
  });

  it('shows the bag state when already added', () => {
    const renderer = renderThemed(
      <TransactionalFooter price={366} onAddToCart={() => {}} isAdded />,
    );
    getByText(renderer.root, 'Go to Bag');
  });
});
