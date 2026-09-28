import { Embedder } from '@app/core';
import {
  createEventRepositoryLayer,
  createProductSearchRepositoryLayer,
} from '@app/infrastructure';
import { Layer } from 'effect';

import { OnnxEmbedder } from '../infrastructure/adapters/OnnxEmbedder';

/**
 * Layer composition root for the consumer app.
 *
 * Screens and hooks run Effect programs; they must not wire layers
 * inline. All `Layer.succeed` / `Layer.merge` composition lives here so
 * dependency wiring has exactly one home.
 *
 * Client types come from the factory signatures (no direct convex/*
 * imports — the apps eslint guardrail forbids them).
 */
type SearchClient = Parameters<typeof createProductSearchRepositoryLayer>[0];
type EventClient = Parameters<typeof createEventRepositoryLayer>[0];

export function makeSearchLayers(convex: SearchClient) {
  return Layer.merge(
    Layer.succeed(Embedder, Embedder.of(new OnnxEmbedder())),
    createProductSearchRepositoryLayer(convex),
  );
}

export function makeSuggestionLayers(convex: SearchClient) {
  return createProductSearchRepositoryLayer(convex);
}

export function makeEventLayers(convex: SearchClient) {
  // The event repository is built on the browser client while screens hold
  // the react client — single conversion point (was copy-pasted per screen).
  return createEventRepositoryLayer(convex as unknown as EventClient);
}
