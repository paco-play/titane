import type { AnyComponentType } from './kernel/component-type';
import type { Entity } from './types';
import type { Transform } from './components/transform';

/**
 * True when `value` is a non-null, non-array object.
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isTransformData = (value: unknown): value is Transform =>
    isPlainObject(value) && 'parent' in value && 'position' in value;

/**
 * Maps a prefab-local entity id onto the destination set.
 * Ids outside the subtree become `null`.
 */
export const remapEntityId = (
    value: Entity | null,
    ids: ReadonlyMap<Entity, Entity>
): Entity | null => {
    if (value === null) return null;
    return ids.get(value) ?? null;
};

/**
 * Rewrites `Transform.parent` and `f.entity()` fields using `ids`.
 */
export const remapPrefabData = (
    type: AnyComponentType,
    data: unknown,
    ids: ReadonlyMap<Entity, Entity>
): unknown => {
    if (type.id === 'transform' && isTransformData(data)) {
        data.parent = remapEntityId(data.parent, ids);
        data.isDirty = true;
        return data;
    }

    const schema = type.schema;
    if (!schema || !isPlainObject(data)) return data;

    for (const key of Object.keys(schema)) {
        const field = schema[key];
        if (!field || field.kind !== 'entity') continue;
        const value = data[key];
        if (value === null) continue;
        if (typeof value !== 'number') {
            data[key] = null;
            continue;
        }
        data[key] = remapEntityId(value, ids);
    }

    return data;
};
