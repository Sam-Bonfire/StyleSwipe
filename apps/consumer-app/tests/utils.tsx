import { config } from '@app/ui-kit/theme';
import React from 'react';
import TestRenderer, { type ReactTestInstance } from 'react-test-renderer';
import { TamaguiProvider } from 'tamagui';

export function renderThemed(ui: React.ReactElement): TestRenderer.ReactTestRenderer {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  TestRenderer.act(() => {
    renderer = TestRenderer.create(
      <TamaguiProvider config={config} defaultTheme="BrandIdentityLight">
        {ui}
      </TamaguiProvider>,
    );
  });
  if (!renderer) throw new Error('Failed to render');
  return renderer;
}

export function getByText(root: ReactTestInstance, text: string): ReactTestInstance {
  const found = getAllByText(root, text);
  if (found.length === 0) throw new Error(`No element with text: ${text}`);
  return found[0];
}

export function getAllByText(root: ReactTestInstance, text: string): ReactTestInstance[] {
  return root.findAll(
    (node) =>
      node.children.length > 0 &&
      node.children.every((child) => typeof child === 'string' || typeof child === 'number') &&
      node.children.join('') === text,
  );
}

const fakeEvent = { stopPropagation: () => {}, preventDefault: () => {} };

/** Invokes the nearest onPress up the tree (mirrors press bubbling). */
export function press(node: ReactTestInstance): void {
  let current: ReactTestInstance | null = node;
  while (current) {
    const props = (current.props ?? {}) as Record<string, unknown>;
    if (props.disabled === true) throw new Error('press blocked: disabled');
    const pointerEvents =
      props.pointerEvents ?? (props.style as Record<string, unknown> | undefined)?.pointerEvents;
    if (pointerEvents === 'none') throw new Error('press blocked: pointer-events none');
    if (typeof props.onPress === 'function') {
      TestRenderer.act(() => {
        ((current as ReactTestInstance).props as { onPress: (e: unknown) => void }).onPress(fakeEvent);
      });
      return;
    }
    current = current.parent;
  }
  throw new Error('No onPress handler found');
}

/** Flushes pending promise continuations (mutation results, effects). */
export async function flushAsync(): Promise<void> {
  await TestRenderer.act(async () => {});
}
