/**
 * Bridge wrapper for FlashlightReveal and existing imports.
 */
import {
  saveLocalImage,
  loadLocalImage,
  removeLocalImage,
  getLocalImageSync,
  fileToDataUrl
} from './localImageStorage';

const FLASHLIGHT_KEY = 'flashlight_character';

export {
  saveLocalImage,
  loadLocalImage,
  removeLocalImage,
  getLocalImageSync,
  fileToDataUrl
};

export async function saveFlashlightImage(blobOrFile) {
  return saveLocalImage(FLASHLIGHT_KEY, blobOrFile);
}

export async function loadFlashlightImage() {
  return loadLocalImage(FLASHLIGHT_KEY);
}

export function getFlashlightImageSync() {
  return getLocalImageSync(FLASHLIGHT_KEY);
}

export async function clearFlashlightImage() {
  return removeLocalImage(FLASHLIGHT_KEY);
}
