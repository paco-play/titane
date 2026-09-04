import {
  getComponent,
  instantiatePrefab,
  isSerializedPrefab,
  Name,
  serializePrefab,
  setParent,
  Transform,
  updateComponent,
} from '@titane/core';
import { useTitane } from './useTitane';
import { usePrefabCatalog } from './usePrefabCatalog';
import { nextSpawnPosition } from '~/utils/spawn-position';
import { prefabFileName } from '~/utils/prefab-filename';

const downloadJson = (fileName: string, data: unknown): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Saves the selection as a prefab download and stamps catalog prefabs into the scene.
 */
export const usePrefabs = () => {
  const { engine, selectedEntityId, syncWorld } = useTitane();
  const { prefabs } = usePrefabCatalog();

  const saveSelectedPrefab = (): void => {
    if (!engine.value || selectedEntityId.value === null) return;

    const world = engine.value.world;
    const name = getComponent(world, selectedEntityId.value, Name)?.value ?? 'prefab';
    downloadJson(prefabFileName(name), serializePrefab(world, selectedEntityId.value));
  };

  const spawnPrefab = async (url: string): Promise<void> => {
    if (!engine.value) return;

    let payload: unknown;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error('[Titane] Prefab fetch failed:', url, response.status);
        return;
      }
      payload = await response.json();
    } catch (error) {
      console.error('[Titane] Prefab fetch failed:', url, error);
      return;
    }

    if (!isSerializedPrefab(payload)) {
      console.error('[Titane] Not a prefab:', url);
      return;
    }

    const world = engine.value.world;
    const parentId = selectedEntityId.value;
    const position = nextSpawnPosition(world, parentId);
    const root = instantiatePrefab(world, payload);

    updateComponent(world, root, Transform, (transform) => {
      transform.position.x = position.x;
      transform.position.y = position.y;
      transform.position.z = position.z;
      transform.isDirty = true;
    });
    if (parentId !== null) setParent(world, root, parentId);

    selectedEntityId.value = root;
    syncWorld();
  };

  return { prefabs, saveSelectedPrefab, spawnPrefab };
};
