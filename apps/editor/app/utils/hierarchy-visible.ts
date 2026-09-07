import type { Entity, World } from '@titane/core';
import { hasComponent, Input, Skybox, Transform } from '@titane/core';

/**
 * Whether an entity belongs in the Hierarchy tree.
 *
 * Hides the engine `Input` singleton and Transform-less sky entities
 * authored by the World inspector.
 */
export const isHierarchyVisible = (world: World, entityId: Entity): boolean => {
  if (hasComponent(world, entityId, Input)) return false;
  if (hasComponent(world, entityId, Skybox) && !hasComponent(world, entityId, Transform)) {
    return false;
  }
  return true;
};
