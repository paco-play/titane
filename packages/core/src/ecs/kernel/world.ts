import type { Entity } from '../types';

/**
 * A single component store: maps the entities owning the component to its data.
 * `undefined` slots mean the component was never used in this World.
 */
export type ComponentStore = Map<Entity, unknown>;

/**
 * The ECS World structure.
 * Internal data is prefixed with '_' to discourage direct access.
 */
export interface World {
    readonly entities: {
        nextId: number;
        active: Set<Entity>;
        /** Pool of IDs available for reuse */
        recycled: Entity[];
    };
    /**
     * @internal Component storage indexed by `ComponentType.index`.
     * Array offsets replace string hashing on every access. Use the API functions.
     */
    readonly _stores: (ComponentStore | undefined)[];
}

/**
 * Creates a fresh, empty World state.
 * @returns A new World instance.
 */
export const createWorld = (): World => ({
    entities: {
        nextId: 0,
        active: new Set<Entity>(),
        recycled: [],
    },
    _stores: [],
});
