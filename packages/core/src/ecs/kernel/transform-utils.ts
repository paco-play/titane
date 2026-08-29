import type { World } from './world';
import type { Entity } from '../types';
import { getComponent, updateComponent } from './component';
import { Transform } from '../components/transform';
import { defineQuery, runQuery } from './query';

/** Shared filter over every entity carrying a Transform. */
const transformQuery = defineQuery([Transform]);

/**
 * Sets a parent-child relationship between two entities.
 * @param world - The ECS world instance.
 * @param childId - The entity that will become the child.
 * @param parentId - The entity that will become the parent (or null to detach).
 */
export const setParent = (world: World, childId: Entity, parentId: Entity | null): void => {
    updateComponent(world, childId, Transform, (transform) => {
        transform.parent = parentId;
        transform.isDirty = true;
    });
};

/**
 * Retrieves all direct children of a given entity.
 * @param world - The ECS world instance.
 * @param parentId - The parent entity ID, or null to list root entities.
 * @returns A newly allocated array of child entities.
 */
export const getChildren = (world: World, parentId: Entity | null): Entity[] => {
    const children: Entity[] = [];

    for (const entityId of runQuery(world, transformQuery)) {
        const transform = getComponent(world, entityId, Transform);
        if (transform?.parent === parentId) children.push(entityId);
    }

    return children;
};
