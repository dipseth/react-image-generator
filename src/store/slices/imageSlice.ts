import type { StateCreator } from 'zustand';
import type { GeneratedImage } from '../../types';

export interface ImageOperationState {
  isGenerating: boolean;
  isEditing: boolean;
  isCreatingVariation: boolean;
  selectedImageId: string | null;
  error: string | null;
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
}

export const createImageSlice: StateCreator<ImageSlice> = (set) => ({
  // Initial state
  images: [],
  editedImages: [],
  variations: [],
  operationState: {
    isGenerating: false,
    isEditing: false,
    isCreatingVariation: false,
    selectedImageId: null,
    error: null
  },

  // Actions
  addImage: (image) =>
    set((state) => ({
      images: [image, ...state.images],
      operationState: {
        ...state.operationState,
        error: null
      }
    })),

  addEditedImage: (image) =>
    set((state) => ({
      editedImages: [image, ...state.editedImages],
      operationState: {
        ...state.operationState,
        error: null
      }
    })),

  addVariation: (image) =>
    set((state) => ({
      variations: [image, ...state.variations],
      operationState: {
        ...state.operationState,
        error: null
      }
    })),

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

  clearImages: () =>
    set((state) => ({
      images: [],
      operationState: {
        ...state.operationState
      }
    })),

  clearEditedImages: () =>
    set((state) => ({
      editedImages: [],
      operationState: {
        ...state.operationState
      }
    })),

  clearVariations: () =>
    set((state) => ({
      variations: [],
      operationState: {
        ...state.operationState
      }
    })),

  clearAll: () =>
    set({
      images: [],
      editedImages: [],
      variations: [],
      operationState: {
        isGenerating: false,
        isEditing: false,
        isCreatingVariation: false,
        selectedImageId: null,
        error: null
      }
    })
});