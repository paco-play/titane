import {
  addComponent,
  createSkybox,
  getComponent,
  removeComponent,
  Skybox,
  updateComponent,
  type SkyboxData
} from '@titane/core';
import { useTitane } from '../useTitane';
import { usePersistence } from '../usePersistence';

/**
 * Reads and writes the selected entity's `Skybox` component.
 */
export const useInspectorSkybox = () => {
  const { engine, selectedEntityId, inspectTick, notifyInspect, markDirty } = useTitane();
  const { saveToStorage } = usePersistence();

  const skybox = computed<SkyboxData | null>(() => {
    void inspectTick.value;
    if (selectedEntityId.value === null || !engine.value) return null;
    return getComponent(engine.value.world, selectedEntityId.value, Skybox) ?? null;
  });

  const addSkybox = (): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    addComponent(engine.value.world, selectedEntityId.value, Skybox, createSkybox());
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  const removeSkybox = (): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    removeComponent(engine.value.world, selectedEntityId.value, Skybox);
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  const patchSkybox = (write: (data: SkyboxData) => void): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    updateComponent(engine.value.world, selectedEntityId.value, Skybox, write);
    markDirty();
  };

  const setSkyboxColor = (color: string): void => {
    patchSkybox((data) => {
      data.color = color;
    });
  };

  const setSkyboxCubemap = (cubemap: string): void => {
    patchSkybox((data) => {
      data.cubemap = cubemap.trim();
    });
  };

  return {
    skybox,
    addSkybox,
    removeSkybox,
    setSkyboxColor,
    setSkyboxCubemap
  };
};
