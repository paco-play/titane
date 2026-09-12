import type { World } from './world';
import type { Entity } from '../types';
import { getComponent, updateComponent } from './component';
import { Transform } from '../components/transform';
import { defineQuery, runQuery } from './query';

/** Shared filter over every entity carrying a Transform. */
const transformQuery = defineQuery([Transform]);

/**
 * True when `parentId` can parent `childId` without a cycle.
 * Unparent (`null`) is always allowed. Self-parent and parenting under a
 * descendant are rejected.
 */
export const canSetParent = (
    world: World,
    childId: Entity,
    parentId: Entity | null
): boolean => {
    if (parentId === null) return true;
    if (parentId === childId) return false;

    let current: Entity | null = parentId;
    const seen = new Set<Entity>();
    while (current !== null) {
        if (current === childId) return false;
        if (seen.has(current)) return false;
        seen.add(current);
        current = getComponent(world, current, Transform)?.parent ?? null;
    }
    return true;
};

/**
 * Sets a parent-child relationship between two entities.
 * No-op when the link would cycle.
 */
export const setParent = (world: World, childId: Entity, parentId: Entity | null): void => {
    if (!canSetParent(world, childId, parentId)) return;
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
