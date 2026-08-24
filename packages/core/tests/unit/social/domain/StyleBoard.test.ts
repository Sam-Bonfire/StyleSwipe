import { describe, it, expect } from 'vitest';

import { StyleBoardSchema } from '../../../../src/social/domain/StyleBoard';

describe('StyleBoard Domain Models', () => {
  describe('StyleBoardSchema', () => {
    it('should validate a valid StyleBoard', () => {
      const board = {
        id: 'board_123',
        ownerId: 'user_1',
        title: 'Summer Collection',
        description: 'My summer vibes',
        visibility: 'PUBLIC',
        collaborators: [
          { userId: 'user_2', role: 'VIEWER' },
        ],
        pinnedItems: [
          {
            productId: 'prod_1',
            addedAt: Date.now(),
            addedBy: 'user_1',
            notes: 'Love this color',
            tags: ['summer', 'yellow'],
          }
        ],
        tags: ['fashion'],
      };

      const result = StyleBoardSchema.safeParse(board);
      expect(result.success).toBe(true);
    });

    it('should fail if title is empty', () => {
      const board = {
        id: 'board_123',
        ownerId: 'user_1',
        title: '',
        visibility: 'PRIVATE',
        collaborators: [],
        pinnedItems: [],
        tags: [],
      };

      const result = StyleBoardSchema.safeParse(board);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title must be at least 1 character long');
      }
    });

    it('should validate coverImageUrl if it is a valid URL', () => {
      const board = {
        id: 'board_123',
        ownerId: 'user_1',
        title: 'Valid URL',
        coverImageUrl: 'https://example.com/image.jpg',
        visibility: 'PRIVATE',
        collaborators: [],
        pinnedItems: [],
        tags: [],
      };

      const result = StyleBoardSchema.safeParse(board);
      expect(result.success).toBe(true);
    });

    it('should fail if coverImageUrl is an invalid URL', () => {
      const board = {
        id: 'board_123',
        ownerId: 'user_1',
        title: 'Invalid URL',
        coverImageUrl: 'not-a-url',
        visibility: 'PRIVATE',
        collaborators: [],
        pinnedItems: [],
        tags: [],
      };

      const result = StyleBoardSchema.safeParse(board);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Cover image URL must be a valid URL');
      }
    });

    it('should fail if visibility is invalid', () => {
      const board = {
        id: 'board_123',
        ownerId: 'user_1',
        title: 'Invalid Vis',
        visibility: 'SECRET_SHHH', // Invalid enum
        collaborators: [],
        pinnedItems: [],
        tags: [],
      };

      const result = StyleBoardSchema.safeParse(board);
      expect(result.success).toBe(false);
    });

    it('should validate with valid pinnedItems', () => {
       const board = {
        id: 'board_123',
        ownerId: 'user_1',
        title: 'Pins',
        visibility: 'SHARED',
        collaborators: [],
        pinnedItems: [
           { productId: 'prod_1', addedAt: 1234567890, addedBy: 'user_1' } // Optional fields missing, valid
        ],
        tags: [],
      };

      const result = StyleBoardSchema.safeParse(board);
      expect(result.success).toBe(true);
    });
  });
});
