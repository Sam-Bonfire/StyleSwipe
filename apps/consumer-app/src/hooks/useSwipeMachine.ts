import type { Product } from '@app/core/src/catalog/domain/Product';

import { useMachine } from '@xstate/react';

import { swipeMachine, SwipeMachineEvents } from '../state/swipeMachine';

export const useSwipeMachine = () => {
  const [state, send] = useMachine(swipeMachine);

  const activeCard: Product | undefined =
    state.context.deck[state.context.currentIndex];

  const canRewind = state.can({ type: 'REWIND' });
  const hasCardsLeft = state.context.currentIndex < state.context.deck.length;
  const isMatchOverlayOpen = state.matches('partnerMatch');
  const needsRefill = state.context.deck.length - state.context.currentIndex <= 5;

  const dispatch = (event: SwipeMachineEvents) => {
    send(event);
  };

  return {
    state,
    context: state.context,
    activeCard,
    canRewind,
    hasCardsLeft,
    needsRefill,
    isMatchOverlayOpen,
    dispatch,
    send,
  };
};
