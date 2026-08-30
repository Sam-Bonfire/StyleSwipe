import { Effect, Layer } from 'effect';
import { describe, expect, it } from 'vitest';

import type { Category } from '../../../../src/catalog/domain/Category';
import type { Product } from '../../../../src/catalog/domain/Product';

import { AssetStorageService, CategoryRepository, ProductRepository } from '../../../../src/catalog/application/ports';
import { AssetStorageError, RepositoryError } from '../../../../src/catalog/domain/errors';

describe('Catalog Application Ports', () => {
  it('ProductRepository should define expected methods', async () => {
    const mockProduct: Product = {
      id: 'prod-1',
      title: 'Test Product',
      brand: 'Test Brand',
      price: 100,
      originalMrp: 120,
      discountPercentage: 16.67,
      category: 'cat-1',
      gender: 'unisex',
      sizes: ['M'],
      colors: ['Red'],
      images: ['https://example.com/image.jpg'],
      embedding: Array(384).fill(0.1),
      affiliateUrl: 'https://example.com/affiliate',
      inStock: true
    };

    const MockProductRepo = Layer.succeed(
      ProductRepository,
      ProductRepository.of({
        findById: (id) => Effect.succeed(id === 'prod-1' ? mockProduct : null),
        findBySlug: () => Effect.fail(new RepositoryError('Not implemented')),
        search: () => Effect.succeed({ items: [mockProduct], total: 1 }),
        findByCategory: () => Effect.succeed([mockProduct]),
        findByCategoryAndPrice: () => Effect.succeed([]),
        findByBrand: () => Effect.succeed([]),
        searchByTitle: () => Effect.succeed([]),
        findSimilar: () => Effect.succeed([]),
        create: () => Effect.succeed(mockProduct),
        update: () => Effect.succeed(mockProduct),
        updateEmbedding: () => Effect.succeed(mockProduct),
        getLatest: () => Effect.succeed([]),
        save: (product) => Effect.succeed(product),
        batchSave: (products) => Effect.succeed(products),
        delete: () => Effect.succeed(undefined)
      })
    );

    const program = Effect.gen(function* (_) {
      const repo = yield* _(ProductRepository);
      const product = yield* _(repo.findById('prod-1'));
      return product;
    });

    const result = await Effect.runPromise(program.pipe(Effect.provide(MockProductRepo)));
    expect(result).toEqual(mockProduct);
  });

  it('CategoryRepository should define expected methods', async () => {
    const mockCategory: Category = {
      id: 'cat-1',
      name: 'Test Category',
      slug: 'test-category'
    };

    const MockCategoryRepo = Layer.succeed(
      CategoryRepository,
      CategoryRepository.of({
        findById: (id) => Effect.succeed(id === 'cat-1' ? mockCategory : null),
        findBySlug: () => Effect.succeed(mockCategory),
        listTree: () => Effect.succeed([mockCategory]),
        listRootCategories: () => Effect.succeed([mockCategory]),
        save: (category) => Effect.succeed(category),
        delete: () => Effect.succeed(undefined)
      })
    );

    const program = Effect.gen(function* (_) {
      const repo = yield* _(CategoryRepository);
      const category = yield* _(repo.findById('cat-1'));
      return category;
    });

    const result = await Effect.runPromise(program.pipe(Effect.provide(MockCategoryRepo)));
    expect(result).toEqual(mockCategory);
  });

  it('AssetStorageService should define expected methods and handle errors', async () => {
    const mockUrl = 'https://example.com/upload';

    const MockStorageService = Layer.succeed(
      AssetStorageService,
      AssetStorageService.of({
        getPresignedUploadUrl: () => Effect.succeed({ uploadUrl: mockUrl, assetKey: 'test-key' }),
        getPublicUrl: () => Effect.succeed('https://example.com/public/test-key'),
        deleteAsset: () => Effect.fail(new AssetStorageError('Delete failed')),
        optimizeImageUrl: (url) => Effect.succeed(`${url}?optimized=true`)
      })
    );

    const programSuccess = Effect.gen(function* (_) {
      const service = yield* _(AssetStorageService);
      const res = yield* _(service.getPresignedUploadUrl('test.jpg', 'image/jpeg'));
      return res;
    });

    const result = await Effect.runPromise(programSuccess.pipe(Effect.provide(MockStorageService)));
    expect(result).toEqual({ uploadUrl: mockUrl, assetKey: 'test-key' });

    const programError = Effect.gen(function* (_) {
      const service = yield* _(AssetStorageService);
      return yield* _(service.deleteAsset('test-key'));
    });

    const errorResult = await Effect.runPromiseExit(programError.pipe(Effect.provide(MockStorageService)));

    expect(errorResult._tag).toBe('Failure');
    if (errorResult._tag === 'Failure') {
        const failureCause = errorResult.cause as any;
        expect(failureCause._tag).toBe('Fail');
        expect(failureCause.error).toBeInstanceOf(AssetStorageError);
        expect(failureCause.error._tag).toBe('AssetStorageError');
    }
  });
});
