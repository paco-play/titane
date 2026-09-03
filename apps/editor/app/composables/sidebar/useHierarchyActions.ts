import { createPrimitive, setParent, getChildren, type PrimitiveType } from '@titane/core';
import { useTitane } from '../useTitane';

/** World/local spacing between newly spawned primitives, in metres. */
const SPAWN_GAP = 1.5;

/**
 * Hierarchy actions that mutate the world: spawning primitives under the
 * current selection when there is one.
 */
export const useHierarchyActions = () => {
  const { engine, syncWorld, selectedEntityId } = useTitane();

  /**
   * Spawns a primitive entity, parented under the current selection when one exists.
   *
   * New objects are offset so they do not occupy the same point as the
   * selection: a child sitting at local origin is indistinguishable from a
   * primitive swap on the parent.
   *
   * @param primitive - The shape to create.
   */
  const addPrimitive = (primitive: PrimitiveType): void => {
    if (!engine.value) return;

    const world = engine.value.world;
    const parentId = selectedEntityId.value;
    const siblings = getChildren(world, parentId);
    // Roots pack along X from the origin. Children start one gap away from
    // the parent so they are not hidden inside it.
    const offsetX = SPAWN_GAP * (siblings.length + (parentId === null ? 0 : 1));

    const entity = createPrimitive(world, {
      primitive,
      position: { x: offsetX, y: 0, z: 0 }
    });

    if (parentId !== null) {
      setParent(world, entity, parentId);
    }

    selectedEntityId.value = entity;
    syncWorld();
  };

  return { addPrimitive };
};
