import type { World } from './world';
import type { Entity, ComponentId } from '../types';

/**
 * Snapshot of one unknown component payload kept for a missing script.
 */
export interface OrphanRecord {
    readonly id: ComponentId;
    readonly data: unknown;
}

/**
 * Deep-clones the orphan map so snapshots and `cloneWorld` never share nested values.
 */
export const cloneOrphanMap = (
    source: ReadonlyMap<ComponentId, Map<Entity, unknown>>
): Map<ComponentId, Map<Entity, unknown>> => {
    const cloned = new Map<ComponentId, Map<Entity, unknown>>();
    source.forEach((byEntity, componentId) => {
        const copy = new Map<Entity, unknown>();
        byEntity.forEach((data, entityId) => {
            copy.set(entityId, structuredClone(data));
        });
        cloned.set(componentId, copy);
    });
    return cloned;
};

/**
 * Replaces `target._orphans` contents while keeping the Map identity.
 * `restoreWorldState` needs that so holders of the World stay bound.
 */
export const copyOrphans = (target: World, source: World): void => {
    target._orphans.clear();
    cloneOrphanMap(source._orphans).forEach((byEntity, componentId) => {
        target._orphans.set(componentId, byEntity);
    });
};

/**
 * Stores a payload for a component id that is not in the registry.
 */
export const setOrphan = (
    world: World,
    entityId: Entity,
    componentId: ComponentId,
    data: unknown
): void => {
    let byEntity = world._orphans.get(componentId);
    if (!byEntity) {
        byEntity = new Map<Entity, unknown>();
        world._orphans.set(componentId, byEntity);
    }
    byEntity.set(entityId, data);
};

/**
 * Drops every unknown payload attached to one entity.
 */
export const clearOrphansForEntity = (world: World, entityId: Entity): void => {
    for (const [componentId, byEntity] of world._orphans) {
        if (!byEntity.delete(entityId)) continue;
        if (byEntity.size === 0) world._orphans.delete(componentId);
    }
};

/**
 * Removes one missing-script payload from an entity.
 */
export const removeOrphan = (
    world: World,
    entityId: Entity,
    componentId: ComponentId
): boolean => {
    const byEntity = world._orphans.get(componentId);
    if (!byEntity) return false;
    const removed = byEntity.delete(entityId);
    if (byEntity.size === 0) world._orphans.delete(componentId);
    if (removed) world._generation += 1;
    return removed;
};

/**
 * Unknown payloads stored for this entity, in insertion order.
 */
export const listOrphans = (world: World, entityId: Entity): OrphanRecord[] => {
    const records: OrphanRecord[] = [];
    world._orphans.forEach((byEntity, id) => {
        if (!byEntity.has(entityId)) return;
        records.push({ id, data: byEntity.get(entityId) });
    });
    return records;
};

/**
 * Copies unknown payloads from one entity onto another (clone).
 */
export const copyOrphansForEntity = (
    world: World,
    sourceId: Entity,
    targetId: Entity
): void => {
    world._orphans.forEach((byEntity, componentId) => {
        if (!byEntity.has(sourceId)) return;
        const data = byEntity.get(sourceId);
        setOrphan(world, targetId, componentId, structuredClone(data));
    });
};
