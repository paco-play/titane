import type { Entity, World } from '@titane/core';
import { getComponent, Transform } from '@titane/core';

/**
 * Writes local scale onto a transform already in the world.
 * `createPrimitive` has no scale option; this is the authored seam.
 */
export const applyScale = (
  world: World,
  entity: Entity,
  x: number,
  y: number,
  z: number
): void => {
  const transform = getComponent(world, entity, Transform);
  if (!transform) return;
  transform.scale.x = x;
  transform.scale.y = y;
  transform.scale.z = z;
  transform.isDirty = true;
};
