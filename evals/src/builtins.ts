import { docBuilders } from './docs/builders.js';
import { fakeHashEmbedder } from './models/fake.js';
import { bgeMicro, bgeSmall, e5Small, miniLm } from './models/transformers.js';
import { queryBuilders } from './queries/builders.js';
import { registry } from './registry.js';

/** Registers every built-in variant. Call once before reading any config. */
export function registerBuiltins(): void {
  registry.registerModel(fakeHashEmbedder(64));
  registry.registerModel(bgeSmall());
  registry.registerModel(miniLm());
  registry.registerModel(e5Small());
  registry.registerModel(bgeMicro());
  for (const builder of docBuilders) registry.registerDoc(builder);
  for (const builder of queryBuilders) registry.registerQuery(builder);
}
