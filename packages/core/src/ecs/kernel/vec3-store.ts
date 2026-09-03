import type { Entity } from '../types';
import type { ComponentStore } from './store';
import { createPackedVec3, type PackedVec3Handle } from './packed-vec3';

/** One `{ x, y, z }` record packed as three consecutive floats. */
const STRIDE = 3;

/**
 * Dense SoA store for `{ x, y, z }` components such as Velocity.
 * Rows are indexed by entity id; the buffer grows when a higher id appears.
 */
export class Vec3Store<T extends { x: number; y: number; z: number }> implements ComponentStore<T> {
    private capacity = 0;
    private packed = new Float32Array(0);
    private readonly live = new Set<Entity>();
    private readonly views: (T | undefined)[] = [];
    private readonly handles: (PackedVec3Handle | undefined)[] = [];

    public get size(): number {
        return this.live.size;
    }

    public get(entityId: Entity): T | undefined {
        if (!this.live.has(entityId)) return undefined;
        return this.views[entityId];
    }

    public set(entityId: Entity, data: T): void {
        this.ensureCapacity(entityId);
        this.live.add(entityId);
        const row = entityId * STRIDE;
        this.packed[row] = data.x;
        this.packed[row + 1] = data.y;
        this.packed[row + 2] = data.z;

        const previous = this.views[entityId];
        if (previous && previous !== data) this.unbind(entityId);

        this.bind(data, entityId);
        this.views[entityId] = data;
    }

    public has(entityId: Entity): boolean {
        return this.live.has(entityId);
    }

    public delete(entityId: Entity): boolean {
        if (!this.live.delete(entityId)) return false;
        this.unbind(entityId);
        this.views[entityId] = undefined;
        return true;
    }

    public clear(): void {
        for (const entityId of [...this.live]) {
            this.unbind(entityId);
            this.views[entityId] = undefined;
        }
        this.live.clear();
    }

    public keys(): IterableIterator<Entity> {
        return this.live.keys();
    }

    public forEach(callback: (data: T, entityId: Entity) => void): void {
        for (const entityId of this.live) callback(this.views[entityId] as T, entityId);
    }

    public snapshot(entityId: Entity): T | undefined {
        if (!this.live.has(entityId)) return undefined;
        const row = entityId * STRIDE;
        return { x: this.packed[row], y: this.packed[row + 1], z: this.packed[row + 2] } as T;
    }

    public clone(): ComponentStore<T> {
        const copy = new Vec3Store<T>();
        if (this.capacity === 0) return copy;
        copy.ensureCapacity(this.capacity - 1);
        copy.packed.set(this.packed);
        for (const entityId of this.live) {
            const snap = this.snapshot(entityId);
            if (!snap) continue;
            copy.live.add(entityId);
            copy.bind(snap, entityId);
            copy.views[entityId] = snap;
        }
        return copy;
    }

    private bind(target: T, entityId: Entity): void {
        const handle: PackedVec3Handle = {
            packed: this.packed,
            index: entityId,
            stride: STRIDE,
            offset: 0,
            dead: false
        };
        this.handles[entityId] = handle;
        const view = createPackedVec3(handle);
        Object.defineProperties(target, {
            x: { enumerable: true, configurable: true, get: () => view.x, set: (value: number) => { view.x = value; } },
            y: { enumerable: true, configurable: true, get: () => view.y, set: (value: number) => { view.y = value; } },
            z: { enumerable: true, configurable: true, get: () => view.z, set: (value: number) => { view.z = value; } }
        });
    }

    private unbind(entityId: Entity): void {
        const handle = this.handles[entityId];
        if (handle) handle.dead = true;
        this.handles[entityId] = undefined;
    }

    private ensureCapacity(entityId: Entity): void {
        if (entityId < this.capacity) return;

        const next = Math.max(entityId + 1, this.capacity === 0 ? 8 : this.capacity * 2);
        const packed = new Float32Array(next * STRIDE);
        packed.set(this.packed);
        this.packed = packed;
        this.capacity = next;

        for (const handle of this.handles) {
            if (handle) handle.packed = packed;
        }
    }
}

/**
 * Creates a packed `{ x, y, z }` store.
 */
export const createVec3Store = <T extends { x: number; y: number; z: number }>(): ComponentStore<T> =>
    new Vec3Store<T>();
