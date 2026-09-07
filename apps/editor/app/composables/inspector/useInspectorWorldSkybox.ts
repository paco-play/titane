import {
  createSkybox,
  clearSkybox,
  ensureSkybox,
  getComponent,
  pickSkybox,
  Skybox,
  updateComponent,
  type SkyboxData
} from '@titane/core';

/**
 * Authors the scene sky from the World inspector, not from a selected mesh.
 */
export const useInspectorWorldSkybox = () => {
  const { engine, inspectTick, notifyInspect, markDirty, syncWorld } = useTitane();
  const { saveToStorage } = usePersistence();

  const authored = computed<boolean>(() => {
    void inspectTick.value;
    if (!engine.value) return false;
    return pickSkybox(engine.value.world) !== null;
  });

  const skybox = computed<SkyboxData>(() => {
    void inspectTick.value;
    if (!engine.value) return createSkybox();
    const entity = pickSkybox(engine.value.world);
    if (entity === null) return createSkybox();
    return getComponent(engine.value.world, entity, Skybox) ?? createSkybox();
  });

  const patchSkybox = (write: (data: SkyboxData) => void): void => {
    if (!engine.value) return;
    const entity = ensureSkybox(engine.value.world);
    updateComponent(engine.value.world, entity, Skybox, write);
    syncWorld();
    notifyInspect();
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

  const resetSkybox = (): void => {
    if (!engine.value) return;
    clearSkybox(engine.value.world);
    syncWorld();
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  return {
    skybox,
    authored,
    setSkyboxColor,
    setSkyboxCubemap,
    resetSkybox
  };
};
