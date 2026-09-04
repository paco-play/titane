import {
  addComponent,
  Camera,
  createCamera,
  getComponent,
  removeComponent,
  setCurrentCamera,
  updateComponent,
  type CameraData
} from '@titane/core';
import { useTitane } from '../useTitane';
import { usePersistence } from '../usePersistence';

/**
 * Reads and writes the selected entity's `Camera` component.
 */
export const useInspectorCamera = () => {
  const { engine, selectedEntityId, inspectTick, notifyInspect, markDirty } = useTitane();
  const { saveToStorage } = usePersistence();

  const camera = computed<CameraData | null>(() => {
    void inspectTick.value;
    if (selectedEntityId.value === null || !engine.value) return null;
    return getComponent(engine.value.world, selectedEntityId.value, Camera) ?? null;
  });

  const addCamera = (): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    addComponent(engine.value.world, selectedEntityId.value, Camera, createCamera());
    setCurrentCamera(engine.value.world, selectedEntityId.value);
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  const removeCamera = (): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    removeComponent(engine.value.world, selectedEntityId.value, Camera);
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  const patchCamera = (write: (data: CameraData) => void, inspect = true): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    updateComponent(engine.value.world, selectedEntityId.value, Camera, write);
    if (inspect) notifyInspect();
    markDirty();
  };

  const setCameraFov = (fov: number): void => {
    patchCamera((data) => {
      data.fov = Math.min(179, Math.max(1, fov));
    }, false);
  };

  const setCameraNear = (near: number): void => {
    patchCamera((data) => {
      data.near = Math.max(0.001, near);
      if (data.far <= data.near) data.far = data.near + 0.001;
    }, false);
  };

  const setCameraFar = (far: number): void => {
    patchCamera((data) => {
      data.far = Math.max(data.near + 0.001, far);
    }, false);
  };

  const setCameraCurrent = (current: boolean): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    if (current) {
      setCurrentCamera(engine.value.world, selectedEntityId.value);
    } else {
      updateComponent(engine.value.world, selectedEntityId.value, Camera, (data) => {
        data.current = false;
      });
    }
    notifyInspect();
    markDirty();
  };

  return {
    camera,
    addCamera,
    removeCamera,
    setCameraFov,
    setCameraNear,
    setCameraFar,
    setCameraCurrent
  };
};
