import {
  getChildren,
  getComponent,
  Transform,
  type Entity,
  type Vec3,
  type World
} from '@titane/core';

/** Spacing between newly spawned primitives, in metres. */
const SPAWN_GAP = 2.5;

/**
 * Picks a local position for a new primitive so it does not sit inside
 * an existing object. Roots are placed past the rightmost root. Children
 * are offset along local X, one gap away from the parent and from siblings.
 *
 * @param world - The ECS world.
 * @param parentId - The entity the new object will be parented to, or null.
 */
export const nextSpawnPosition = (world: World, parentId: Entity | null): Vec3 => {
  const siblings = getChildren(world, parentId);

  if (parentId !== null) {
    return { x: SPAWN_GAP * (siblings.length + 1), y: 0, z: 0 };
  }

  let maxX = 0;
  for (const entityId of siblings) {
    const transform = getComponent(world, entityId, Transform);
    if (transform) maxX = Math.max(maxX, transform.position.x);
  }

  return { x: siblings.length === 0 ? 0 : maxX + SPAWN_GAP, y: 0, z: 0 };
};
