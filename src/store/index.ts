import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ImageSlice } from './slices/imageSlice';
import { createImageSlice } from './slices/imageSlice';
import type { AuthSlice } from './slices/authSlice';
import { createAuthSlice } from './slices/authSlice';
import { initializeDB } from '../utils/imagePersistence';

// Initialize IndexedDB when the module is loaded
console.log("[store/index] Initializing IndexedDB");
initializeDB().then(() => {
  console.log("[store/index] IndexedDB initialized successfully");
}).catch(error => {
  console.error('[store/index] Failed to initialize IndexedDB:', error);
});

// Define the combined store type
type StoreState = ImageSlice & AuthSlice;

// Create a store with proper memoization to avoid infinite loops
console.log("[store/index] Creating Zustand store");
const useStore = create<StoreState>()(
  devtools(
    (set, get, api) => {
      console.log("[store/index] Initializing store slices");
      const store = {
        ...createImageSlice(set, get, api),
        ...createAuthSlice(set, get, api),
      };
      
      // Hydrate from IndexedDB on store creation
      // We use setTimeout to ensure this runs after the store is fully initialized
      console.log("[store/index] Setting up hydration from IndexedDB");
      setTimeout(() => {
        console.log("[store/index] Starting hydration from IndexedDB");
        store.hydrateFromIndexedDB().then(() => {
          console.log("[store/index] Successfully hydrated store from IndexedDB");
          console.log("[store/index] Current auth state:", {
            isAuthenticated: get().isAuthenticated,
            user: get().user ? `User ${get().user.username} exists` : 'No user'
          });
        }).catch(error => {
          console.error('[store/index] Failed to hydrate store from IndexedDB:', error);
        });
      }, 0);
      
      return store;
    },
    { name: 'image-generator' }
  )
);

// Export a memoized version of the store
export default useStore;