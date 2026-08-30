import { FilterState, SearchQuery } from '@app/core';
import { create } from 'zustand';

interface FilterStore {
  filterState?: FilterState;
  sort: SearchQuery['sort'];
  setFilterState: (state: FilterState) => void;
  setSort: (sort: SearchQuery['sort']) => void;
  reset: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  filterState: undefined,
  sort: 'RELEVANCE',
  setFilterState: (state) => set({ filterState: state }),
  setSort: (sort) => set({ sort }),
  reset: () => set({ filterState: undefined, sort: 'RELEVANCE' }),
}));
