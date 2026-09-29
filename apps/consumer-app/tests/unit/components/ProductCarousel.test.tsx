import { describe, expect, it, vi } from 'vitest';

import { ProductCarousel } from '../../../src/components/ProductCarousel';
import { getByText, press, renderThemed } from '../../utils';

describe('ProductCarousel', () => {
  it('shows a spinner while loading', () => {
    const renderer = renderThemed(
      <ProductCarousel data={undefined} isLoading onProductPress={() => {}} />,
    );
    expect(renderer.root).toBeTruthy();
  });

  it('shows the empty message without data', () => {
    const renderer = renderThemed(
      <ProductCarousel data={[]} isLoading={false} onProductPress={() => {}} emptyMessage="Nothing here" />,
    );
    getByText(renderer.root, 'Nothing here');
  });

  it('renders products and reports presses with ids', () => {
    const onProductPress = vi.fn();
    const renderer = renderThemed(
      <ProductCarousel
        data={[
          { _id: 'p1', title: 'Kurta', brand: 'Anouk', price: 366, images: ['https://example.com/a.jpg'] },
        ]}
        isLoading={false}
        onProductPress={onProductPress}
      />,
    );
    press(getByText(renderer.root, 'Kurta'));
    expect(onProductPress).toHaveBeenCalledWith('p1');
  });
});
