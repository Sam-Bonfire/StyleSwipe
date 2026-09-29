import { describe, expect, it, vi } from 'vitest';

import { Button } from '../../../components/Button';
import { getByText, press, renderThemed } from '../../utils';

describe('Button', () => {
  it('renders children and fires onPress', () => {
    const onPress = vi.fn();
    const renderer = renderThemed(<Button onPress={onPress}>Tap me</Button>);
    press(getByText(renderer.root, 'Tap me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', () => {
    const onPress = vi.fn();
    const renderer = renderThemed(
      <Button onPress={onPress} disabled>
        Nope
      </Button>,
    );
    expect(() => press(getByText(renderer.root, 'Nope'))).toThrow(/blocked/);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a spinner instead of children while loading', () => {
    const renderer = renderThemed(<Button loading>Busy</Button>);
    expect(() => getByText(renderer.root, 'Busy')).toThrow();
  });
});
