import type { Entity } from '../types';

/**
 * Backing store for one component type.
 *
 * The default implementation is a sparse map. Hot numeric components swap in
 * a packed SoA without changing `getComponent` / `updateComponent` call sites.
 */
export interface ComponentStore<T = unknown> {
    readonly size: number;
    get(entityId: Entity): T | undefined;
    set(entityId: Entity, data: T): void;
    has(entityId: Entity): boolean;
    delete(entityId: Entity): boolean;
    clear(): void;
    keys(): IterableIterator<Entity>;
    forEach(callback: (data: T, entityId: Entity) => void): void;
    /**
     * Detached deep copy of one value, safe to `set` onto another store.
     * Views must not be cloned with `structuredClone` (they alias the buffers).
     */
    snapshot(entityId: Entity): T | undefined;
    /** Independent copy of the whole store. */
    clone(): ComponentStore<T>;
}

/**
 * Map-backed store for components that are not packed into typed arrays.
 */
export class SparseStore<T> implements ComponentStore<T> {
    private readonly data = new Map<Entity, T>();

    public get size(): number {
        return this.data.size;
    }

    public get(entityId: Entity): T | undefined {
        return this.data.get(entityId);
    }

    public set(entityId: Entity, data: T): void {
        this.data.set(entityId, data);
    }

    public has(entityId: Entity): boolean {
        return this.data.has(entityId);
    }

    public delete(entityId: Entity): boolean {
        return this.data.delete(entityId);
    }

    public clear(): void {
        this.data.clear();
    }

    public keys(): IterableIterator<Entity> {
        return this.data.keys();
    }

    public forEach(callback: (data: T, entityId: Entity) => void): void {
        this.data.forEach(callback);
    }

    public snapshot(entityId: Entity): T | undefined {
        const value = this.data.get(entityId);
        return value === undefined ? undefined : structuredClone(value);
    }

    public clone(): ComponentStore<T> {
        const copy = new SparseStore<T>();
        this.data.forEach((value, entityId) => {
            copy.data.set(entityId, structuredClone(value));
        });
        return copy;
    }
}

/**
 * Creates an empty sparse (map-backed) component store.
 */
export const createSparseStore = <T>(): ComponentStore<T> => new SparseStore<T>();
