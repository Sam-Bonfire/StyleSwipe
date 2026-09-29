import { describe, expect, it, vi } from 'vitest';

import { CategoryChip } from '../../../components/CategoryChip';
import { getByText, press, renderThemed } from '../../utils';

describe('CategoryChip', () => {
  it('renders the label and toggles selection on press', () => {
    const onToggle = vi.fn();
    const renderer = renderThemed(<CategoryChip label="Kurtas" onToggle={onToggle} />);
    press(getByText(renderer.root, 'Kurtas'));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('reports deselection when already selected', () => {
    const onToggle = vi.fn();
    const renderer = renderThemed(<CategoryChip label="Kurtas" selected onToggle={onToggle} />);
    press(getByText(renderer.root, 'Kurtas'));
    expect(onToggle).toHaveBeenCalledWith(false);
  });
});
