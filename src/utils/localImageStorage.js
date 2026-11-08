/**
 * Local Image Storage Engine for Static Web Apps (Client-Side Storage)
 * - Uses IndexedDB for unlimited capacity (stores high-res user images locally on device)
 * - Uses fast localStorage cache for synchronous instant rendering on page reload (0ms flash)
 * - Converts File/Blob to persistent Data URLs (no ephemeral blob: expiration)
 */

const DB_NAME = 'game_studio_local_assets_db';
const STORE_NAME = 'images';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Convert File or Blob to Base64 Data URL
 */
export function fileToDataUrl(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Save an uploaded image locally into IndexedDB and fast localStorage cache
 * @param {string} key Unique key, e.g. 'flashlight_character', 'folded_paper_cover'
 * @param {File|Blob} fileOrBlob The image file
 * @returns {Promise<string>} The persistent Data URL
 */
export async function saveLocalImage(key, fileOrBlob) {
  try {
    const dataUrl = await fileToDataUrl(fileOrBlob);

    // 1. Save in IndexedDB (Unlimited capacity, persistent across reloads)
    try {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put({ dataUrl, type: fileOrBlob.type, updatedAt: Date.now() }, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (idbErr) {
      console.warn('[LocalImageStorage] IndexedDB write error:', idbErr);
    }

    // 2. Cache in localStorage if under 1.5MB for 0ms synchronous restore
    if (dataUrl && dataUrl.length < 1.5 * 1024 * 1024) {
      try {
        localStorage.setItem(`img_cache_${key}`, dataUrl);
      } catch (lsErr) {
        // Safe to ignore quota error as IndexedDB has the copy
      }
    }

    return dataUrl;
  } catch (err) {
    console.error('[LocalImageStorage] Failed to save local image:', err);
    return URL.createObjectURL(fileOrBlob);
  }
}

/**
 * Synchronous retrieval from localStorage cache (runs inside useState initializers)
 */
export function getLocalImageSync(key) {
  try {
    return localStorage.getItem(`img_cache_${key}`) || null;
  } catch {
    return null;
  }
}

/**
 * Asynchronous retrieval from IndexedDB (fallback if image was too large for localStorage)
 */
export async function loadLocalImage(key) {
  const cached = getLocalImageSync(key);
  if (cached) return cached;

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result && req.result.dataUrl) {
          if (req.result.dataUrl.length < 1.5 * 1024 * 1024) {
            try {
              localStorage.setItem(`img_cache_${key}`, req.result.dataUrl);
            } catch {}
          }
          resolve(req.result.dataUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[LocalImageStorage] IndexedDB read error:', err);
    return null;
  }
}

/**
 * Delete a local image from both IndexedDB and localStorage cache
 */
export async function removeLocalImage(key) {
  try {
    localStorage.removeItem(`img_cache_${key}`);
  } catch {}

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

