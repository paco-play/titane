import type { World, ComponentStore } from './world';
import type { Entity } from '../types';

/**
 * Creates a deep copy of the entire ECS World.
 * Essential for "Save/Load" features and Scene Reset after simulation.
 * @param world - The source world to clone.
 * @returns A completely independent copy of the world.
 */
export const cloneWorld = (world: World): World => {
    // Clone entity metadata
    const clonedEntities = {
        nextId: world.entities.nextId,
        active: new Set(world.entities.active),
        recycled: [...world.entities.recycled]
    };

    // Clone component stores, preserving the dense slot layout
    const clonedStores: (ComponentStore | undefined)[] = world._stores.map((store) => {
        if (!store) return undefined;

        const newStore = new Map<Entity, unknown>();
        store.forEach((data, entityId) => {
            // structuredClone ensures a deep copy of the pure data
            newStore.set(entityId, structuredClone(data));
        });
        return newStore;
    });

    return {
        entities: clonedEntities,
        _stores: clonedStores
    };
};
