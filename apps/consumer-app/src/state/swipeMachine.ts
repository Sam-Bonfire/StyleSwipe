import { setup, assign } from 'xstate';
import type { Product } from '@app/core/src/catalog/domain/Product';

export type SwipeAction = 'like' | 'pass' | 'super';

export interface SwipeHistoryItem {
  product: Product;
  action: SwipeAction;
  timestamp: number;
}

export interface SwipeMachineContext {
  deck: Product[];
  currentIndex: number;
  history: SwipeHistoryItem[];
  partnerMatchProduct?: Product;
  error?: string;
}

export type SwipeMachineEvents =
  | { type: 'LOAD_DECK'; deck: Product[] }
  | { type: 'SWIPE_LEFT' }
  | { type: 'SWIPE_RIGHT' }
  | { type: 'SUPER_LIKE' }
  | { type: 'REWIND' }
  | { type: 'DISMISS_MATCH' }
  | { type: 'RETRY' }
  | { type: 'PARTNER_MATCH'; product: Product }
  | { type: 'ERROR'; error: string };

export const swipeMachine = setup({
  types: {
    context: {} as SwipeMachineContext,
    events: {} as SwipeMachineEvents,
  },
  actions: {
    setDeck: assign({
      deck: ({ event }) => (event.type === 'LOAD_DECK' ? event.deck : []),
      currentIndex: 0,
      error: undefined,
    }),
    appendDeck: assign({
      deck: ({ context, event }) => {
        if (event.type === 'LOAD_DECK') {
          return [...context.deck, ...event.deck];
        }
        return context.deck;
      },
    }),
    recordSwipe: assign({
      history: ({ context, event }) => {
        const currentProduct = context.deck[context.currentIndex];
        if (!currentProduct) return context.history;

        let action: SwipeAction;
        if (event.type === 'SWIPE_LEFT') action = 'pass';
        else if (event.type === 'SWIPE_RIGHT') action = 'like';
        else if (event.type === 'SUPER_LIKE') action = 'super';
        else return context.history;

        return [
          ...context.history,
          {
            product: currentProduct,
            action,
            timestamp: Date.now(),
          },
        ];
      },
      currentIndex: ({ context }) => context.currentIndex + 1,
    }),
    performRewind: assign({
      history: ({ context }) => context.history.slice(0, -1),
      currentIndex: ({ context }) => Math.max(0, context.currentIndex - 1),
    }),
    setPartnerMatch: assign({
      partnerMatchProduct: ({ event }) =>
        event.type === 'PARTNER_MATCH' ? event.product : undefined,
    }),
    clearPartnerMatch: assign({
      partnerMatchProduct: undefined,
    }),
    setError: assign({
      error: ({ event }) => (event.type === 'ERROR' ? event.error : undefined),
    }),
  },
  guards: {
    canRewind: ({ context }) => context.history.length > 0 && context.currentIndex > 0,
    hasCardsLeft: ({ context }) => context.currentIndex < context.deck.length,
    needsRefill: ({ context }) => context.deck.length - context.currentIndex <= 5,
  },
}).createMachine({
  id: 'swipeEngine',
  initial: 'idle',
  context: {
    deck: [],
    currentIndex: 0,
    history: [],
  },
  states: {
    idle: {
      on: {
        LOAD_DECK: {
          target: 'deckReady',
          actions: 'setDeck',
        },
        ERROR: {
          target: 'error',
          actions: 'setError',
        },
      },
    },
    loading: {
      on: {
        LOAD_DECK: {
          target: 'deckReady',
          actions: 'setDeck',
        },
        ERROR: {
          target: 'error',
          actions: 'setError',
        },
      },
    },
    deckReady: {
      always: [
        {
          guard: ({ context }) => context.currentIndex >= context.deck.length,
          target: 'empty',
        },
      ],
      on: {
        SWIPE_LEFT: {
          target: 'swiping',
        },
        SWIPE_RIGHT: {
          target: 'swiping',
        },
        SUPER_LIKE: {
          target: 'swiping',
        },
        REWIND: {
          guard: 'canRewind',
          actions: 'performRewind',
        },
        LOAD_DECK: {
          actions: 'appendDeck',
        },
        PARTNER_MATCH: {
          target: 'partnerMatch',
          actions: 'setPartnerMatch',
        },
        ERROR: {
          target: 'error',
          actions: 'setError',
        },
      },
    },
    swiping: {
      always: {
        target: 'deckReady',
        actions: 'recordSwipe',
      },
    },
    partnerMatch: {
      on: {
        DISMISS_MATCH: {
          target: 'deckReady',
          actions: 'clearPartnerMatch',
        },
      },
    },
    empty: {
      on: {
        LOAD_DECK: {
          target: 'deckReady',
          actions: 'setDeck',
        },
        REWIND: {
          guard: 'canRewind',
          target: 'deckReady',
          actions: 'performRewind',
        },
        ERROR: {
          target: 'error',
          actions: 'setError',
        },
      },
    },
    error: {
      on: {
        RETRY: 'loading',
      },
    },
  },
});
