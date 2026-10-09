import type { ModelAdapter, SimpleModel } from '../types.js';

/** Lifts a symmetric core to the runner-facing interface (role ignored). */
export function asModel(base: SimpleModel): ModelAdapter {
  return {
    id: base.id,
    dims: base.dims,
    approxBytes: base.approxBytes,
    version: base.version,
    embed: (texts: string[]): Promise<number[][]> => base.embed(texts),
  };
}

export interface RolePrefixes {
  queryPrefix?: string;
  docPrefix?: string;
}

/**
 * Lifts a symmetric core with retrieval-style role prefixes (E5's
 * `query:`/`passage:`, BGE's instruction). Only prefixed models go through
 * here — everyone else uses `asModel` and never learns what a role is.
 */
export function withPrefixes(base: SimpleModel, prefixes: RolePrefixes): ModelAdapter {
  return {
    id: base.id,
    dims: base.dims,
    approxBytes: base.approxBytes,
    version: base.version,
    embed: (texts: string[], role: 'query' | 'doc'): Promise<number[][]> => {
      const prefix = role === 'query' ? (prefixes.queryPrefix ?? '') : (prefixes.docPrefix ?? '');
      return base.embed(texts.map((t) => `${prefix}${t}`));
    },
  };
}
