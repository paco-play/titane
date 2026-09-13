import type { World } from './world';
import type { Entity } from '../types';
import { defineQuery, runQuery } from './query';
import { addComponent, hasComponent, removeComponent } from './component';
import { createEntity, destroyEntity } from './entity';
import { Fog, createFog } from '../components/fog';
import { Name, createName } from '../components/name';
import { Transform } from '../components/transform';
import { Mesh } from '../components/mesh';

const fogQuery = defineQuery([Fog]);

/** Hierarchy label for a fog-only world entity. */
export const WORLD_FOG_NAME = 'Fog';

/**
 * First entity that has `Fog`, or `null` when none exist.
 */
export const pickFog = (world: World): Entity | null => {
  for (const entityId of runQuery(world, fogQuery)) return entityId;
  return null;
};

/**
 * Returns the authored fog entity, creating a Name + Fog entity (no Transform)
 * when the scene has no fog.
 */
export const ensureFog = (world: World): Entity => {
  const existing = pickFog(world);
  if (existing !== null) return existing;

  const entity = createEntity(world);
  addComponent(world, entity, Name, createName(WORLD_FOG_NAME));
  addComponent(world, entity, Fog, createFog());
  return entity;
};

/**
 * Drops authored fog. A fog-only entity is destroyed; a mesh that also
 * carried `Fog` just loses the component.
 */
export const clearFog = (world: World): void => {
  const entity = pickFog(world);
  if (entity === null) return;

  const parkedOnObject =
    hasComponent(world, entity, Transform) || hasComponent(world, entity, Mesh);
  if (parkedOnObject) {
    removeComponent(world, entity, Fog);
    return;
  }

  destroyEntity(world, entity);
};
