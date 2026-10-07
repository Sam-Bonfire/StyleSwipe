import type { DocBuilder, ModelAdapter, QueryBuilder } from './types.js';

const models = new Map<string, ModelAdapter>();
const docs = new Map<string, DocBuilder>();
const queries = new Map<string, QueryBuilder>();

function register<T extends { id: string }>(map: Map<string, T>, item: T, kind: string): void {
  if (map.has(item.id)) throw new Error(`Duplicate ${kind} id: ${item.id}`);
  map.set(item.id, item);
}

function lookup<T>(map: Map<string, T>, id: string, kind: string): T {
  const item = map.get(id);
  if (!item) {
    throw new Error(`Unknown ${kind} "${id}". Registered: ${[...map.keys()].join(', ') || '(none)'}`);
  }
  return item;
}

export const registry = {
  registerModel: (adapter: ModelAdapter): void => register(models, adapter, 'model'),
  registerDoc: (builder: DocBuilder): void => register(docs, builder, 'doc'),
  registerQuery: (builder: QueryBuilder): void => register(queries, builder, 'query'),
  model: (id: string): ModelAdapter => lookup(models, id, 'model'),
  doc: (id: string): DocBuilder => lookup(docs, id, 'doc'),
  query: (id: string): QueryBuilder => lookup(queries, id, 'query'),
  modelIds: (): string[] => [...models.keys()],
  docIds: (): string[] => [...docs.keys()],
  queryIds: (): string[] => [...queries.keys()],
  clear: (): void => {
    models.clear();
    docs.clear();
    queries.clear();
  },
};
