import type { Entity } from '../types';
import type { Transform, Vec3 } from '../components/transform';
import type { ComponentStore } from './store';
import { createPackedVec3, type PackedVec3Handle } from './packed-vec3';

/** pos.xyz, rot.xyz, scale.xyz */
const TRS = 9;
const MAT = 16;
const PARENT_NONE = -1;

type VecHandles = [PackedVec3Handle, PackedVec3Handle, PackedVec3Handle];

/**
 * Packed Transform store: TRS floats, parent ids, dirty flags and world matrices
 * live in parallel typed arrays indexed by entity id.
 *
 * `set` binds the caller's object to those buffers so `addComponent` keeps
 * object identity — the transform system and tests hold that same reference.
 */
export class TransformStore implements ComponentStore<Transform> {
    private capacity = 0;
    private packed = new Float32Array(0);
    private matrices = new Float32Array(0);
    private parents = new Int32Array(0);
    private dirty = new Uint8Array(0);
    private readonly live = new Set<Entity>();
    private readonly views: (Transform | undefined)[] = [];
    private readonly vecHandles: (VecHandles | undefined)[] = [];

    public get size(): number {
        return this.live.size;
    }

    public get(entityId: Entity): Transform | undefined {
        if (!this.live.has(entityId)) return undefined;
        return this.views[entityId];
    }

    public set(entityId: Entity, data: Transform): void {
        this.ensureCapacity(entityId);
        this.live.add(entityId);
        this.write(entityId, data);

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

    public forEach(callback: (data: Transform, entityId: Entity) => void): void {
        for (const entityId of this.live) callback(this.views[entityId] as Transform, entityId);
    }

    public snapshot(entityId: Entity): Transform | undefined {
        if (!this.live.has(entityId)) return undefined;
        const row = entityId * TRS;
        const parent = this.parents[entityId];
        return {
            position: { x: this.packed[row], y: this.packed[row + 1], z: this.packed[row + 2] },
            rotation: { x: this.packed[row + 3], y: this.packed[row + 4], z: this.packed[row + 5] },
            scale: { x: this.packed[row + 6], y: this.packed[row + 7], z: this.packed[row + 8] },
            parent: parent === PARENT_NONE ? null : parent,
            worldMatrix: this.matrices.slice(entityId * MAT, entityId * MAT + MAT),
            isDirty: this.dirty[entityId] === 1
        };
    }

    public clone(): ComponentStore<Transform> {
        const copy = new TransformStore();
        if (this.capacity === 0) return copy;
        copy.ensureCapacity(this.capacity - 1);
        copy.packed.set(this.packed);
        copy.matrices.set(this.matrices);
        copy.parents.set(this.parents);
        copy.dirty.set(this.dirty);
        for (const entityId of this.live) {
            const snap = this.snapshot(entityId);
            if (!snap) continue;
            copy.live.add(entityId);
            copy.bind(snap, entityId);
            copy.views[entityId] = snap;
        }
        return copy;
    }

    private write(entityId: Entity, data: Transform): void {
        const row = entityId * TRS;
        this.packed[row] = data.position.x;
        this.packed[row + 1] = data.position.y;
        this.packed[row + 2] = data.position.z;
        this.packed[row + 3] = data.rotation.x;
        this.packed[row + 4] = data.rotation.y;
        this.packed[row + 5] = data.rotation.z;
        this.packed[row + 6] = data.scale.x;
        this.packed[row + 7] = data.scale.y;
        this.packed[row + 8] = data.scale.z;
        this.parents[entityId] = data.parent === null ? PARENT_NONE : data.parent;
        this.dirty[entityId] = data.isDirty ? 1 : 0;
        this.matrices.set(data.worldMatrix, entityId * MAT);
    }

    private bind(target: Transform, entityId: Entity): void {
        const pos: PackedVec3Handle = { packed: this.packed, index: entityId, stride: TRS, offset: 0, dead: false };
        const rot: PackedVec3Handle = { packed: this.packed, index: entityId, stride: TRS, offset: 3, dead: false };
        const scl: PackedVec3Handle = { packed: this.packed, index: entityId, stride: TRS, offset: 6, dead: false };
        this.vecHandles[entityId] = [pos, rot, scl];

        target.position = createPackedVec3(pos) as Vec3;
        target.rotation = createPackedVec3(rot) as Vec3;
        target.scale = createPackedVec3(scl) as Vec3;
        target.worldMatrix = this.matrices.subarray(entityId * MAT, entityId * MAT + MAT);

        const store = this;
        Object.defineProperty(target, 'parent', {
            enumerable: true,
            configurable: true,
            get: (): Entity | null => {
                const value = store.parents[entityId];
                return value === PARENT_NONE ? null : value;
            },
            set: (value: Entity | null): void => {
                store.parents[entityId] = value === null ? PARENT_NONE : value;
            }
        });
        Object.defineProperty(target, 'isDirty', {
            enumerable: true,
            configurable: true,
            get: (): boolean => store.dirty[entityId] === 1,
            set: (value: boolean): void => {
                store.dirty[entityId] = value ? 1 : 0;
            }
        });
    }

    private unbind(entityId: Entity): void {
        const handles = this.vecHandles[entityId];
        if (handles) {
            for (const handle of handles) handle.dead = true;
            this.vecHandles[entityId] = undefined;
        }
    }

    private ensureCapacity(entityId: Entity): void {
        if (entityId < this.capacity) return;

        const next = Math.max(entityId + 1, this.capacity === 0 ? 8 : this.capacity * 2);
        const packed = new Float32Array(next * TRS);
        const matrices = new Float32Array(next * MAT);
        const parents = new Int32Array(next);
        const dirty = new Uint8Array(next);

        packed.set(this.packed);
        matrices.set(this.matrices);
        parents.set(this.parents);
        dirty.set(this.dirty);
        parents.fill(PARENT_NONE, this.capacity);

        this.packed = packed;
        this.matrices = matrices;
        this.parents = parents;
        this.dirty = dirty;
        this.capacity = next;

        for (const handles of this.vecHandles) {
            if (!handles) continue;
            for (const handle of handles) handle.packed = packed;
        }
        for (const entity of this.live) {
            const view = this.views[entity];
            if (view) view.worldMatrix = matrices.subarray(entity * MAT, entity * MAT + MAT);
        }
    }
}

/**
 * Creates a packed Transform store.
 */
export const createTransformStore = (): ComponentStore<Transform> => new TransformStore();
