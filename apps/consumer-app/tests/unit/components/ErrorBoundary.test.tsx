import React from 'react';
import TestRenderer from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loggerErrorMock = vi.hoisted(() => vi.fn());

vi.mock('@app/logger', () => ({
  Logger: class {
    error = loggerErrorMock;
    warn = () => {};
    info = () => {};
    debug = () => {};
    addBreadcrumb = () => {};
    setUserId = () => {};
  },
  ConsoleTransport: class {},
  ConvexTransport: class {},
  enableConsoleCapture: () => {},
  enableNetworkInterception: () => {},
}));

import { ErrorBoundary } from '../../../src/components/ErrorBoundary';
import { getByText, press, renderThemed } from '../../utils';

function Boom({ message }: { message: string }): React.JSX.Element {
  throw new Error(message);
}

describe('ErrorBoundary', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('renders the fallback without any theme provider', () => {
    // No TamaguiProvider here on purpose: the boundary wraps the provider
    // in the real tree, so its fallback must never touch theme context.
    // (Render without renderThemed.)
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <ErrorBoundary>
          <Boom message="kaboom" />
        </ErrorBoundary>,
      );
    });
    getByText(renderer!.root, 'Oops! Something went wrong.');
    getByText(renderer!.root, 'Try Again');
    getByText(renderer!.root, 'Go Home');
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'Unhandled React Exception',
      expect.any(Error),
      expect.objectContaining({ platform: expect.any(String) }),
    );
  });

  it('recovers through Try Again once the child stops throwing', () => {
    let shouldThrow = true;
    const Flaky = () => {
      if (shouldThrow) throw new Error('boom');
      return <div>Recovered</div>;
    };
    const renderer = renderThemed(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    );
    getByText(renderer.root, 'Oops! Something went wrong.');
    shouldThrow = false;
    press(getByText(renderer.root, 'Try Again'));
    getByText(renderer.root, 'Recovered');
  });
});
