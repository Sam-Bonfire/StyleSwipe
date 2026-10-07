import { docBuilders } from './docs/builders.js';
import { fakeHashEmbedder } from './models/fake.js';
import {
  bgeSmall,
  bgeSmallInstruct,
  e5Small,
  miniLm,
  multilingualE5Small,
} from './models/transformers.js';
import { queryBuilders } from './queries/builders.js';
import { registry } from './registry.js';

/** Registers every built-in variant. Call once before reading any config. */
export function registerBuiltins(): void {
  registry.registerModel(fakeHashEmbedder(64));
  registry.registerModel(bgeSmall());
  registry.registerModel(bgeSmallInstruct());
  registry.registerModel(miniLm());
  registry.registerModel(e5Small());
  registry.registerModel(multilingualE5Small());
  for (const builder of docBuilders) registry.registerDoc(builder);
  for (const builder of queryBuilders) registry.registerQuery(builder);
}
