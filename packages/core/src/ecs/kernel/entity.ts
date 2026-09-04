import type { World } from './world';
import type { Entity } from '../types';
import { getComponent, updateComponent } from './component';
import { Transform } from '../components/transform';
import { clearOrphansForEntity, copyOrphansForEntity } from './orphans';

/**
 * Spawns a new entity in the specified world.
 * Will prioritize reusing IDs from the recycled pool.
 * @param world The target world state.
 * @returns The unique Entity ID.
 */
export const createEntity = (world: World): Entity => {
    // 1. Try to get a recycled ID
    const recycledId = world.entities.recycled.pop();

    // 2. Otherwise create a new one
    const entityId = recycledId !== undefined ? recycledId : world.entities.nextId++;

    world.entities.active.add(entityId);
    return entityId;
};

/**
 * Collects an entity together with all of its descendants, parents first.
 *
 * The parent -> children index is built in a single pass so walking a subtree
 * costs O(transforms) instead of one full scan per visited node.
 *
 * @param world The world to walk.
 * @param rootId The entity at the top of the subtree.
 * @returns A new array holding the root followed by every descendant.
 */
const collectSubtree = (world: World, rootId: Entity): Entity[] => {
    const subtree: Entity[] = [rootId];

    const transforms = world._stores[Transform.index];
    if (!transforms) return subtree;

    const childrenByParent = new Map<Entity, Entity[]>();

    for (const entityId of transforms.keys()) {
        const parentId = getComponent(world, entityId, Transform)?.parent;
        if (parentId === undefined || parentId === null) continue;

        const siblings = childrenByParent.get(parentId);
        if (siblings) siblings.push(entityId);
        else childrenByParent.set(parentId, [entityId]);
    }

    // Breadth-first: appending to the array being iterated flattens the tree
    for (let cursor = 0; cursor < subtree.length; cursor++) {
        const children = childrenByParent.get(subtree[cursor]);
        if (!children) continue;

        for (const childId of children) subtree.push(childId);
    }

    return subtree;
};

/**
 * Completely removes an entity, its descendants, and all of their components.
 * Reclaims every freed ID for future use.
 *
 * Children never outlive their parent: a survivor still pointing at a dead
 * entity would keep rendering while being unreachable from the hierarchy.
 *
 * @param world The world state to modify.
 * @param entityId The ID of the subtree root to destroy.
 */
export const destroyEntity = (world: World, entityId: Entity): void => {
    // Safety: don't destroy an entity that isn't active
    if (!world.entities.active.has(entityId)) return;

    let removed = false;
    for (const doomedId of collectSubtree(world, entityId)) {
        // Set.delete reports whether the ID was live, which keeps the recycled
        // pool free of duplicates if the tree ever holds a stale reference.
        if (!world.entities.active.delete(doomedId)) continue;

        for (const store of world._stores) {
            store?.delete(doomedId);
        }

        clearOrphansForEntity(world, doomedId);

        world.entities.recycled.push(doomedId);
        removed = true;
    }

    if (removed) world._generation += 1;
};

/**
 * Duplicates an entity and its whole subtree, deep copying every component.
 *
 * Internal parent links are remapped onto the copies, while the subtree root
 * keeps its original parent so the duplicate appears next to its source.
 *
 * @param world The world state to modify.
 * @param sourceId The entity at the top of the subtree to copy.
 * @returns The ID of the newly created root clone.
 */
export const cloneEntity = (world: World, sourceId: Entity): Entity => {
    const subtree = collectSubtree(world, sourceId);
    const cloneIds = new Map<Entity, Entity>();

    // Reserve every ID first, so parent links can be remapped in a single pass
    for (const originalId of subtree) {
        cloneIds.set(originalId, createEntity(world));
    }

    for (const originalId of subtree) {
        const cloneId = cloneIds.get(originalId);
        if (cloneId === undefined) continue;

        for (const store of world._stores) {
            if (!store) continue;

            const data = store.snapshot(originalId);
            if (data !== undefined) {
                store.set(cloneId, data);
            }
        }

        copyOrphansForEntity(world, originalId, cloneId);

        updateComponent(world, cloneId, Transform, (transform) => {
            transform.isDirty = true;
            if (transform.parent === null) return;

            // A parent outside the subtree is absent from the map: the root
            // therefore stays attached where its source was.
            const clonedParent = cloneIds.get(transform.parent);
            if (clonedParent !== undefined) transform.parent = clonedParent;
        });
    }

    world._generation += 1;
    return cloneIds.get(sourceId) ?? sourceId;
};
