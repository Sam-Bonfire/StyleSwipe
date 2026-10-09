import { docBuilders } from './docs/builders.js';
import { asModel, withPrefixes } from './models/adapters.js';
import { fakeHashEmbedder } from './models/fake.js';
import { precomputedVectors } from './models/precomputed.js';
import {
  bgeBase,
  bgeLarge,
  bgeSmall,
  bgeSmallInstructBase,
  e5Base,
  e5Large,
  e5SmallBase,
  gteSmall,
  miniLm,
  mpnetBase,
  multilingualE5SmallBase,
  nomicEmbedBase,
} from './models/transformers.js';
import { queryBuilders } from './queries/builders.js';
import { registry } from './registry.js';

/** Registers every built-in variant. Call once before reading any config. */
export function registerBuiltins(): void {
  registry.registerModel(asModel(fakeHashEmbedder(64)));
  registry.registerModel(asModel(bgeSmall()));
  registry.registerModel(
    withPrefixes(bgeSmallInstructBase(), {
      queryPrefix: 'Represent this sentence for searching relevant passages: ',
    }),
  );
  registry.registerModel(asModel(miniLm()));
  registry.registerModel(asModel(gteSmall()));
  registry.registerModel(
    withPrefixes(nomicEmbedBase(), { queryPrefix: 'search_query: ', docPrefix: 'search_document: ' }),
  );
  // External runtimes (see README "external vectors"). Missing file throws
  // only when a config actually references the id — never at registration.
  registry.registerModel(precomputedVectors('needle3-20L', 'data/external/needle3-20L.json'));
  registry.registerModel(
    withPrefixes(e5SmallBase(), { queryPrefix: 'query: ', docPrefix: 'passage: ' }),
  );
  registry.registerModel(
    withPrefixes(multilingualE5SmallBase(), { queryPrefix: 'query: ', docPrefix: 'passage: ' }),
  );
  registry.registerModel(asModel(bgeBase()));
  registry.registerModel(
    withPrefixes(e5Base(), { queryPrefix: 'query: ', docPrefix: 'passage: ' }),
  );
  registry.registerModel(asModel(mpnetBase()));
  registry.registerModel(asModel(bgeLarge()));
  registry.registerModel(
    withPrefixes(e5Large(), { queryPrefix: 'query: ', docPrefix: 'passage: ' }),
  );
  for (const builder of docBuilders) registry.registerDoc(builder);
  for (const builder of queryBuilders) registry.registerQuery(builder);
}
