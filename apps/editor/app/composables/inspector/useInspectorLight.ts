import {
  addComponent,
  createLight,
  getComponent,
  Light,
  removeComponent,
  updateComponent,
  type LightData,
  type LightKind,
} from '@titane/core';
import { useTitane } from '../useTitane';
import { usePersistence } from '../usePersistence';

/**
 * Reads and writes the selected entity's `Light` component.
 */
export const useInspectorLight = () => {
  const { engine, selectedEntityId, inspectTick, notifyInspect, markDirty } = useTitane();
  const { saveToStorage } = usePersistence();

  const light = computed<LightData | undefined>(() => {
    void inspectTick.value;
    if (selectedEntityId.value === null || !engine.value) return undefined;
    return getComponent(engine.value.world, selectedEntityId.value, Light);
  });

  const addLight = (): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    addComponent(engine.value.world, selectedEntityId.value, Light, createLight());
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  const removeLight = (): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    removeComponent(engine.value.world, selectedEntityId.value, Light);
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  const patchLight = (write: (data: LightData) => void, inspect = true): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    updateComponent(engine.value.world, selectedEntityId.value, Light, write);
    if (inspect) notifyInspect();
    markDirty();
  };

  const setLightKind = (kind: LightKind): void => {
    patchLight((data) => {
      data.kind = kind;
    });
  };

  const setLightColor = (color: string): void => {
    patchLight((data) => {
      data.color = color;
    });
  };

  const setLightIntensity = (intensity: number): void => {
    patchLight((data) => {
      data.intensity = intensity;
    }, false);
  };

  const setLightDistance = (distance: number): void => {
    patchLight((data) => {
      data.distance = distance;
    }, false);
  };

  const setLightCastShadow = (castShadow: boolean): void => {
    patchLight((data) => {
      data.castShadow = castShadow;
    });
  };

  return {
    light,
    addLight,
    removeLight,
    setLightKind,
    setLightColor,
    setLightIntensity,
    setLightDistance,
    setLightCastShadow,
  };
};
