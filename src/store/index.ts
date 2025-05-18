import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ImageSlice } from './slices/imageSlice';
import { createImageSlice } from './slices/imageSlice';
import { initializeDB } from '../utils/imagePersistence';

// Initialize IndexedDB when the module is loaded
initializeDB().catch(error => {
  console.error('Failed to initialize IndexedDB:', error);
});

// Create a store with proper memoization to avoid infinite loops
const useStore = create<ImageSlice>()(  
  devtools(
    (set, get, api) => {
      const store = {
        ...createImageSlice(set, get, api),
      };
      
      // Hydrate from IndexedDB on store creation
      // We use setTimeout to ensure this runs after the store is fully initialized
      setTimeout(() => {
        store.hydrateFromIndexedDB().catch(error => {
          console.error('Failed to hydrate store from IndexedDB:', error);
        });
      }, 0);
      
      return store;
    },
    { name: 'image-generator' }
  )
);

// Export a memoized version of the store
export default useStore;