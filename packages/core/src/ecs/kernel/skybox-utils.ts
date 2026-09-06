import type { World } from './world';
import type { Entity } from '../types';
import { defineQuery, runQuery } from './query';
import { Skybox } from '../components/skybox';

const skyboxQuery = defineQuery([Skybox]);

/**
 * First entity that has a `Skybox`, or `null` when none exist.
 */
export const pickSkybox = (world: World): Entity | null => {
    for (const entityId of runQuery(world, skyboxQuery)) return entityId;
    return null;
};
