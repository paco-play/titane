import type { World } from './world';
import type { Entity } from '../types';
import { defineQuery, runQuery } from './query';
import { addComponent, hasComponent, removeComponent } from './component';
import { createEntity, destroyEntity } from './entity';
import { Skybox, createSkybox } from '../components/skybox';
import { Name, createName } from '../components/name';
import { Transform } from '../components/transform';
import { Mesh } from '../components/mesh';

const skyboxQuery = defineQuery([Skybox]);

/** Hierarchy label for a sky-only world entity. */
export const WORLD_SKYBOX_NAME = 'Skybox';

/**
 * First entity that has a `Skybox`, or `null` when none exist.
 */
export const pickSkybox = (world: World): Entity | null => {
    for (const entityId of runQuery(world, skyboxQuery)) return entityId;
    return null;
};

/**
 * Returns the authored sky entity, creating a Name + Skybox entity (no
 * Transform) when the scene still uses the engine default.
 */
export const ensureSkybox = (world: World): Entity => {
    const existing = pickSkybox(world);
    if (existing !== null) return existing;

    const entity = createEntity(world);
    addComponent(world, entity, Name, createName(WORLD_SKYBOX_NAME));
    addComponent(world, entity, Skybox, createSkybox());
    return entity;
};

/**
 * Drops the authored sky. A sky-only entity is destroyed; a mesh that also
 * carried `Skybox` just loses the component.
 */
export const clearSkybox = (world: World): void => {
    const entity = pickSkybox(world);
    if (entity === null) return;

    const parkedOnObject =
        hasComponent(world, entity, Transform) || hasComponent(world, entity, Mesh);
    if (parkedOnObject) {
        removeComponent(world, entity, Skybox);
        return;
    }

    destroyEntity(world, entity);
};
