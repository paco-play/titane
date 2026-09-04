import type { ComponentId, Entity } from '../types';
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
    /**
     * @internal Bumped when the world's contents are replaced in place
     * (`restoreWorldState` / `loadWorld`). Lifecycle systems use it to
     * re-run `onStart` after Play stop restores the edit snapshot.
     */
    _epoch: number;
    /**
     * @internal Unknown component payloads. Kept so a missing script does
     * not destroy authored data. Use {@link listOrphans} / {@link removeOrphan}.
     */
    readonly _orphans: Map<ComponentId, Map<Entity, unknown>>;
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
    _epoch: 0,
    _orphans: new Map()
});
