import { Effect, Layer } from 'effect';
import { describe, expect, it } from 'vitest';

import type { Product, User, StyleProfile } from '../../../../shared/domain/types';

import { ProductRepository, UserRepository } from '../../../../shared/application/ports';
import { SwipeRepository } from '../../../../src/discovery/application/DiscoveryPorts';
import { getRecommendations } from '../../../../src/discovery/application/GetRecommendations';

describe('GetRecommendations', () => {
  const mockUserVector = new Array(384).fill(0.1);
  const mockStyleProfile: StyleProfile = {
    gender: 'men',
    vibes: ['casual', 'streetwear'],
    sizes: { top: 'M' },
    budget: { min: 20, max: 100 },
    preferenceVector: mockUserVector,
  };

  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: true,
    phone: '1234567890',
    styleProfile: mockStyleProfile,
  };

  const matchingProduct: Product = {
    id: 'prod-1',
    title: 'Casual Tee',
    brand: 'BrandA',
    price: 50,
    mrp: 60,
    category: 'T-Shirts',
    images: [],
    embedding: new Array(384).fill(0.1), // exact match vector
  };

  const swipedProduct: Product = {
    id: 'prod-2',
    title: 'Swiped Tee',
    brand: 'BrandB',
    price: 50,
    mrp: 60,
    category: 'T-Shirts',
    images: [],
    embedding: new Array(384).fill(0.1),
  };

  const expensiveProduct: Product = {
    id: 'prod-3',
    title: 'Expensive Jacket',
    brand: 'LuxuryBrand',
    price: 500, // outside budget
    mrp: 600,
    category: 'Jackets',
    images: [],
    embedding: new Array(384).fill(0.0), // dissimilar vector
  };

  const mockUserRepository = Layer.succeed(
    UserRepository,
    UserRepository.of({
      findById: (id) => Effect.succeed(id === 'user-1' ? mockUser : null),
      findByEmail: () => Effect.succeed(null),
      findByPhone: () => Effect.succeed(null),
      create: () => Effect.succeed(mockUser),
      update: () => Effect.succeed(mockUser),
      updateStyleProfile: () => Effect.succeed(mockUser),
      delete: () => Effect.succeed(undefined),
    })
  );

  const mockProductRepository = Layer.succeed(
    ProductRepository,
    ProductRepository.of({
      getLatest: () => Effect.succeed([matchingProduct, swipedProduct, expensiveProduct]),
      findById: () => Effect.succeed(null),
      findByCategory: () => Effect.succeed([]),
      findByCategoryAndPrice: () => Effect.succeed([]),
      findByBrand: () => Effect.succeed([]),
      searchByTitle: () => Effect.succeed([]),
      findSimilar: () => Effect.succeed([]),
      create: () => Effect.succeed(matchingProduct),
      update: () => Effect.succeed(matchingProduct),
      updateEmbedding: () => Effect.succeed(matchingProduct),
      delete: () => Effect.succeed(undefined),
    })
  );

  const mockSwipeRepository = Layer.succeed(
    SwipeRepository,
    SwipeRepository.of({
      getSwipesByUser: (userId) =>
        Effect.succeed(
          userId === 'user-1'
            ? [{ userId, productId: 'prod-2', action: 'pass', timestamp: Date.now() }]
            : []
        ),
      recordSwipe: () => Effect.succeed(undefined),
    })
  );

  const MainLayer = Layer.mergeAll(mockUserRepository, mockProductRepository, mockSwipeRepository);

  it('should return recommendations filtering swiped products and ranking matching products higher', async () => {
    const program = getRecommendations('user-1', 10);
    const result = await Effect.runPromise(Effect.provide(program, MainLayer));

    // Should filter out prod-2 (swiped)
    expect(result.page.length).toBe(2);

    // Matching product should score higher than expensive product
    expect(result.page[0].id).toBe('prod-1'); // High similarity, in budget
    expect(result.page[1].id).toBe('prod-3'); // Low similarity, outside budget
  });

  it('should fail with StyleProfileNotFoundError if user does not exist', async () => {
    const program = getRecommendations('non-existent-user', 10);

    await expect(Effect.runPromise(Effect.provide(program, MainLayer))).rejects.toThrow('Style profile not found for user non-existent-user');
  });
});
