import { describe, expect, it } from 'vitest';
import { createActor } from 'xstate';
import { swipeMachine } from '../../../src/state/swipeMachine';
import type { Product } from '@app/core/src/catalog/domain/Product';

const createMockProduct = (id: string): Product =>
  ({
    id,
    title: `Product ${id}`,
    description: 'A mock product',
    brand: 'MockBrand',
    category: 'MockCategory',
    price: 100,
    originalMrp: 150,
    discountPercentage: 33,
    gender: 'unisex',
    sizes: ['M', 'L'],
    colors: ['Red', 'Blue'],
    images: ['https://example.com/image.jpg'],
    embedding: new Array(384).fill(0),
    affiliateUrl: 'https://example.com/affiliate',
    inStock: true,
  } as Product);

describe('Swipe Machine', () => {
  it('should initialize in idle state', () => {
    const actor = createActor(swipeMachine).start();
    expect(actor.getSnapshot().value).toBe('idle');
    expect(actor.getSnapshot().context.deck).toEqual([]);
    expect(actor.getSnapshot().context.currentIndex).toBe(0);
  });

  it('should transition to deckReady on LOAD_DECK event', () => {
    const actor = createActor(swipeMachine).start();
    const mockDeck = [createMockProduct('1'), createMockProduct('2')];

    actor.send({ type: 'LOAD_DECK', deck: mockDeck });

    expect(actor.getSnapshot().value).toBe('deckReady');
    expect(actor.getSnapshot().context.deck).toEqual(mockDeck);
    expect(actor.getSnapshot().context.currentIndex).toBe(0);
  });

  it('should record history and advance index on SWIPE_RIGHT', () => {
    const actor = createActor(swipeMachine).start();
    const mockDeck = [createMockProduct('1'), createMockProduct('2')];
    actor.send({ type: 'LOAD_DECK', deck: mockDeck });

    expect(actor.getSnapshot().value).toBe('deckReady');

    actor.send({ type: 'SWIPE_RIGHT' });

    // After swiping, it should transiently be 'swiping' and immediately go back to 'deckReady'
    expect(actor.getSnapshot().value).toBe('deckReady');
    expect(actor.getSnapshot().context.currentIndex).toBe(1);
    expect(actor.getSnapshot().context.history).toHaveLength(1);
    expect(actor.getSnapshot().context.history[0].action).toBe('like');
    expect(actor.getSnapshot().context.history[0].product.id).toBe('1');
  });

  it('should immediately go to empty if LOAD_DECK provides an empty array', () => {
    const actor = createActor(swipeMachine).start();
    actor.send({ type: 'LOAD_DECK', deck: [] });
    expect(actor.getSnapshot().value).toBe('empty');
  });

  it('should go to empty state when all cards are swiped', () => {
    const actor = createActor(swipeMachine).start();
    const mockDeck = [createMockProduct('1')];
    actor.send({ type: 'LOAD_DECK', deck: mockDeck });

    actor.send({ type: 'SWIPE_LEFT' });

    // Current index becomes 1, deck length is 1 => empty state
    expect(actor.getSnapshot().value).toBe('empty');
    expect(actor.getSnapshot().context.currentIndex).toBe(1);
    expect(actor.getSnapshot().context.history[0].action).toBe('pass');
  });

  it('should perform rewind correctly when history is available', () => {
    const actor = createActor(swipeMachine).start();
    const mockDeck = [createMockProduct('1'), createMockProduct('2')];
    actor.send({ type: 'LOAD_DECK', deck: mockDeck });

    actor.send({ type: 'SWIPE_LEFT' });
    expect(actor.getSnapshot().context.currentIndex).toBe(1);
    expect(actor.getSnapshot().context.history).toHaveLength(1);

    // Ensure state changes on REWIND
    actor.send({ type: 'REWIND' });

    expect(actor.getSnapshot().context.currentIndex).toBe(0);
    expect(actor.getSnapshot().context.history).toHaveLength(0);
  });

  it('should prevent rewind when history is empty', () => {
    const actor = createActor(swipeMachine).start();
    const mockDeck = [createMockProduct('1')];
    actor.send({ type: 'LOAD_DECK', deck: mockDeck });

    // History is empty initially, so REWIND should be blocked by guard
    // Ensure state doesn't change
    actor.send({ type: 'REWIND' });
    expect(actor.getSnapshot().context.currentIndex).toBe(0);
  });

  it('should handle PARTNER_MATCH correctly', () => {
    const actor = createActor(swipeMachine).start();
    const mockDeck = [createMockProduct('1')];
    actor.send({ type: 'LOAD_DECK', deck: mockDeck });

    actor.send({ type: 'PARTNER_MATCH', product: mockDeck[0] });

    expect(actor.getSnapshot().value).toBe('partnerMatch');
    expect(actor.getSnapshot().context.partnerMatchProduct).toEqual(mockDeck[0]);

    actor.send({ type: 'DISMISS_MATCH' });
    expect(actor.getSnapshot().value).toBe('deckReady');
    expect(actor.getSnapshot().context.partnerMatchProduct).toBeUndefined();
  });

  it('should handle ERROR and RETRY correctly', () => {
    const actor = createActor(swipeMachine).start();

    actor.send({ type: 'ERROR', error: 'Network failure' });

    expect(actor.getSnapshot().value).toBe('error');
    expect(actor.getSnapshot().context.error).toBe('Network failure');

    actor.send({ type: 'RETRY' });
    expect(actor.getSnapshot().value).toBe('loading');
  });

  it('should append new cards on LOAD_DECK if already loaded', () => {
    const actor = createActor(swipeMachine).start();
    actor.send({ type: 'LOAD_DECK', deck: [createMockProduct('1')] });
    expect(actor.getSnapshot().context.deck).toHaveLength(1);

    actor.send({ type: 'LOAD_DECK', deck: [createMockProduct('2')] });
    // In our implementation, if we are in deckReady, it appends to the deck
    expect(actor.getSnapshot().context.deck).toHaveLength(2);
    expect(actor.getSnapshot().context.deck[1].id).toBe('2');
  });

  it('should reflect needsRefill implicitly', () => {
    // The requirements mention "trigger auto-refill event when remaining deck size falls below threshold (e.g. 5 cards)."
    // Let's test the boolean logic that we'd use in the hook for needsRefill
    // since XState v5 machines don't expose guards directly for synchronous testing.

    const actor = createActor(swipeMachine).start();
    const deck = Array.from({ length: 10 }, (_, i) => createMockProduct(`${i}`));
    actor.send({ type: 'LOAD_DECK', deck });

    const getNeedsRefill = (ctx: any) => ctx.deck.length - ctx.currentIndex <= 5;

    // Initial state: 10 cards left
    expect(getNeedsRefill(actor.getSnapshot().context)).toBe(false);

    // Swipe 5 times => 5 cards left
    for (let i = 0; i < 5; i++) actor.send({ type: 'SWIPE_LEFT' });

    expect(getNeedsRefill(actor.getSnapshot().context)).toBe(true);
  });
});
