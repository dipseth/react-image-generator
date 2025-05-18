import type { GeneratedImage } from '../types';

// Database configuration
const DB_NAME = 'image-generator-db';
const DB_VERSION = 1;
const STORE_NAMES = {
  IMAGES: 'images',
  EDITED_IMAGES: 'edited-images',
  VARIATIONS: 'variations'
};

/**
 * Initialize the IndexedDB database and create object stores
 */
export const initializeDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORE_NAMES.IMAGES)) {
        db.createObjectStore(STORE_NAMES.IMAGES, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORE_NAMES.EDITED_IMAGES)) {
        db.createObjectStore(STORE_NAMES.EDITED_IMAGES, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORE_NAMES.VARIATIONS)) {
        db.createObjectStore(STORE_NAMES.VARIATIONS, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Save images to IndexedDB
 */
export const saveImages = async (
  images: GeneratedImage[],
  storeType: keyof typeof STORE_NAMES = 'IMAGES'
): Promise<void> => {
  try {
    const db = await initializeDB();
    const transaction = db.transaction(STORE_NAMES[storeType], 'readwrite');
    const store = transaction.objectStore(STORE_NAMES[storeType]);

    // Clear existing images and add new ones
    await clearStoreData(store);

    // Add all images to the store
    images.forEach(image => {
      // Ensure createdAt is serialized properly
      const serializedImage = {
        ...image,
        createdAt: image.createdAt instanceof Date
          ? image.createdAt.toISOString()
          : image.createdAt
      };
      store.add(serializedImage);
    });

    console.log(`[IndexedDB] saveImages: Saved ${images.length} images to store "${STORE_NAMES[storeType]}"`);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      
      transaction.onerror = (event) => {
        console.error('Transaction error:', transaction.error);
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('Error saving images to IndexedDB:', error);
    throw error;
  }
};

/**
 * Load images from IndexedDB
 */
export const loadImages = async (
  storeType: keyof typeof STORE_NAMES = 'IMAGES'
): Promise<GeneratedImage[]> => {
  try {
    const db = await initializeDB();
    const transaction = db.transaction(STORE_NAMES[storeType], 'readonly');
    const store = transaction.objectStore(STORE_NAMES[storeType]);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const images = request.result;
        // Convert ISO date strings back to Date objects
        const processedImages = images.map(image => ({
          ...image,
          createdAt: new Date(image.createdAt)
        }));
        db.close();
        console.log(`[IndexedDB] loadImages: Loaded ${processedImages.length} images from store "${STORE_NAMES[storeType]}"`);
        resolve(processedImages);
      };
      
      request.onerror = () => {
        console.error('Error loading images from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error loading images from IndexedDB:', error);
    return [];
  }
};

/**
 * Clear images from IndexedDB
 */
export const clearImages = async (
  storeType: keyof typeof STORE_NAMES = 'IMAGES'
): Promise<void> => {
  try {
    const db = await initializeDB();
    const transaction = db.transaction(STORE_NAMES[storeType], 'readwrite');
    const store = transaction.objectStore(STORE_NAMES[storeType]);
    
    await clearStoreData(store);

    console.log(`[IndexedDB] clearImages: Cleared all images from store "${STORE_NAMES[storeType]}"`);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      
      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('Error clearing images from IndexedDB:', error);
    throw error;
  }
};

/**
 * Clear all data from IndexedDB
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await clearImages('IMAGES');
    await clearImages('EDITED_IMAGES');
    await clearImages('VARIATIONS');
  } catch (error) {
    console.error('Error clearing all data from IndexedDB:', error);
    throw error;
  }
};

/**
 * Helper function to clear an object store
 */
const clearStoreData = (store: IDBObjectStore): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
