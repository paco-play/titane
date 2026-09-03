import type { Entity, World } from '@titane/core';
import {
  addComponent,
  defineQuery,
  getComponent,
  hasComponent,
  runQuery,
  Name,
  PlayerControlled,
  Transform,
  createPlayerControlled
} from '@titane/core';

const controlledQuery = defineQuery([PlayerControlled, Transform]);
const namedQuery = defineQuery([Name, Transform]);

/** Entity name the editor and the seeded scene use for the WASD body. */
export const PLAYER_NAME = 'Player';

/**
 * Resolves the entity gameplay systems should drive.
 * Prefers the `PlayerControlled` tag; falls back to the name "Player"
 * and tags it so WASD works on an editor-authored scene.
 */
export const findPlayer = (world: World): Entity | null => {
  const tagged = runQuery(world, controlledQuery)[0];
  if (tagged !== undefined) return tagged;

  for (const entity of runQuery(world, namedQuery)) {
    if (getComponent(world, entity, Name)?.value !== PLAYER_NAME) continue;
    if (!hasComponent(world, entity, PlayerControlled)) {
      addComponent(world, entity, PlayerControlled, createPlayerControlled());
    }
    return entity;
  }

  return null;
};
