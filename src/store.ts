import { create } from 'zustand';
import { Model } from './db';

interface AppState {
  models: Model[];
  baseDirectory: string;
  isScanning: boolean;
  selectedModelIds: string[];
  searchQuery: string;
  selectedTags: string[];
  setModels: (models: Model[]) => void;
  setBaseDirectory: (dir: string) => void;
  setIsScanning: (isScanning: boolean) => void;
  setSelectedModelIds: (ids: string[]) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
}

export const useStore = create<AppState>((set) => ({
  models: [],
  baseDirectory: '',
  isScanning: false,
  selectedModelIds: [],
  searchQuery: '',
  selectedTags: [],
  setModels: (models) => set({ models }),
  setBaseDirectory: (baseDirectory) => set({ baseDirectory }),
  setIsScanning: (isScanning) => set({ isScanning }),
  setSelectedModelIds: (selectedModelIds) => set({ selectedModelIds }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedTags: (selectedTags) => set({ selectedTags }),
}));
