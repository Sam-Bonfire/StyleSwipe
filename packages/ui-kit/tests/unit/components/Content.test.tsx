import { describe, expect, it, vi } from 'vitest';

import { FashionCard } from '../../../components/FashionCard';
import { ProductTile } from '../../../components/ProductTile';
import { SizeChipGroup, type SizeField } from '../../../components/SizeChipGroup';
import { TopBarIconButton } from '../../../components/TopBar';
import { getByText, press, renderThemed } from '../../utils';

describe('FashionCard', () => {
  it('renders content, discount badge, and handles presses', () => {
    const onPress = vi.fn();
    const onAddToCart = vi.fn();
    const renderer = renderThemed(
      <FashionCard
        imageUrl="https://example.com/a.jpg"
        brand="Anouk"
        title="Kurta"
        price={366}
        originalPrice={2099}
        discountPercentage={83}
        onPress={onPress}
        onAddToCart={onAddToCart}
      />,
    );
    getByText(renderer.root, 'Anouk');
    getByText(renderer.root, '83% OFF');
    press(getByText(renderer.root, 'Kurta'));
    expect(onPress).toHaveBeenCalledTimes(1);
    press(getByText(renderer.root, 'Add'));
    expect(onAddToCart).toHaveBeenCalledTimes(1);
  });
});

describe('ProductTile', () => {
  it('renders, opens on press, and shows sale state', () => {
    const onPress = vi.fn();
    const renderer = renderThemed(
      <ProductTile
        imageUrl="https://example.com/a.jpg"
        title="Kurta"
        brand="Anouk"
        price={366}
        originalPrice={499}
        discountPercentage={27}
        onPress={onPress}
      />,
    );
    press(getByText(renderer.root, 'Kurta'));
    expect(onPress).toHaveBeenCalledTimes(1);
    getByText(renderer.root, '27% OFF');
  });
});

describe('SizeChipGroup', () => {
  const fields: SizeField[] = [
    {
      id: 'size',
      label: 'Size',
      options: [
        { id: 'S', label: 'S' },
        { id: 'M', label: 'M' },
      ],
    },
  ];

  it('reports selections through onSizeChange', () => {
    const onSizeChange = vi.fn();
    const renderer = renderThemed(
      <SizeChipGroup fields={fields} selectedSizes={{}} onSizeChange={onSizeChange} />,
    );
    press(getByText(renderer.root, 'M'));
    expect(onSizeChange).toHaveBeenCalledWith('size', ['M']);
  });
});

describe('TopBarIconButton', () => {
  it('fires onPress', () => {
    const onPress = vi.fn();
    const renderer = renderThemed(<TopBarIconButton onPress={onPress}>Go</TopBarIconButton>);
    press(getByText(renderer.root, 'Go'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
