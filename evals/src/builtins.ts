import { docBuilders } from './docs/builders.js';
import { asModel, withPrefixes } from './models/adapters.js';
import { fakeHashEmbedder } from './models/fake.js';
import {
  bgeBase,
  bgeLarge,
  bgeSmall,
  bgeSmallInstructBase,
  e5Base,
  e5Large,
  e5SmallBase,
  miniLm,
  mpnetBase,
  multilingualE5SmallBase,
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
