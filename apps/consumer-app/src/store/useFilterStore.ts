import { FilterState, SortOption } from '@app/core';
import { create } from 'zustand';

interface FilterStore {
  filterState?: FilterState;
  sort: SortOption;
  setFilterState: (state: FilterState) => void;
  setSort: (sort: SortOption) => void;
  reset: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  filterState: undefined,
  sort: 'RELEVANCE',
  setFilterState: (state) => set({ filterState: state }),
  setSort: (sort) => set({ sort }),
  reset: () => set({ filterState: undefined, sort: 'RELEVANCE' }),
}));
