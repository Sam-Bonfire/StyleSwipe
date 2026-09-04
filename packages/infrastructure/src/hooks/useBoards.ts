import { api, type Id } from '@app/convex';
import { useMutation, useQuery } from 'convex/react';
import React from 'react';

/**
 * Hook to retrieve the user's default "Your orders" board with fully populated products.
 */
export function useSystemBoard(userId: string | undefined) {
  const data = useQuery(api.boards.getSystemBoard, userId ? { userId } : 'skip');

  return React.useMemo(() => {
    if (data === undefined) return undefined;
    return data;
  }, [data]);
}

/**
 * Hook to trigger the trackPurchaseClick mutation which logs analytics,
 * updates the user's system board, and clears the product from the shopping cart.
 */
export function useTrackPurchaseClick() {
  const mutation = useMutation(api.boards.trackPurchaseClick);

  return React.useCallback(
    async (userId: string, productId: string) => {
      return await mutation({
        userId,
        productId: productId as Id<'products'>,
      });
    },
    [mutation],
  );
}

/**
 * Hook to retrieve the user's "Wishlist" system board with fully populated products.
 */
export function useWishlist(userId: string | undefined) {
  const data = useQuery(api.boards.getWishlist, userId ? { userId } : 'skip');

  return React.useMemo(() => {
    if (data === undefined) return undefined;
    return data;
  }, [data]);
}

/**
 * Hook to trigger the toggleWishlist mutation.
 */
export function useToggleWishlist() {
  const mutation = useMutation(api.boards.toggleWishlist);

  return React.useCallback(
    async (userId: string, productId: string) => {
      return await mutation({
        userId,
        productId: productId as Id<'products'>,
      });
    },
    [mutation],
  );
}

/**
 * Hook to fetch a board by ID, fully populated with products and match indicators.
 */
export function useBoard(boardId: string | undefined, userId?: string) {
  const data = useQuery(api.boards.getBoard, boardId ? { boardId: boardId as Id<'boards'>, userId } : 'skip');

  return React.useMemo(() => {
    if (data === undefined) return undefined;
    return data;
  }, [data]);
}

/**
 * Hook to add an item to a board.
 */
export function useAddBoardItem() {
  const mutation = useMutation(api.boards.addBoardItem);

  return React.useCallback(
    async (boardId: string, productId: string) => {
      return await mutation({
        boardId: boardId as Id<'boards'>,
        productId: productId as Id<'products'>,
      });
    },
    [mutation],
  );
}

/**
 * Hook to remove an item from a board.
 */
export function useRemoveBoardItem() {
  const mutation = useMutation(api.boards.removeBoardItem);

  return React.useCallback(
    async (boardId: string, productId: string) => {
      return await mutation({
        boardId: boardId as Id<'boards'>,
        productId: productId as Id<'products'>,
      });
    },
    [mutation],
  );
}

export interface UserBoardSummary {
  _id: Id<'boards'>;
  _creationTime: number;
  userId: string;
  name: string;
  slug: string;
  isSystem?: boolean;
  createdAt: number;
  updatedAt: number;
  itemCount: number;
  previewImage: string | null;
}

export function useUserBoards(userId: string | undefined, includeSystem: boolean = false) {
  const data = useQuery(api.boards.listUserBoards, userId ? { userId, includeSystem } : 'skip');
  return React.useMemo(() => {
    if (data === undefined) return undefined;
    return data as UserBoardSummary[];
  }, [data]);
}

export function useCreateBoard() {
  const mutation = useMutation(api.boards.createBoard);
  return React.useCallback(
    async (userId: string, name: string, slug?: string) => {
      return await mutation({ userId, name, ...(slug ? { slug } : {}) });
    },
    [mutation],
  );
}

export function useRenameBoard() {
  const mutation = useMutation(api.boards.renameBoard);
  return React.useCallback(
    async (boardId: string, userId: string, name: string, slug?: string) => {
      return await mutation({ boardId: boardId as Id<'boards'>, userId, name, ...(slug ? { slug } : {}) });
    },
    [mutation],
  );
}

export function useDeleteBoard() {
  const mutation = useMutation(api.boards.deleteBoard);
  return React.useCallback(
    async (boardId: string, userId: string) => {
      return await mutation({ boardId: boardId as Id<'boards'>, userId });
    },
    [mutation],
  );
}

export function useMoveBoardItem() {
  const mutation = useMutation(api.boards.moveBoardItem);
  return React.useCallback(
    async (sourceBoardId: string, targetBoardId: string, productId: string) => {
      return await mutation({
        sourceBoardId: sourceBoardId as Id<'boards'>,
        targetBoardId: targetBoardId as Id<'boards'>,
        productId: productId as Id<'products'>,
      });
    },
    [mutation],
  );
}
