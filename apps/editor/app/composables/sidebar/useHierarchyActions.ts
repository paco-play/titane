import { createPrimitive, setParent, type PrimitiveType } from '@titane/core';
import { useTitane } from '../useTitane';
import { nextSpawnPosition } from '~/utils/spawn-position';

/**
 * Hierarchy actions that mutate the world: spawning primitives under the
 * current selection when there is one.
 */
export const useHierarchyActions = () => {
  const { engine, syncWorld, selectedEntityId } = useTitane();

  /**
   * Spawns a primitive entity, parented under the current selection when one exists.
   * New objects are offset so they do not occupy the same point as the selection.
   * @param primitive - The shape to create.
   */
  const addPrimitive = (primitive: PrimitiveType): void => {
    if (!engine.value) return;

    const world = engine.value.world;
    const parentId = selectedEntityId.value;
    const entity = createPrimitive(world, {
      primitive,
      position: nextSpawnPosition(world, parentId)
    });

    if (parentId !== null) {
      setParent(world, entity, parentId);
    }

    selectedEntityId.value = entity;
    syncWorld();
  };

  return { addPrimitive };
};
