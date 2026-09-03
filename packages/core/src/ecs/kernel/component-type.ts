import type { ComponentId } from '../types';
import type { ComponentStore } from './store';

/**
 * Phantom marker carrying the component data type at compile time.
 * It is never present at runtime: it only exists so that TypeScript can
 * infer `T` from a `ComponentType<T>` token passed to an accessor.
 */
declare const COMPONENT_BRAND: unique symbol;

/**
 * A typed handle describing one component kind.
 *
 * A `ComponentType` is the only key accepted by the ECS accessors. Because it
 * carries its data type, `getComponent(world, entity, Transform)` resolves to
 * `Transform | undefined` without any generic argument or cast.
 */
export interface ComponentType<T> {
    /** Stable textual identifier, used by serialization and debugging. */
    readonly id: ComponentId;
    /**
     * Dense slot index assigned at registration time.
     * Stores are looked up by array index instead of string hashing.
     */
    readonly index: number;
    /** Produces a fresh instance filled with default values. */
    readonly create: () => T;
    /**
     * Rebuilds a live instance from plain JSON data.
     * Required for components holding non-JSON values (typed arrays, etc.).
     */
    readonly revive?: (raw: unknown) => T;
    /**
     * Optional packed store. When omitted, the kernel uses a sparse map.
     * Hot numeric components pass a SoA factory so accessors stay unchanged.
     */
    readonly createStore?: () => ComponentStore<T>;
    /** @internal Compile-time only. Do not read. */
    readonly [COMPONENT_BRAND]?: T;
}

/**
 * Extracts the data type carried by a `ComponentType`.
 */
export type ComponentValue<C> = C extends ComponentType<infer T> ? T : never;

/**
 * Type-erased component handle, used where the data shape is irrelevant
 * (queries, registry iteration, generic tooling).
 * `ComponentType` is covariant in `T`, so every component type widens to it.
 */
export type AnyComponentType = ComponentType<unknown>;
