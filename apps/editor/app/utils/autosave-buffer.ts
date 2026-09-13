import { serializeWorld, type World } from '@titane/core';
import { clearPersistenceDirty } from './persistence-dirty';

/** Key of the recovery buffer kept in local storage. */
export const AUTOSAVE_KEY = 'titane_autosave_buffer';

/**
 * Writes the world JSON to the editor autosave slot.
 */
export const writeAutosave = (world: World): void => {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(serializeWorld(world)));
    clearPersistenceDirty();
  } catch (error) {
    console.error('[Titane] Failed to auto-save to local storage.', error);
  }
};
