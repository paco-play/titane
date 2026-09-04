import type { World } from './kernel/world';
import type { Entity, ComponentId } from './types';
import { createWorld } from './kernel/world';
import { getComponentTypeById, getComponentTypeByIndex } from './kernel/registry';
import { createSparseStore } from './kernel/store';
import { setOrphan } from './kernel/orphans';

/** Schema version of the `.titane` scene format. */
export const SCENE_FORMAT_VERSION = 1;

/**
 * Portable representation of the World state.
 * Stores are flattened into plain records for JSON compatibility.
 */
export interface SerializedWorld {
    /** Schema version, so future loaders can migrate older scenes. */
    version: number;
    nextId: number;
    entities: Entity[];
    /**
     * Freed IDs awaiting reuse. Without it a reloaded scene would allocate
     * differently from the session that saved it.
     * Absent from scenes written before this field existed.
     */
    recycled?: Entity[];
    components: Record<ComponentId, Record<string, unknown>>;
}

/**
 * Converts a live ECS World into a serializable plain object.
 * @param world - The active ECS world state.
 * @returns A JSON-friendly object structure.
 */
export const serializeWorld = (world: World): SerializedWorld => {
    const serialized: SerializedWorld = {
        version: SCENE_FORMAT_VERSION,
        nextId: world.entities.nextId,
        entities: Array.from(world.entities.active),
        recycled: Array.from(world.entities.recycled),
        components: {}
    };

    world._stores.forEach((store, index) => {
        if (!store || store.size === 0) return;

        // The registry owns the index -> id mapping, so slots stay anonymous on disk
        const type = getComponentTypeByIndex(index);
        if (!type) return;

        serialized.components[type.id] = {};
        const record = serialized.components[type.id];
        store.forEach((_data, entityId) => {
            const snapshot = store.snapshot(entityId);
            if (snapshot !== undefined) record[String(entityId)] = snapshot;
        });
    });

    world._orphans.forEach((byEntity, componentId) => {
        if (byEntity.size === 0) return;
        const record = serialized.components[componentId] ?? {};
        serialized.components[componentId] = record;
        byEntity.forEach((data, entityId) => {
            record[String(entityId)] = structuredClone(data);
        });
    });

    return serialized;
};

/**
 * Reconstructs an ECS World from a serialized data object.
 *
 * Component types resolve their own data through their optional `revive` hook,
 * so the loader stays free of any per-component special casing.
 *
 * @param data - The serialized world data.
 * @returns A fresh, fully populated World instance.
 * @throws If the scene was written by a newer, unsupported format version.
 */
export const deserializeWorld = (data: SerializedWorld): World => {
    const version = data.version ?? 0;
    if (version > SCENE_FORMAT_VERSION) {
        throw new Error(
            `[Titane] Scene format v${version} is newer than the supported v${SCENE_FORMAT_VERSION}.`
        );
    }

    const world = createWorld();

    // 1. Restore internal entity counters, active set and free list
    world.entities.nextId = data.nextId;
    data.entities.forEach(id => world.entities.active.add(id));
    data.recycled?.forEach(id => world.entities.recycled.push(id));

    // 2. Restore all component stores
    for (const [componentId, storeData] of Object.entries(data.components)) {
        const type = getComponentTypeById(componentId);

        // Unknown component: keep the payload so a missing script does not
        // destroy authored data. The Inspector shows a missing-script row.
        if (!type) {
            console.warn(
                `[Titane] Unknown component "${componentId}" kept as a missing script.`
            );
            for (const [entityKey, raw] of Object.entries(storeData)) {
                setOrphan(world, Number(entityKey), componentId, structuredClone(raw));
            }
            continue;
        }

        const store = type.createStore ? type.createStore() : createSparseStore();

        for (const [entityKey, raw] of Object.entries(storeData)) {
            // JSON object keys are always strings, cast back to Entity (number)
            store.set(Number(entityKey), type.revive ? type.revive(raw) : raw);
        }

        world._stores[type.index] = store;
    }

    return world;
};
