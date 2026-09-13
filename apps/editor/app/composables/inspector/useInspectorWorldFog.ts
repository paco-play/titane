import {
  clearFog,
  createFog,
  ensureFog,
  getComponent,
  pickFog,
  Fog,
  updateComponent,
  type FogData
} from '@titane/core';

/**
 * Authors scene-wide distance fog from the World inspector.
 */
export const useInspectorWorldFog = () => {
  const { engine, inspectTick, notifyInspect, markDirty, syncWorld } = useTitane();
  const { saveToStorage } = usePersistence();

  const authored = computed<boolean>(() => {
    void inspectTick.value;
    if (!engine.value) return false;
    return pickFog(engine.value.world) !== null;
  });

  const fog = computed<FogData>(() => {
    void inspectTick.value;
    if (!engine.value) return createFog();
    const entity = pickFog(engine.value.world);
    if (entity === null) return createFog();
    return getComponent(engine.value.world, entity, Fog) ?? createFog();
  });

  const patch = (write: (data: FogData) => void): void => {
    if (!engine.value) return;
    const entity = ensureFog(engine.value.world);
    updateComponent(engine.value.world, entity, Fog, write);
    syncWorld();
    notifyInspect();
    markDirty();
  };

  const resetFog = (): void => {
    if (!engine.value) return;
    clearFog(engine.value.world);
    syncWorld();
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  return {
    fog,
    authored,
    setColor: (color: string): void => { patch((data) => { data.color = color; }); },
    setFadeDistance: (fadeDistance: number): void => {
      patch((data) => { data.fadeDistance = fadeDistance; });
    },
    resetFog
  };
};
