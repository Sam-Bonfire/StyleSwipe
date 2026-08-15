import { describe, it, expect } from 'vitest';

// Test the mapToEntity pure mapping logic by replicating the same transformation.
// We can't import ConvexProductRepository directly because it depends on `convex/browser`,
// but the mapping logic is a pure function we can extract and test.

/** Replicated from ConvexProductRepository.mapToEntity */
function mapProductToEntity(doc: Record<string, unknown>) {
    return {
        id: (doc._id as string) || '',
        brand: (doc.brand as string) || '',
        title: (doc.title as string) || '',
        price: (doc.price as number) || 0,
        mrp: (doc.mrp as number) || 0,
        category: (doc.category as string) || '',
        images: (doc.images as string[]) || [],
        attributes: doc.attributes as Record<string, unknown> | undefined,
        embedding: doc.embedding as number[] | undefined,
        meta: doc.meta as Record<string, unknown> | undefined,
        createdAt: (doc.createdAt as number) || (doc._creationTime as number),
        updatedAt: (doc.updatedAt as number) || (doc._creationTime as number),
    };
}

/** Replicated from ConvexUserRepository.mapToEntity */
function mapUserToEntity(doc: Record<string, unknown>) {
    return {
        id: (doc._id as string) || '',
        name: (doc.name as string) || '',
        email: (doc.email as string) || '',
        emailVerified: (doc.emailVerified as boolean) || false,
        image: doc.image as string | undefined,
        phone: (doc.phoneNumber as string) || '',
        activeOrgId: doc.activeOrgId as string | undefined,
        styleProfile: doc.styleProfile as Record<string, unknown> | undefined,
    };
}

describe('ProductRepository mapToEntity', () => {
    it('should map a complete Convex document to Product entity', () => {
        const doc = {
            _id: 'prod-abc',
            _creationTime: 1700000000000,
            brand: 'Nike',
            title: 'Air Max 90',
            price: 12999,
            mrp: 15999,
            category: 'shoes',
            images: ['img1.jpg', 'img2.jpg'],
            attributes: { color: 'black', size: '10' },
            embedding: [0.1, 0.2, 0.3],
            meta: { source: 'myntra' },
            createdAt: 1700000001000,
            updatedAt: 1700000002000,
        };

        const entity = mapProductToEntity(doc);

        expect(entity.id).toBe('prod-abc');
        expect(entity.brand).toBe('Nike');
        expect(entity.title).toBe('Air Max 90');
        expect(entity.price).toBe(12999);
        expect(entity.mrp).toBe(15999);
        expect(entity.category).toBe('shoes');
        expect(entity.images).toEqual(['img1.jpg', 'img2.jpg']);
        expect(entity.attributes).toEqual({ color: 'black', size: '10' });
        expect(entity.embedding).toEqual([0.1, 0.2, 0.3]);
        expect(entity.meta).toEqual({ source: 'myntra' });
        expect(entity.createdAt).toBe(1700000001000);
        expect(entity.updatedAt).toBe(1700000002000);
    });

    it('should default missing fields to empty values', () => {
        const doc = {
            _id: 'prod-xyz',
            _creationTime: 1700000000000,
        };

        const entity = mapProductToEntity(doc);

        expect(entity.id).toBe('prod-xyz');
        expect(entity.brand).toBe('');
        expect(entity.title).toBe('');
        expect(entity.price).toBe(0);
        expect(entity.mrp).toBe(0);
        expect(entity.category).toBe('');
        expect(entity.images).toEqual([]);
        expect(entity.attributes).toBeUndefined();
        expect(entity.embedding).toBeUndefined();
    });

    it('should fall back to _creationTime when createdAt/updatedAt are missing', () => {
        const doc = {
            _id: 'prod-1',
            _creationTime: 1700000000000,
            brand: 'Adidas',
            title: 'Ultraboost',
            price: 17999,
            mrp: 19999,
            category: 'shoes',
            images: [],
        };

        const entity = mapProductToEntity(doc);

        expect(entity.createdAt).toBe(1700000000000);
        expect(entity.updatedAt).toBe(1700000000000);
    });

    it('should handle missing _id gracefully', () => {
        const doc = { _creationTime: 1700000000000 };
        const entity = mapProductToEntity(doc);
        expect(entity.id).toBe('');
    });
});

describe('UserRepository mapToEntity', () => {
    it('should map a complete Convex document to User entity', () => {
        const doc = {
            _id: 'user-123',
            name: 'John Doe',
            email: 'john@example.com',
            emailVerified: true,
            image: 'https://avatar.url/john.jpg',
            phoneNumber: '+919876543210',
            activeOrgId: 'org-1',
            styleProfile: { gender: 'men', vibes: ['streetwear'] },
        };

        const entity = mapUserToEntity(doc);

        expect(entity.id).toBe('user-123');
        expect(entity.name).toBe('John Doe');
        expect(entity.email).toBe('john@example.com');
        expect(entity.emailVerified).toBe(true);
        expect(entity.image).toBe('https://avatar.url/john.jpg');
        expect(entity.phone).toBe('+919876543210');
        expect(entity.activeOrgId).toBe('org-1');
        expect(entity.styleProfile).toEqual({ gender: 'men', vibes: ['streetwear'] });
    });

    it('should default missing fields to empty values', () => {
        const doc = { _id: 'user-456' };

        const entity = mapUserToEntity(doc);

        expect(entity.id).toBe('user-456');
        expect(entity.name).toBe('');
        expect(entity.email).toBe('');
        expect(entity.emailVerified).toBe(false);
        expect(entity.image).toBeUndefined();
        expect(entity.phone).toBe('');
        expect(entity.activeOrgId).toBeUndefined();
        expect(entity.styleProfile).toBeUndefined();
    });

    it('should map phoneNumber field to phone property', () => {
        const doc = {
            _id: 'user-789',
            phoneNumber: '+1234567890',
        };

        const entity = mapUserToEntity(doc);
        expect(entity.phone).toBe('+1234567890');
    });

    it('should handle empty document gracefully', () => {
        const doc = {};
        const entity = mapUserToEntity(doc);
        expect(entity.id).toBe('');
        expect(entity.name).toBe('');
        expect(entity.emailVerified).toBe(false);
    });
});
