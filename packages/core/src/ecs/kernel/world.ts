import type { Entity } from '../types';
import type { ComponentStore } from './store';

export type { ComponentStore } from './store';

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
    /**
     * @internal Bumped when component membership changes.
     * Query caches compare against this instead of rescanning every frame.
     */
    _generation: number;
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
    _generation: 0,
});
