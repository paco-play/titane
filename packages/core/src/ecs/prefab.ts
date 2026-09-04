import type { World } from './kernel/world';
import type { Entity, ComponentId } from './types';
import { collectSubtree, createEntity } from './kernel/entity';
import { addComponent } from './kernel/component';
import { getComponentTypeById, getComponentTypeByIndex } from './kernel/registry';
import { listOrphans, setOrphan } from './kernel/orphans';
import { remapPrefabData } from './prefab-remap';

/** Schema version of the prefab `.titane` format. */
export const PREFAB_FORMAT_VERSION = 1;

/**
 * A reusable subtree: entities, components, and missing-script orphans.
 * Ids are compact and local to the file. The root's parent is always `null`.
 */
export interface SerializedPrefab {
    version: number;
    root: Entity;
    entities: Entity[];
    components: Record<ComponentId, Record<string, unknown>>;
}

const SKIP_IDS = new Set(['input']);

const compactIds = (subtree: readonly Entity[]): Map<Entity, Entity> => {
    const ids = new Map<Entity, Entity>();
    subtree.forEach((original, index) => {
        ids.set(original, index);
    });
    return ids;
};

const putComponent = (
    components: SerializedPrefab['components'],
    componentId: ComponentId,
    localId: Entity,
    data: unknown
): void => {
    const record = components[componentId] ?? {};
    components[componentId] = record;
    record[String(localId)] = data;
};

/**
 * True when `raw` looks like a prefab payload, not a full scene.
 */
export const isSerializedPrefab = (raw: unknown): raw is SerializedPrefab => {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return false;
    const data = raw as Partial<SerializedPrefab>;
    return typeof data.version === 'number'
        && typeof data.root === 'number'
        && Array.isArray(data.entities)
        && typeof data.components === 'object'
        && data.components !== null
        && !Array.isArray(data.components);
};

/**
 * Packs an entity and its descendants into a portable prefab.
 * Parent links and `f.entity()` fields that leave the subtree become `null`.
 */
export const serializePrefab = (world: World, rootId: Entity): SerializedPrefab => {
    const subtree = collectSubtree(world, rootId);
    const ids = compactIds(subtree);
    const components: SerializedPrefab['components'] = {};

    for (const originalId of subtree) {
        const localId = ids.get(originalId);
        if (localId === undefined) continue;

        world._stores.forEach((store, index) => {
            if (!store) return;
            const type = getComponentTypeByIndex(index);
            if (!type || SKIP_IDS.has(type.id)) return;
            const snapshot = store.snapshot(originalId);
            if (snapshot === undefined) return;
            const copy = remapPrefabData(type, structuredClone(snapshot), ids);
            putComponent(components, type.id, localId, copy);
        });

        for (const orphan of listOrphans(world, originalId)) {
            putComponent(components, orphan.id, localId, structuredClone(orphan.data));
        }
    }

    return {
        version: PREFAB_FORMAT_VERSION,
        root: ids.get(rootId) ?? 0,
        entities: subtree.map((_, index) => index),
        components
    };
};

/**
 * Stamps a prefab into `world`. The instance root is unparented; the caller
 * sets pose and parent. Returns the new root entity.
 */
export const instantiatePrefab = (world: World, prefab: SerializedPrefab): Entity => {
    if (prefab.version > PREFAB_FORMAT_VERSION) {
        throw new Error(
            `[Titane] Prefab format v${prefab.version} is newer than the supported v${PREFAB_FORMAT_VERSION}.`
        );
    }

    const ids = new Map<Entity, Entity>();
    for (const localId of prefab.entities) {
        ids.set(localId, createEntity(world));
    }

    const root = ids.get(prefab.root);
    if (root === undefined) {
        throw new Error('[Titane] Prefab root is missing from the entity list.');
    }

    for (const [componentId, byEntity] of Object.entries(prefab.components)) {
        const type = getComponentTypeById(componentId);

        for (const [localKey, raw] of Object.entries(byEntity)) {
            const worldId = ids.get(Number(localKey));
            if (worldId === undefined) continue;

            if (!type) {
                setOrphan(world, worldId, componentId, structuredClone(raw));
                continue;
            }
            if (SKIP_IDS.has(type.id)) continue;

            const revived = type.revive ? type.revive(structuredClone(raw)) : structuredClone(raw);
            addComponent(world, worldId, type, remapPrefabData(type, revived, ids));
        }
    }

    world._generation += 1;
    return root;
};
