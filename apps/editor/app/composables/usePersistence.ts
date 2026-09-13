import { serializeWorld, deserializeWorld, createWorld, type SerializedWorld } from '@titane/core';
import { useTitane } from './useTitane';
import { AUTOSAVE_KEY, writeAutosave } from '~/utils/autosave-buffer';
import { clearPersistenceDirty, isPersistenceDirty } from '~/utils/persistence-dirty';

export const usePersistence = () => {
  const { engine, syncWorld, clearSelection } = useTitane();
  const { captureBaseline, isPlaying } = useRuntime();

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
   * Writes `scenes/main.titane` on the host project. Falls back to a download
   * if the dev API is unreachable. No-op while Playing so sim state is not baked in.
   */
  const saveToProject = async (): Promise<void> => {
    if (!engine.value || isPlaying.value) return;

    const data = serializeWorld(engine.value.world);
    try {
      const response = await fetch('/api/titane/scene', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`status ${response.status}`);
      saveToStorage();
    } catch (error) {
      console.error('[Titane] Failed to write scenes/main.titane.', error);
      saveToDisk('main.titane');
    }
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
    clearSelection();
    clearPersistenceDirty();
    useHistory().runQuiet(() => {
      syncWorld();
    });
    captureBaseline();
  };

  /**
   * Serializes the current world and saves it to local storage.
   */
  const saveToStorage = (): void => {
    if (!engine.value) return;

    writeAutosave(engine.value.world);
    if (!isPlaying.value && !useHistory().isReplaying()) {
      useHistory().record();
    }
  };

  /**
   * Serializes only when component edits are pending.
   * Structural changes already persist immediately via the entity watcher.
   */
  const saveIfDirty = (): void => {
    if (!isPersistenceDirty()) return;
    saveToStorage();
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
      clearSelection();
      clearPersistenceDirty();
      useHistory().runQuiet(() => {
        syncWorld();
      });
      return true;
    } catch (error) {
      console.error('[Titane] Failed to recover session. Corrupted data.', error);
      clearStorage();
      engine.value.loadWorld(createWorld());
      clearSelection();
      clearPersistenceDirty();
      useHistory().runQuiet(() => {
        syncWorld();
      });
      return false;
    }
  };

  return {
    saveToDisk,
    saveToProject,
    loadFromDisk,
    saveToStorage,
    saveIfDirty,
    loadFromStorage,
    clearStorage
  };
};
