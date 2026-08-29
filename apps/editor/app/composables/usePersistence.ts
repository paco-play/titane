import { serializeWorld, deserializeWorld, createWorld, type SerializedWorld } from '@titane/core';
import { useTitane } from './useTitane';

/** Key of the recovery buffer kept in local storage. */
const AUTOSAVE_KEY = 'titane_autosave_buffer';

export const usePersistence = () => {
  const { engine, syncWorld } = useTitane();

  /**
   * Exports the current scene as a .titane file.
   */
  const saveToDisk = (fileName = 'scene-alpha.titane'): void => {
    if (!engine.value) return;

    const data = serializeWorld(engine.value.world);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  };

  /**
   * Loads a .titane file and overwrites the current world.
   */
  const loadFromDisk = async (file: File): Promise<void> => {
    if (!engine.value) return;

    const text = await file.text();
    const data = JSON.parse(text) as SerializedWorld;

    // In-place load: the engine keeps its World reference so the input driver,
    // the renderer and this UI stay bound to live data.
    engine.value.loadWorld(deserializeWorld(data));
    syncWorld();
  };

  /**
   * Serializes the current world and saves it to local storage.
   */
  const saveToStorage = (): void => {
    if (!engine.value) return;

    try {
      const data = serializeWorld(engine.value.world);
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[Titane] Failed to auto-save to local storage.', error);
    }
  };

  /**
   * Removes the auto-save backup from local storage.
   */
  const clearStorage = (): void => {
    localStorage.removeItem(AUTOSAVE_KEY);
  };

  /**
   * Tries to restore the world from local storage.
   * @returns True if a session was successfully restored.
   */
  const loadFromStorage = (): boolean => {
    if (!engine.value) return false;

    const stored = localStorage.getItem(AUTOSAVE_KEY);
    if (!stored) return false;

    try {
      const data = JSON.parse(stored) as SerializedWorld;
      engine.value.loadWorld(deserializeWorld(data));
      syncWorld();
      return true;
    } catch (error) {
      console.error('[Titane] Failed to recover session. Corrupted data.', error);
      clearStorage();
      engine.value.loadWorld(createWorld());
      syncWorld();
      return false;
    }
  };

  return {
    saveToDisk,
    loadFromDisk,
    saveToStorage,
    loadFromStorage,
    clearStorage
  };
};
