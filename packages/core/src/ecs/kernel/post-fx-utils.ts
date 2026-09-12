import type { World } from './world';
import type { Entity } from '../types';
import { defineQuery, runQuery } from './query';
import { addComponent, hasComponent, removeComponent } from './component';
import { createEntity, destroyEntity } from './entity';
import { PostFx, createPostFx } from '../components/post-fx';
import { Name, createName } from '../components/name';
import { Transform } from '../components/transform';
import { Mesh } from '../components/mesh';

const postFxQuery = defineQuery([PostFx]);

/** Hierarchy label for a filter-only world entity. */
export const WORLD_POST_FX_NAME = 'PostFx';

/**
 * First entity that has `PostFx`, or `null` when none exist.
 */
export const pickPostFx = (world: World): Entity | null => {
    for (const entityId of runQuery(world, postFxQuery)) return entityId;
    return null;
};

/**
 * Returns the authored filter entity, creating a Name + PostFx entity (no
 * Transform) when the scene still uses identity grading.
 */
export const ensurePostFx = (world: World): Entity => {
    const existing = pickPostFx(world);
    if (existing !== null) return existing;

    const entity = createEntity(world);
    addComponent(world, entity, Name, createName(WORLD_POST_FX_NAME));
    addComponent(world, entity, PostFx, createPostFx());
    return entity;
};

/**
 * Drops authored filters. A filter-only entity is destroyed; a mesh that
 * also carried `PostFx` just loses the component.
 */
export const clearPostFx = (world: World): void => {
    const entity = pickPostFx(world);
    if (entity === null) return;

    const parkedOnObject =
        hasComponent(world, entity, Transform) || hasComponent(world, entity, Mesh);
    if (parkedOnObject) {
        removeComponent(world, entity, PostFx);
        return;
    }

    destroyEntity(world, entity);
};
