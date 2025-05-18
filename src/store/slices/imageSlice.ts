import type { StateCreator } from 'zustand';
import type { GeneratedImage } from '../../types';
import { loadImages, saveImages, clearImages, clearAllData } from '../../utils/imagePersistence';

export interface ImageOperationState {
  isGenerating: boolean;
  isEditing: boolean;
  isCreatingVariation: boolean;
  selectedImageId: string | null;
  error: string | null;
  isHydrating: boolean;
}

export interface ImageSlice {
  // State
  images: GeneratedImage[];
  editedImages: GeneratedImage[];
  variations: GeneratedImage[];
  operationState: ImageOperationState;

  // Actions
  addImage: (image: GeneratedImage) => void;
  addEditedImage: (image: GeneratedImage) => void;
  addVariation: (image: GeneratedImage) => void;
  setGenerating: (status: boolean) => void;
  setEditing: (status: boolean) => void;
  setCreatingVariation: (status: boolean) => void;
  setSelectedImageId: (id: string | null) => void;
  setError: (error: string | null) => void;
  clearImages: () => void;
  clearEditedImages: () => void;
  clearVariations: () => void;
  clearAll: () => void;
  
  // Persistence actions
  hydrateFromIndexedDB: () => Promise<void>;
  setHydrating: (status: boolean) => void;
}

export const createImageSlice: StateCreator<ImageSlice> = (set, get) => ({
  // Initial state
  images: [],
  editedImages: [],
  variations: [],
  operationState: {
    isGenerating: false,
    isEditing: false,
    isCreatingVariation: false,
    selectedImageId: null,
    error: null,
    isHydrating: false
  },

  // Actions
  addImage: (image) => {
    set((state) => {
      const newImages = [image, ...state.images];
      // Persist to IndexedDB
      saveImages(newImages).then(() => {
        console.log(`[ImageStore] addImage: Persisted ${newImages.length} images to IndexedDB`);
      }).catch(error => {
        console.error('Failed to save images to IndexedDB:', error);
      });

      return {
        images: newImages,
        operationState: {
          ...state.operationState,
          error: null
        }
      };
    });
  },

  addEditedImage: (image) => {
    set((state) => {
      const newEditedImages = [image, ...state.editedImages];
      // Persist to IndexedDB
      saveImages(newEditedImages, 'EDITED_IMAGES').then(() => {
        console.log(`[ImageStore] addEditedImage: Persisted ${newEditedImages.length} edited images to IndexedDB`);
      }).catch(error => {
        console.error('Failed to save edited images to IndexedDB:', error);
      });

      return {
        editedImages: newEditedImages,
        operationState: {
          ...state.operationState,
          error: null
        }
      };
    });
  },

  addVariation: (image) => {
    set((state) => {
      const newVariations = [image, ...state.variations];
      // Persist to IndexedDB
      saveImages(newVariations, 'VARIATIONS').then(() => {
        console.log(`[ImageStore] addVariation: Persisted ${newVariations.length} variations to IndexedDB`);
      }).catch(error => {
        console.error('Failed to save variations to IndexedDB:', error);
      });

      return {
        variations: newVariations,
        operationState: {
          ...state.operationState,
          error: null
        }
      };
    });
  },

  setGenerating: (status) =>
    set((state) => ({
      operationState: {
        ...state.operationState,
        isGenerating: status
      }
    })),

  setEditing: (status) =>
    set((state) => ({
      operationState: {
        ...state.operationState,
        isEditing: status
      }
    })),

  setCreatingVariation: (status) =>
    set((state) => ({
      operationState: {
        ...state.operationState,
        isCreatingVariation: status
      }
    })),

  setSelectedImageId: (id) =>
    set((state) => ({
      operationState: {
        ...state.operationState,
        selectedImageId: id
      }
    })),

  setError: (error) =>
    set((state) => ({
      operationState: {
        ...state.operationState,
        error,
        isGenerating: false,
        isEditing: false,
        isCreatingVariation: false
      }
    })),

  clearImages: () => {
    set((state) => {
      // Clear from IndexedDB
      clearImages().then(() => {
        console.log('[ImageStore] clearImages: Cleared images from IndexedDB');
      }).catch(error => {
        console.error('Failed to clear images from IndexedDB:', error);
      });

      return {
        images: [],
        operationState: {
          ...state.operationState
        }
      };
    });
  },

  clearEditedImages: () => {
    set((state) => {
      // Clear from IndexedDB
      clearImages('EDITED_IMAGES').then(() => {
        console.log('[ImageStore] clearEditedImages: Cleared edited images from IndexedDB');
      }).catch(error => {
        console.error('Failed to clear edited images from IndexedDB:', error);
      });

      return {
        editedImages: [],
        operationState: {
          ...state.operationState
        }
      };
    });
  },

  clearVariations: () => {
    set((state) => {
      // Clear from IndexedDB
      clearImages('VARIATIONS').then(() => {
        console.log('[ImageStore] clearVariations: Cleared variations from IndexedDB');
      }).catch(error => {
        console.error('Failed to clear variations from IndexedDB:', error);
      });

      return {
        variations: [],
        operationState: {
          ...state.operationState
        }
      };
    });
  },

  clearAll: () => {
    // Clear all data from IndexedDB
    clearAllData().then(() => {
      console.log('[ImageStore] clearAll: Cleared all image data from IndexedDB');
    }).catch(error => {
      console.error('Failed to clear all data from IndexedDB:', error);
    });

    set({
      images: [],
      editedImages: [],
      variations: [],
      operationState: {
        isGenerating: false,
        isEditing: false,
        isCreatingVariation: false,
        selectedImageId: null,
        error: null,
        isHydrating: false
      }
    });
  },
  
  // Persistence actions
  hydrateFromIndexedDB: async () => {
    try {
      set(state => ({
        operationState: {
          ...state.operationState,
          isHydrating: true
        }
      }));
      
      // Load all image types from IndexedDB
      const [images, editedImages, variations] = await Promise.all([
        loadImages('IMAGES'),
        loadImages('EDITED_IMAGES'),
        loadImages('VARIATIONS')
      ]);

      console.log(`[ImageStore] hydrateFromIndexedDB: Hydrated ${images.length} images, ${editedImages.length} edited images, ${variations.length} variations from IndexedDB`);

      set({
        images,
        editedImages,
        variations,
        operationState: {
          ...get().operationState,
          isHydrating: false
        }
      });
    } catch (error) {
      console.error('Failed to hydrate from IndexedDB:', error);
      set(state => ({
        operationState: {
          ...state.operationState,
          isHydrating: false,
          error: 'Failed to load images from storage'
        }
      }));
    }
  },
  
  setHydrating: (status) =>
    set((state) => ({
      operationState: {
        ...state.operationState,
        isHydrating: status
      }
    }))
});