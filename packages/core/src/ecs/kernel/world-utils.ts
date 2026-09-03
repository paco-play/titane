import type { World, ComponentStore } from './world';

/**
 * Creates a deep copy of the entire ECS World.
 * Essential for "Save/Load" features and Scene Reset after simulation.
 * @param world - The source world to clone.
 * @returns A completely independent copy of the world.
 */
export const cloneWorld = (world: World): World => {
    const clonedStores: (ComponentStore | undefined)[] = world._stores.map((store) =>
        store?.clone()
    );

    return {
        entities: {
            nextId: world.entities.nextId,
            active: new Set(world.entities.active),
            recycled: [...world.entities.recycled]
        },
        _stores: clonedStores,
        _generation: 0
    };
};
