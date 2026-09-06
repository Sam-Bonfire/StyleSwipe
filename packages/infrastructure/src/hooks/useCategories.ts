import type { Id } from '@app/convex';

import { api } from '@app/convex';
import { useMutation, useQuery } from 'convex/react';

export function useRootCategories() {
  return useQuery(api.categories.listRootCategories);
}

export function useCategoriesByParent(parentId?: string) {
  return useQuery(api.categories.listByParent, parentId ? { parentId: parentId as never } : {});
}

export function useCategoryTree() {
  return useQuery(api.categories.listTree);
}

export function useProductCounts() {
  return useQuery(api.categories.getProductCounts);
}

export interface SaveCategoryInput {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  level: number;
  image?: string;
}

export function useSaveCategory() {
  const save = useMutation(api.categories.save);
  return async (input: SaveCategoryInput) => {
    return await save({
      ...input,
      id: input.id ? (input.id as Id<'categories'>) : undefined,
      parentId: input.parentId ? (input.parentId as Id<'categories'>) : undefined,
    });
  };
}

export function useRemoveCategory() {
  const remove = useMutation(api.categories.remove);
  return async (id: string) => {
    return await remove({ id: id as Id<'categories'> });
  };
}
