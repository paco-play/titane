import type { Entity, World } from '@titane/core';
import { defineQuery, getComponent, runQuery, Sensor } from '@titane/core';

const sensorQuery = defineQuery([Sensor]);

/** Sensor tag used by the seeded Drop scene and by editor-authored kill zones. */
export const KILL_ZONE_TAG = 'kill-zone';

/**
 * Finds the first sensor tagged as the Drop kill zone.
 */
export const findKillZone = (world: World): Entity | null => {
  for (const entity of runQuery(world, sensorQuery)) {
    if (getComponent(world, entity, Sensor)?.tag === KILL_ZONE_TAG) return entity;
  }
  return null;
};
