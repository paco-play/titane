import type { World, ComponentStore } from './world';
import type { Entity } from '../types';
import type { AnyComponentType } from './component-type';

/**
 * A reusable filter over the World.
 *
 * Declare one per system at module scope, then call `runQuery` every frame:
 * the internal buffers are recycled, so iterating entities allocates nothing.
 * Results are reused across frames until `World._generation` changes.
 */
export interface Query {
    /** Component types an entity must all possess to match. */
    readonly types: readonly AnyComponentType[];
    /** @internal Recycled result buffer. Valid until the next `runQuery` call. */
    readonly _results: Entity[];
    /** @internal Recycled scratch buffer holding the resolved stores. */
    readonly _stores: ComponentStore[];
    /** @internal World the cached results were built against. */
    _cachedWorld: World | null;
    /** @internal `World._generation` at the last rebuild. */
    _cachedGeneration: number;
}

/**
 * Creates a reusable query for a set of component types.
 * @param types The component handles an entity must all have to match.
 * @returns A Query to be passed to `runQuery`.
 */
export const defineQuery = (types: readonly AnyComponentType[]): Query => ({
    types,
    _results: [],
    _stores: [],
    _cachedWorld: null,
    _cachedGeneration: -1
});

/**
 * Resolves the entities matching a query.
 *
 * Optimization: iterates the smallest store first so the number of membership
 * checks is bound by the rarest component instead of the largest one.
 * Unchanged structure reuses the previous result instead of scanning again.
 *
 * @param world The world state to query.
 * @param query The query to evaluate.
 * @returns The matching entities. Owned by the query, do not retain or mutate.
 */
export const runQuery = (world: World, query: Query): readonly Entity[] => {
    const { types, _results: results, _stores: stores } = query;

    if (
        types.length > 0
        && query._cachedWorld === world
        && query._cachedGeneration === world._generation
    ) {
        return results;
    }

    results.length = 0;
    stores.length = 0;
    query._cachedWorld = world;
    query._cachedGeneration = world._generation;

    if (types.length === 0) return results;

    // 1. Resolve every store. A single missing store means nothing can match.
    for (const type of types) {
        const store = world._stores[type.index];
        if (!store) return results;
        stores.push(store);
    }

    // 2. Iterate the rarest component to minimize membership checks
    let smallestStore: ComponentStore | undefined;
    for (const store of stores) {
        if (!smallestStore || store.size < smallestStore.size) smallestStore = store;
    }
    if (!smallestStore) return results;

    for (const entityId of smallestStore.keys()) {
        let matches = true;

        for (const store of stores) {
            if (store !== smallestStore && !store.has(entityId)) {
                matches = false;
                break;
            }
        }

        if (matches) results.push(entityId);
    }

    return results;
};

/**
 * Convenience wrapper for one-off filtering (editor tooling, tests).
 * Allocates a fresh array, so never call it from a system running every frame.
 * @param world The world state to query.
 * @param types The component handles an entity must all have to match.
 * @returns A newly allocated array of matching entities.
 */
export const queryEntities = (
    world: World,
    types: readonly AnyComponentType[]
): Entity[] => [...runQuery(world, defineQuery(types))];
