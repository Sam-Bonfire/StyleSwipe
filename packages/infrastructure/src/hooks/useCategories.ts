import { api } from '@app/convex';
import { useQuery } from 'convex/react';

export function useRootCategories() {
  return useQuery(api.categories.listRootCategories);
}

export function useCategoriesByParent(parentId?: string) {
  return useQuery(api.categories.listByParent, parentId ? { parentId: parentId as never } : {});
}

export function useCategoryTree() {
  return useQuery(api.categories.listTree);
}
