import type { AnyComponentType } from './component-type';
import type { World } from './world';
import type { Schema } from '../schema/field';
import { applySchemaInPlace, createFromSchema, reviveFromSchema } from '../schema/values';

type PatchListener = (type: AnyComponentType) => void;

const patchListeners = new Set<PatchListener>();

/**
 * Fires after a user component is patched in place (HMR / redefine).
 * Engines subscribe so they can rebake live data and refresh the Inspector.
 */
export const subscribeComponentPatch = (listener: PatchListener): (() => void) => {
    patchListeners.add(listener);
    return () => {
        patchListeners.delete(listener);
    };
};

const notifyPatched = (type: AnyComponentType): void => {
    patchListeners.forEach((listener) => listener(type));
};

/**
 * Writable view of the interned handle. The public `ComponentType` fields are
 * readonly for callers; HMR must replace schema and hooks on the same object
 * so queries and lifecycle systems keep their index.
 */
interface MutableUserType {
    schema?: Schema;
    create: () => unknown;
    revive?: (raw: unknown) => unknown;
    onStart?: AnyComponentType['onStart'];
    onUpdate?: AnyComponentType['onUpdate'];
    onDestroy?: AnyComponentType['onDestroy'];
}

/**
 * Replaces schema and hooks on an already interned user component.
 * Returns the original handle so entity data and system queries stay valid.
 */
export const patchUserComponent = (
    existing: AnyComponentType,
    config: {
        schema: Schema;
        onStart?: AnyComponentType['onStart'];
        onUpdate?: AnyComponentType['onUpdate'];
        onDestroy?: AnyComponentType['onDestroy'];
    }
): AnyComponentType => {
    const target = existing as MutableUserType;
    target.schema = config.schema;
    target.create = () => createFromSchema(config.schema);
    target.revive = (raw) => reviveFromSchema(config.schema, raw);
    target.onStart = config.onStart;
    target.onUpdate = config.onUpdate;
    target.onDestroy = config.onDestroy;
    notifyPatched(existing);
    return existing;
};

/**
 * Merges the current schema into every live instance of `type`, in place.
 */
export const rebakeComponentData = (world: World, type: AnyComponentType): void => {
    if (!type.schema) return;
    const store = world._stores[type.index];
    if (!store) return;

    store.forEach((data) => {
        if (typeof data !== 'object' || data === null) return;
        applySchemaInPlace(type.schema as Schema, data as Record<string, unknown>);
    });
};
