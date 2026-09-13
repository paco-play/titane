import type { Entity, World } from '@titane/core';
import { hasComponent, Input, Nav, PostFx, Skybox, Fog, Transform } from '@titane/core';

/**
 * Whether an entity belongs in the Hierarchy tree.
 *
 * Hides the engine `Input` singleton and Transform-less World entities
 * (Skybox, PostFx, Fog) authored from the World inspector.
 */
export const isHierarchyVisible = (world: World, entityId: Entity): boolean => {
  if (hasComponent(world, entityId, Input)) return false;
  if (hasComponent(world, entityId, Transform)) return true;
  return !hasComponent(world, entityId, Skybox)
    && !hasComponent(world, entityId, PostFx)
    && !hasComponent(world, entityId, Fog)
    && !hasComponent(world, entityId, Nav);
};
