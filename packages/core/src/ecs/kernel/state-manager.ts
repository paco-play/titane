import type { World } from './world';
import type { Entity } from '../types';
import { cloneWorld } from './world-utils';

/**
 * Captures the current state of the world as a deep clone.
 * This is used to create a "checkpoint" before starting a simulation.
 * @param world - The source world to snapshot.
 * @returns A structurally identical but independent World instance.
 */
export const captureWorldState = (world: World): World => cloneWorld(world);

/**
 * Restores a world instance using data from a snapshot.
 *
 * IMPORTANT: This function performs an IN-PLACE mutation of the target world.
 * We do not replace the 'target' reference or its component stores. This ensures
 * that external systems (UI, Renderers, InputDrivers) holding references to these
 * objects do not lose track of the data.
 *
 * @param target - The active world instance to overwrite.
 * @param source - The snapshot world containing the data to restore.
 */
export const restoreWorldState = (target: World, source: World): void => {
    // 1. Sync entity metadata in place so held references stay valid
    target.entities.nextId = source.entities.nextId;

    target.entities.active.clear();
    source.entities.active.forEach(id => target.entities.active.add(id));

    target.entities.recycled.length = 0;
    for (const id of source.entities.recycled) {
        target.entities.recycled.push(id);
    }

    // 2. Sync component stores slot by slot
    const slotCount = Math.max(target._stores.length, source._stores.length);

    for (let slot = 0; slot < slotCount; slot++) {
        const sourceStore = source._stores[slot];
        let liveStore = target._stores[slot];

        // Slot unused in the snapshot: empty the live store but keep its reference
        if (!sourceStore) {
            liveStore?.clear();
            continue;
        }

        if (!liveStore) {
            liveStore = new Map<Entity, unknown>();
            target._stores[slot] = liveStore;
        }

        /**
         * We clear the existing Map instead of reassigning it.
         * This preserves the object reference for UI reactivity (Vue/Nuxt).
         */
        liveStore.clear();

        // structuredClone ensures the snapshot remains immutable during gameplay
        sourceStore.forEach((data, entityId) => {
            liveStore.set(entityId, structuredClone(data));
        });
    }
};
