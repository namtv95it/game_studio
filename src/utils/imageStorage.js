/**
 * Utility for persisting user uploaded images in browser IndexedDB.
 * Eliminates QuotaExceededError from localStorage (5MB limit) and
 * ensures uploaded images survive page refresh on GitHub Pages.
 */
const DB_NAME = 'game_studio_flashlight_db';
const STORE_NAME = 'assets';
const IMAGE_KEY = 'user_uploaded_character';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function saveFlashlightImage(blobOrFile) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blobOrFile, IMAGE_KEY);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save image to IndexedDB:', err);
    return false;
  }
}

export async function loadFlashlightImage() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(IMAGE_KEY);
      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Could not load image from IndexedDB:', err);
    return null;
  }
}

export async function clearFlashlightImage() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(IMAGE_KEY);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
}
