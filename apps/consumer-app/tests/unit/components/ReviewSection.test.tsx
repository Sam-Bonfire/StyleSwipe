import { describe, expect, it, vi } from 'vitest';

import { ReviewSection } from '../../../src/components/ReviewSection';
import { flushAsync, getAllByText, getByText, press, renderThemed } from '../../utils';

const baseProps = {
  productId: 'prod-1',
  onSubmit: () => Promise.resolve(),
  onHelpful: () => {},
  isAuthenticated: true,
};

describe('ReviewSection', () => {
  it('invites the first review when empty', () => {
    const renderer = renderThemed(
      <ReviewSection {...baseProps} reviews={[]} breakdown={undefined} />,
    );
    getByText(renderer.root, 'Ratings & Reviews');
    getByText(renderer.root, 'No reviews yet — be the first!');
  });

  it('rejects short review text', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    const renderer = renderThemed(
      <ReviewSection {...baseProps} onSubmit={onSubmit} reviews={[]} breakdown={undefined} />,
    );
    const box = renderer.root.findAll(
      (n) => n.props?.placeholder === 'Share your fit, quality and comfort...',
    )[0];
    const { act } = await import('react-test-renderer');
    act(() => {
      box.props.onChangeText('ok');
    });
    press(getByText(renderer.root, 'Submit review'));
    await flushAsync();
    getByText(renderer.root, 'Write at least 3 characters.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('blocks guests with the login message', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    const renderer = renderThemed(
      <ReviewSection {...baseProps} onSubmit={onSubmit} reviews={[]} breakdown={undefined} isAuthenticated={false} />,
    );
    const box = renderer.root.findAll(
      (n) => n.props?.placeholder === 'Share your fit, quality and comfort...',
    )[0];
    const { act } = await import('react-test-renderer');
    act(() => {
      box.props.onChangeText('great quality and fit');
    });
    press(getByText(renderer.root, 'Submit review'));
    await flushAsync();
    getByText(renderer.root, 'Please log in to submit a review.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid reviews and shows breakdown data', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    const renderer = renderThemed(
      <ReviewSection
        {...baseProps}
        onSubmit={onSubmit}
        reviews={[
          { _id: 'r1', rating: 5, text: 'Loved it', helpful: 3, createdAt: 1700000000000, userId: 'u1' },
        ]}
        breakdown={{ average: 4.5, count: 2, distribution: { 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 } }}
      />,
    );
    getByText(renderer.root, '4.5');
    getByText(renderer.root, '2 reviews');
    getByText(renderer.root, 'Loved it');
    const box = renderer.root.findAll(
      (n) => n.props?.placeholder === 'Share your fit, quality and comfort...',
    )[0];
    const { act } = await import('react-test-renderer');
    act(() => {
      box.props.onChangeText('fits perfectly');
    });
    // Fifth star selects rating 5.
    press(getAllByText(renderer.root, '★')[4]);
    press(getByText(renderer.root, 'Submit review'));
    await flushAsync();
    expect(onSubmit).toHaveBeenCalledWith({ rating: 5, text: 'fits perfectly' });
  });

  it('reports helpful votes', () => {
    const onHelpful = vi.fn();
    const renderer = renderThemed(
      <ReviewSection
        {...baseProps}
        onHelpful={onHelpful}
        reviews={[
          { _id: 'r9', rating: 4, text: 'Nice', helpful: 3, createdAt: 1700000000000, userId: 'u2' },
        ]}
        breakdown={undefined}
      />,
    );
    press(getByText(renderer.root, 'Helpful (3) ↑'));
    expect(onHelpful).toHaveBeenCalledWith('r9');
  });
});
