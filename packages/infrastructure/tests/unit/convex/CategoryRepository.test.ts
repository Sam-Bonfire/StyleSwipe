import { CategoryRepository } from '@app/core';
import { ConvexClient } from 'convex/browser';
import { Effect } from 'effect';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { createCategoryRepositoryLayer } from '../../../src/convex/repositories/CategoryRepository';

describe('CategoryRepository', () => {
  let mockClient: any;
  let layer: any;

  beforeEach(() => {
    mockClient = {
      query: vi.fn(),
      mutation: vi.fn(),
    };
    layer = createCategoryRepositoryLayer(mockClient as unknown as ConvexClient);
  });

  const mockDoc = {
    _id: '123',
    name: 'Tops',
    slug: 'tops',
    parentId: '456',
    level: 1,
    image: 'https://example.com/tops.jpg',
  };

  it('findById', async () => {
    mockClient.query.mockResolvedValue(mockDoc);
    const result = await Effect.runPromise(
      Effect.provide(
        Effect.flatMap(CategoryRepository, (repo) => repo.findById('123')),
        layer
      )
    );
    expect(result).toMatchObject({
      id: '123',
      name: 'Tops',
      slug: 'tops',
      parentId: '456',
      level: 1,
      image: 'https://example.com/tops.jpg',
    });
  });

  it('findBySlug', async () => {
    mockClient.query.mockResolvedValue(mockDoc);
    const result = await Effect.runPromise(
      Effect.provide(
        Effect.flatMap(CategoryRepository, (repo) => repo.findBySlug('tops')),
        layer
      )
    );
    expect(result).toMatchObject({ id: '123' });
  });

  it('listTree', async () => {
    mockClient.query.mockResolvedValue([mockDoc]);
    const result = await Effect.runPromise(
      Effect.provide(
        Effect.flatMap(CategoryRepository, (repo) => repo.listTree()),
        layer
      )
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: '123' });
  });

  it('listRootCategories', async () => {
    mockClient.query.mockResolvedValue([mockDoc]);
    const result = await Effect.runPromise(
      Effect.provide(
        Effect.flatMap(CategoryRepository, (repo) => repo.listRootCategories()),
        layer
      )
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: '123' });
  });

  it('save', async () => {
    mockClient.mutation.mockResolvedValue('123');
    const result = await Effect.runPromise(
      Effect.provide(
        Effect.flatMap(CategoryRepository, (repo) => repo.save({
          id: '123',
          name: 'Tops',
          slug: 'tops'
        })),
        layer
      )
    );
    expect(result).toMatchObject({ id: '123', name: 'Tops', slug: 'tops' });
  });

  it('delete', async () => {
    mockClient.mutation.mockResolvedValue(undefined);
    await Effect.runPromise(
      Effect.provide(
        Effect.flatMap(CategoryRepository, (repo) => repo.delete('123')),
        layer
      )
    );
    expect(mockClient.mutation).toHaveBeenCalled();
  });
});
