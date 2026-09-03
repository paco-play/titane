import {
  getComponent,
  Mesh,
  updateComponent,
  type MeshData,
  type PrimitiveType,
} from '@titane/core';
import { useTitane } from '../useTitane';

/**
 * Reads and writes the selected entity's `Mesh` component.
 */
export const useInspectorMesh = () => {
  const { engine, selectedEntityId, inspectTick, notifyInspect, markDirty } = useTitane();

  const mesh = computed<MeshData | undefined>(() => {
    void inspectTick.value;
    if (selectedEntityId.value === null || !engine.value) return undefined;
    return getComponent(engine.value.world, selectedEntityId.value, Mesh);
  });

  /**
   * Applies an in-place Mesh write and marks the scene dirty.
   */
  const patchMesh = (write: (data: MeshData) => void): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    updateComponent(engine.value.world, selectedEntityId.value, Mesh, write);
    notifyInspect();
    markDirty();
  };

  const setPrimitive = (primitive: PrimitiveType): void => {
    patchMesh((data) => {
      data.primitive = primitive;
    });
  };

  const setColor = (color: string): void => {
    patchMesh((data) => {
      data.color = color;
    });
  };

  const setAlbedo = (albedo: string): void => {
    patchMesh((data) => {
      data.albedo = albedo;
    });
  };

  const setRoughness = (roughness: number): void => {
    patchMesh((data) => {
      data.roughness = roughness;
    });
  };

  const setMetalness = (metalness: number): void => {
    patchMesh((data) => {
      data.metalness = metalness;
    });
  };

  const setEmissive = (emissive: string): void => {
    patchMesh((data) => {
      data.emissive = emissive;
    });
  };

  return {
    mesh,
    setPrimitive,
    setColor,
    setAlbedo,
    setRoughness,
    setMetalness,
    setEmissive,
  };
};
