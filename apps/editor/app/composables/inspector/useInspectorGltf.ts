import {
  addComponent,
  createGltf,
  getComponent,
  Gltf,
  removeComponent,
  updateComponent,
  type GltfData
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

  const patchGltf = (write: (data: GltfData) => void): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    updateComponent(engine.value.world, selectedEntityId.value, Gltf, write);
    notifyInspect();
    markDirty();
  };

  const setGltfUrl = (url: string): void => {
    patchGltf(data => { data.url = url; });
  };

  const setGltfClip = (clip: string): void => {
    patchGltf(data => { data.clip = clip; });
  };

  const setGltfPlaying = (playing: boolean): void => {
    patchGltf(data => { data.playing = playing; });
    saveToStorage();
  };

  const setGltfLoop = (loop: boolean): void => {
    patchGltf(data => { data.loop = loop; });
    saveToStorage();
  };

  return {
    gltf,
    addGltf,
    removeGltf,
    setGltfUrl,
    setGltfClip,
    setGltfPlaying,
    setGltfLoop
  };
};
