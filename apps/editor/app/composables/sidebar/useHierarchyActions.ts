import { createPrimitive, setParent, type PrimitiveType } from '@titane/core';
import { useTitane } from '../useTitane';

/**
 * Hierarchy actions that mutate the world: spawning primitives under the
 * current selection when there is one.
 */
export const useHierarchyActions = () => {
  const { engine, syncWorld, selectedEntityId } = useTitane();

  /**
   * Spawns a primitive entity, parented under the current selection when one exists.
   * @param primitive - The shape to create.
   */
  const addPrimitive = (primitive: PrimitiveType): void => {
    if (!engine.value) return;

    const entity = createPrimitive(engine.value.world, { primitive });

    if (selectedEntityId.value !== null) {
      setParent(engine.value.world, entity, selectedEntityId.value);
    }

    selectedEntityId.value = entity;
    syncWorld();
  };

  return { addPrimitive };
};
