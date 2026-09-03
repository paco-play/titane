import type { Entity, World } from '@titane/core';
import {
  addComponent,
  createPrimitive,
  createRigidBody,
  createPlayerControlled,
  RigidBody,
  PlayerControlled
} from '@titane/core';
import { SLAB_SIZE } from './constants';

/** Entities the Drop demo needs after seeding. */
export interface SeededScene {
  player: Entity;
}

const CRATE_OFFSETS: readonly { x: number; z: number }[] = [
  { x: 2, z: -1 },
  { x: -2.2, z: 1.4 },
  { x: 1.4, z: 2.2 }
];

/**
 * Spawns a fixed slab, a dynamic player sphere, and a few dynamic crates.
 * @param world - The live ECS world.
 * @returns The player entity, used by gameplay systems.
 */
export const seedDropScene = (world: World): SeededScene => {
  const ground = createPrimitive(world, {
    name: 'Ground',
    primitive: 'box',
    color: '#3f3f46',
    position: { x: 0, y: -0.25, z: 0 },
    scale: { x: SLAB_SIZE, y: 0.5, z: SLAB_SIZE }
  });
  addComponent(world, ground, RigidBody, createRigidBody('fixed'));

  const player = createPrimitive(world, {
    name: 'Player',
    primitive: 'sphere',
    color: '#4ade80',
    position: { x: 0, y: 1.5, z: 0 }
  });
  addComponent(world, player, RigidBody, createRigidBody('dynamic'));
  addComponent(world, player, PlayerControlled, createPlayerControlled());

  CRATE_OFFSETS.forEach((offset, index) => {
    const crate = createPrimitive(world, {
      name: `Crate ${index + 1}`,
      primitive: 'box',
      color: '#f59e0b',
      position: { x: offset.x, y: 2 + index * 0.9, z: offset.z },
      scale: { x: 0.8, y: 0.8, z: 0.8 }
    });
    addComponent(world, crate, RigidBody, createRigidBody('dynamic'));
  });

  return { player };
};
