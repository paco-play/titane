import {
  addComponent,
  createGltf,
  getComponent,
  Gltf,
  removeComponent,
  updateComponent,
  type GltfData,
} from '@titane/core';
import { useTitane } from '../useTitane';
import { usePersistence } from '../usePersistence';

/**
 * Reads and writes the selected entity's `Gltf` component.
 */
export const useInspectorGltf = () => {
  const { engine, selectedEntityId, inspectTick, notifyInspect, markDirty } = useTitane();
  const { saveToStorage } = usePersistence();

  const gltf = computed<GltfData | undefined>(() => {
    void inspectTick.value;
    if (selectedEntityId.value === null || !engine.value) return undefined;
    return getComponent(engine.value.world, selectedEntityId.value, Gltf);
  });

  const addGltf = (): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    addComponent(engine.value.world, selectedEntityId.value, Gltf, createGltf());
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  const removeGltf = (): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    removeComponent(engine.value.world, selectedEntityId.value, Gltf);
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  const setGltfUrl = (url: string): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    updateComponent(engine.value.world, selectedEntityId.value, Gltf, (data) => {
      data.url = url;
    });
    notifyInspect();
    markDirty();
  };

  return { gltf, addGltf, removeGltf, setGltfUrl };
};
