import type { StateCreator } from 'zustand';
import type { GeneratedImage } from '../../types';

export interface ImageSlice {
  // State
  images: GeneratedImage[];
  isGenerating: boolean;
  error: string | null;

  // Actions
  addImage: (image: GeneratedImage) => void;
  setGenerating: (status: boolean) => void;
  setError: (error: string | null) => void;
  clearImages: () => void;
}

export const createImageSlice: StateCreator<ImageSlice> = (set) => ({
  // Initial state
  images: [],
  isGenerating: false,
  error: null,

  // Actions
  addImage: (image) =>
    set((state) => ({
      images: [image, ...state.images],
      error: null,
    })),

  setGenerating: (status) =>
    set({ isGenerating: status }),

  setError: (error) =>
    set({ error, isGenerating: false }),

  clearImages: () =>
    set({ images: [] }),
});