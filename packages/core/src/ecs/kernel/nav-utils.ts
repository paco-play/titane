import type { World } from './world';
import type { Entity } from '../types';
import { defineQuery, runQuery } from './query';
import { addComponent, hasComponent, removeComponent } from './component';
import { createEntity, destroyEntity } from './entity';
import { Nav, createNav } from '../components/nav';
import { Name, createName } from '../components/name';
import { Transform } from '../components/transform';
import { Mesh } from '../components/mesh';

const navQuery = defineQuery([Nav]);

/** Hierarchy label for a nav-only world entity. */
export const WORLD_NAV_NAME = 'Nav';

/**
 * First entity that has `Nav`, or `null` when none exist.
 */
export const pickNav = (world: World): Entity | null => {
    for (const entityId of runQuery(world, navQuery)) return entityId;
    return null;
};

/**
 * Returns the authored nav entity, creating a Name + Nav entity (no Transform)
 * when the scene has not baked yet.
 */
export const ensureNav = (world: World): Entity => {
    const existing = pickNav(world);
    if (existing !== null) return existing;

    const entity = createEntity(world);
    addComponent(world, entity, Name, createName(WORLD_NAV_NAME));
    addComponent(world, entity, Nav, createNav());
    return entity;
};

/**
 * Drops authored nav. A nav-only entity is destroyed; a mesh that also
 * carried `Nav` just loses the component.
 */
export const clearNav = (world: World): void => {
    const entity = pickNav(world);
    if (entity === null) return;

    const parkedOnObject =
        hasComponent(world, entity, Transform) || hasComponent(world, entity, Mesh);
    if (parkedOnObject) {
        removeComponent(world, entity, Nav);
        return;
    }

    destroyEntity(world, entity);
};
