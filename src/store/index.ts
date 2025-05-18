import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ImageSlice } from './slices/imageSlice';
import { createImageSlice } from './slices/imageSlice';

// Create a store with proper memoization to avoid infinite loops
const useStore = create<ImageSlice>()(
  devtools(
    persist(
      (set, get, api) => ({
        ...createImageSlice(set, get, api),
      }),
      {
        name: 'image-generator-storage',
        partialize: (state) => ({
          images: state.images,
        }),
      }
    ),
    { name: 'image-generator' }
  )
);

// Export a memoized version of the store
export default useStore;